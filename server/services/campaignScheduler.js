// ✅ FIXED: campaignScheduler.js - Proper scheduling logic

import sgMail from "@sendgrid/mail";
import { prisma } from "../prisma/prismaClient.js";

// ✅ Dedicated SendGrid client — the shared `sgMail` object gets its key
// overwritten by other files (mailer.js, emailService.js, imapSync.js),
// which made scheduled campaigns go out from the wrong SendGrid account
// ("no IPs are available for this account"). Same key + pool as campaigns.js.
const campaignMailer = new sgMail.MailService();
let campaignMailerKey = null;

async function sendCampaignMail(msg) {
  // Read env lazily: server.js calls dotenv.config() after imports load.
  const key = process.env.SENDGRID_CAMPAIGN_API_KEY || process.env.SENDGRID_API_KEY;
  if (!key) throw new Error("SendGrid campaign API key not configured");
  if (key !== campaignMailerKey) {
    campaignMailer.setApiKey(key);
    campaignMailerKey = key;
  }
  const pool = process.env.SENDGRID_IP_POOL;
  return campaignMailer.send(pool ? { ...msg, ipPoolName: pool } : msg);
}

/* ==========================================================
   HTML + Plain Text Generators
========================================================== */
const generateHtmlFromCanvas = (canvasData, subject, fromName, fromEmail) => {
  if (!canvasData || canvasData.length === 0) {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${subject}</title></head>
      <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td align="center" style="padding:20px;">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
              <tr><td style="padding:20px;background-color:#ffffff;">
                <h1 style="margin:0 0 20px 0;font-size:24px;color:#333333;">${subject}</h1>
                <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#333333;">
                  This email was sent from your campaign builder.
                </p>
                <hr style="border:none;height:1px;background-color:#eeeeee;margin:30px 0;">
                <p style="margin:0;font-size:12px;color:#999999;text-align:center;">
                  Sent by ${fromName}<br>
                  <a href="mailto:${fromEmail}" style="color:#007bff;">${fromEmail}</a>
                </p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body></html>`;
  }

  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${subject}</title></head>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td align="center" style="padding:20px;">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;">
            <tr><td style="padding:30px;">`;

  canvasData.forEach((element) => {
    switch (element.type) {
      case "heading":
        htmlContent += `<h1 style="margin:0 0 20px 0;font-size:${element.fontSize || 28}px;color:${element.color || "#333"};font-weight:bold;text-align:${element.textAlign || "left"};">${element.content || "Heading"}</h1>`;
        break;
      case "subheading":
        htmlContent += `<h2 style="margin:0 0 16px 0;font-size:${element.fontSize || 22}px;color:${element.color || "#333"};font-weight:600;text-align:${element.textAlign || "left"};">${element.content || "Subheading"}</h2>`;
        break;
      case "paragraph":
        const paragraphs = (element.content || "Paragraph text").split("\n").filter((p) => p.trim());
        paragraphs.forEach((p) => {
          htmlContent += `<p style="margin:0 0 16px 0;font-size:${element.fontSize || 16}px;color:${element.color || "#333"};line-height:1.6;text-align:${element.textAlign || "left"};">${p.trim()}</p>`;
        });
        break;
      case "image":
        htmlContent += `<div style="margin:20px 0;text-align:${element.textAlign || "center"};"><img src="${element.src}" alt="${element.alt || "Image"}" style="max-width:100%;height:auto;display:block;margin:0 auto;" /></div>`;
        break;
      case "button":
        htmlContent += `
          <table cellpadding="0" cellspacing="0" border="0" style="margin:25px auto;">
            <tr><td style="background-color:${element.backgroundColor || "#007bff"};padding:12px 24px;border-radius:6px;">
              <a href="${element.link || "#"}" style="color:${element.color || "#ffffff"};text-decoration:none;font-weight:bold;font-size:${element.fontSize || 16}px;">${element.content || "Click Me"}</a>
            </td></tr>
          </table>`;
        break;
      case "line":
        htmlContent += `<hr style="border:none;height:${element.strokeWidth || 1}px;background-color:${element.strokeColor || "#dee2e6"};margin:25px 0;" />`;
        break;
    }
  });

  htmlContent += `
            </td></tr>
            <tr><td style="padding:20px;background-color:#f8f9fa;border-top:1px solid #dee2e6;text-align:center;">
              <p style="margin:0 0 10px 0;font-size:12px;color:#6c757d;">This email was sent by <strong>${fromName}</strong></p>
              <p style="margin:0;font-size:11px;color:#999999;"><a href="mailto:${fromEmail}" style="color:#007bff;">${fromEmail}</a></p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body></html>`;
  return htmlContent;
};

const generatePlainTextFromCanvas = (canvasData, subject, fromName, fromEmail) => {
  let plainText = `${subject}\n\n`;
  if (!canvasData || canvasData.length === 0) {
    plainText += "This email was sent from your campaign builder.\n\n";
  } else {
    canvasData.forEach((el) => {
      switch (el.type) {
        case "heading":
        case "subheading":
        case "paragraph":
          plainText += `${el.content || ""}\n\n`;
          break;
        case "image":
          plainText += `[Image: ${el.alt || "Image"}]\n\n`;
          break;
        case "button":
          plainText += `[${el.content || "Button"}] - ${el.link || "#"}\n\n`;
          break;
        case "line":
          plainText += "----------------------------------------\n\n";
          break;
      }
    });
  }
  plainText += `\n\nSent by ${fromName}\nEmail: ${fromEmail}`;
  return plainText;
};

/* ==========================================================
   🚀 SEND CAMPAIGN EMAILS
========================================================== */
async function sendCampaignEmails(campaign, recipients) {
  console.log(`📧 Sending campaign ${campaign.id} to ${recipients.length} recipients`);

  const canvasData = JSON.parse(campaign.designJson || "[]");
  const htmlContent = generateHtmlFromCanvas(canvasData, campaign.subject, campaign.fromName, campaign.fromEmail);
  const plainTextContent = generatePlainTextFromCanvas(canvasData, campaign.subject, campaign.fromName, campaign.fromEmail);

  const results = { success: [], failed: [] };
  let actualSentCount = 0;

  // Get user credits
  const payments = await prisma.payment.findMany({
    where: { userId: campaign.userId, status: "succeeded" },
    select: { emailSendCredits: true },
  });

  const totalPaymentCredits = payments.reduce((sum, p) => sum + (p.emailSendCredits || 0), 0);

  const user = await prisma.user.findUnique({
    where: { id: campaign.userId },
    select: { emailLimit: true },
  });

  const availableCredits = (user?.emailLimit ?? 0) + totalPaymentCredits;

  // ✅ Check if user has enough credits
  if (availableCredits < recipients.length) {
    console.error(`❌ Insufficient credits for campaign ${campaign.id}. Required: ${recipients.length}, Available: ${availableCredits}`);
    
    // Create automation log for failed campaign
    await prisma.automationLog.create({
      data: {
        userId: campaign.userId,
        campaignId: campaign.id,
        campaignName: campaign.name,
        status: 'failed',
        message: 'Campaign failed: Insufficient credits',
        error: `Required ${recipients.length} credits but only have ${availableCredits}`,
      },
    });

    return { results: { success: [], failed: recipients.map(r => ({ email: r.email || r, error: 'Insufficient credits' })) }, actualSentCount: 0, creditsRemaining: availableCredits };
  }

  // Send emails
  for (const r of recipients) {
    const toEmail = typeof r === "string" ? r : r.email;
    if (!toEmail) continue;
    if (actualSentCount >= availableCredits) {
      results.failed.push({ email: toEmail, error: "Insufficient credits" });
      continue;
    }

    const msg = {
      to: toEmail,
      from: { name: campaign.fromName, email: campaign.fromEmail },
      subject: campaign.subject,
      text: plainTextContent,
      html: htmlContent,
      customArgs: { campaignId: campaign.id.toString() },
      categories: [`campaign_${campaign.id}`],
    };

    try {
      const response = await sendCampaignMail(msg);
      if (response[0].statusCode >= 200 && response[0].statusCode < 300) {
        results.success.push({ email: toEmail });
        actualSentCount++;
      } else {
        results.failed.push({ email: toEmail, error: `SendGrid status ${response[0].statusCode}` });
      }
    } catch (err) {
      const msgErr = err.response?.body?.errors?.[0]?.message || err.message || "Unknown error";
      console.error(`❌ Failed to send to ${toEmail}:`, msgErr);
      results.failed.push({ email: toEmail, error: msgErr });
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  // Deduct credits
  const newUserCredits = Math.max(0, (user.emailLimit ?? 0) - actualSentCount);

  const latestPayment = await prisma.payment.findFirst({
    where: { userId: campaign.userId, status: "succeeded" },
    orderBy: { paymentDate: "desc" },
  });

  if (latestPayment) {
    const updatedSendCredits = Math.max(0, (latestPayment.emailSendCredits || 0) - actualSentCount);
    await prisma.payment.update({
      where: { id: latestPayment.id },
      data: { emailSendCredits: updatedSendCredits },
    });
  }

  await prisma.user.update({
    where: { id: campaign.userId },
    data: { emailLimit: newUserCredits },
  });

  // ✅ Update campaign status
  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { 
      sentCount: actualSentCount,
      status: results.failed.length === 0 ? 'sent' : 'failed'
    },
  });

  // ✅ Create automation log
  await prisma.automationLog.create({
    data: {
      userId: campaign.userId,
      campaignId: campaign.id,
      campaignName: campaign.name,
      status: results.failed.length === 0 ? 'sent' : 'failed',
      message: `Campaign sent: ${results.success.length} success, ${results.failed.length} failed`,
      error: results.failed.length > 0 ? `${results.failed.length} emails failed` : null,
    },
  });

  console.log(`✅ Campaign ${campaign.id} sent: ${results.success.length} success, ${results.failed.length} failed`);

  return { results, actualSentCount, creditsRemaining: newUserCredits };
}

/* ==========================================================
   ⏰ CHECK AND PROCESS SCHEDULED CAMPAIGNS
========================================================== */
export async function processScheduledCampaigns() {
  try {
    const now = new Date();
    console.log(`⏰ Checking scheduled campaigns at ${now.toISOString()}`);

    // ✅ Find scheduled campaigns that are due (with 2-minute window)
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
    
    const dueCampaigns = await prisma.campaign.findMany({
      where: {
        scheduleType: "scheduled",
        scheduledAt: { 
          gte: twoMinutesAgo,
          lte: now 
        },
        sentCount: 0, // Not yet sent
        status: { not: 'sent' }
      },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });

    console.log(`📋 Found ${dueCampaigns.length} scheduled campaigns due`);

    for (const campaign of dueCampaigns) {
      try {
        console.log(`📤 Processing scheduled campaign ${campaign.id}: ${campaign.name}`);
        
        // ✅ Get recipients from stored JSON
        let recipients = [];
        
        if (campaign.recipientsJson) {
          try {
            recipients = JSON.parse(campaign.recipientsJson);
          } catch (e) {
            console.error(`❌ Failed to parse recipients for campaign ${campaign.id}`);
            await prisma.automationLog.create({
              data: {
                userId: campaign.userId,
                campaignId: campaign.id,
                campaignName: campaign.name,
                status: 'failed',
                message: 'Failed to parse recipients',
                error: e.message,
              },
            });
            continue;
          }
        } else {
          // Fallback: Get all contacts if no recipients stored
          const contacts = await prisma.contact.findMany({
            where: { userId: campaign.userId },
            select: { email: true },
          });
          recipients = contacts.map(c => c.email);
        }

        if (recipients.length === 0) {
          console.log(`⚠️ No recipients for campaign ${campaign.id}`);
          await prisma.automationLog.create({
            data: {
              userId: campaign.userId,
              campaignId: campaign.id,
              campaignName: campaign.name,
              status: 'failed',
              message: 'No recipients found',
            },
          });
          continue;
        }

        // ✅ Mark as processing
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'processing' },
        });

        // Send the campaign
        await sendCampaignEmails(campaign, recipients);

        console.log(`✅ Scheduled campaign ${campaign.id} sent successfully`);
      } catch (error) {
        console.error(`❌ Error sending scheduled campaign ${campaign.id}:`, error);
        
        await prisma.automationLog.create({
          data: {
            userId: campaign.userId,
            campaignId: campaign.id,
            campaignName: campaign.name,
            status: 'failed',
            message: 'Campaign failed to send',
            error: error.message,
          },
        });
      }
    }
  } catch (error) {
    console.error("❌ Error processing scheduled campaigns:", error);
  }
}

/* ==========================================================
   🔄 CHECK AND PROCESS RECURRING CAMPAIGNS
========================================================== */
export async function processRecurringCampaigns() {
  try {
    const now = new Date();
    console.log(`🔄 Checking recurring campaigns at ${now.toISOString()}`);

    const recurringCampaigns = await prisma.campaign.findMany({
      where: {
        scheduleType: "recurring",
        OR: [
          { recurringEndDate: null },
          { recurringEndDate: { gte: now } },
        ],
      },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });

    console.log(`📋 Found ${recurringCampaigns.length} active recurring campaigns`);

    for (const campaign of recurringCampaigns) {
      try {
        // ✅ Check if it's time to send based on frequency
        const shouldSend = checkIfShouldSendRecurring(campaign, now);

        if (!shouldSend) {
          console.log(`⏭️ Skipping recurring campaign ${campaign.id} - not time yet`);
          continue;
        }

        console.log(`📤 Processing recurring campaign ${campaign.id}: ${campaign.name}`);

        // Get recipients
        let recipients = [];
        if (campaign.recipientsJson) {
          try {
            recipients = JSON.parse(campaign.recipientsJson);
          } catch (e) {
            console.error(`❌ Failed to parse recipients for campaign ${campaign.id}`);
            continue;
          }
        } else {
          const contacts = await prisma.contact.findMany({
            where: { userId: campaign.userId },
            select: { email: true },
          });
          recipients = contacts.map(c => c.email);
        }

        if (recipients.length === 0) {
          console.log(`⚠️ No recipients for recurring campaign ${campaign.id}`);
          continue;
        }

        // Send the campaign
        await sendCampaignEmails(campaign, recipients);

        // ✅ Update last sent time
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { lastSentAt: now },
        });

        console.log(`✅ Recurring campaign ${campaign.id} sent successfully`);
      } catch (error) {
        console.error(`❌ Error sending recurring campaign ${campaign.id}:`, error);
      }
    }
  } catch (error) {
    console.error("❌ Error processing recurring campaigns:", error);
  }
}

/* ==========================================================
   📅 CHECK IF RECURRING CAMPAIGN SHOULD SEND
========================================================== */
function checkIfShouldSendRecurring(campaign, now) {
  if (!campaign.scheduledAt) return false;

  const scheduledTime = new Date(campaign.scheduledAt);
  const lastSent = campaign.lastSentAt ? new Date(campaign.lastSentAt) : null;

  // Parse recurring days if weekly
  let recurringDays = [];
  try {
    recurringDays = campaign.recurringDays ? JSON.parse(campaign.recurringDays) : [];
  } catch (e) {
    recurringDays = [];
  }

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const scheduledHour = scheduledTime.getHours();
  const scheduledMinute = scheduledTime.getMinutes();

  // ✅ Check if we're within the scheduled time window (±5 minutes)
  const isTimeMatch = 
    currentHour === scheduledHour &&
    Math.abs(currentMinute - scheduledMinute) <= 5;

  if (!isTimeMatch) return false;

  // ✅ Check frequency
  switch (campaign.recurringFrequency) {
    case "daily":
      // Send if not sent today
      if (!lastSent) return true;
      const lastSentDate = lastSent.toDateString();
      const todayDate = now.toDateString();
      return lastSentDate !== todayDate;

    case "weekly":
      // Check if today is one of the selected days
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const todayName = dayNames[now.getDay()];
      
      if (!recurringDays.includes(todayName)) return false;
      
      // Send if not sent today
      if (!lastSent) return true;
      return lastSent.toDateString() !== now.toDateString();

    case "monthly":
      // Send on the same day of month
      const scheduledDay = scheduledTime.getDate();
      const currentDay = now.getDate();
      
      if (scheduledDay !== currentDay) return false;
      
      // Send if not sent this month
      if (!lastSent) return true;
      return lastSent.getMonth() !== now.getMonth() || lastSent.getFullYear() !== now.getFullYear();

    default:
      return false;
  }
}

/* ==========================================================
   🎯 START SCHEDULER (Call this in server.js)
========================================================== */
export function startCampaignScheduler() {
  console.log("🚀 Starting campaign scheduler...");

  // ✅ Check every minute for scheduled campaigns
  setInterval(processScheduledCampaigns, 60 * 1000);

  // ✅ Check every minute for recurring campaigns
  setInterval(processRecurringCampaigns, 60 * 1000);

  // ✅ Run immediately on startup
  processScheduledCampaigns();
  processRecurringCampaigns();

  console.log("✅ Campaign scheduler started - checking every minute");
}