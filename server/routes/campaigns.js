// server/routes/campaigns.js
import express from "express";
import sgMail from "@sendgrid/mail";
import { prisma } from "../prisma/prismaClient.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

/* ==========================================================
   HTML + Plain Text Generators
========================================================== */
const generateHtmlFromCanvas = (canvasData, subject, fromName, fromEmail, fromAddress, replyToEmail) => {

  // -------------- EMPTY TEMPLATE -----------------
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
              <h1 style="margin:0 0 20px 0;font-size:24px;color:#333;">${subject}</h1>
              <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#333;">
                This email was sent from your campaign builder.
              </p>
              <hr style="border:none;height:1px;background:#eee;margin:30px 0;">

              <div style="margin:0;padding:0;text-align:center;">
  
                <p style="margin:0;font-size:12px;color:#999;">
                  Sent by ${fromName}
                </p>

                <p style="margin:5px 0;font-size:12px;color:#999;">
                    ${fromAddress}
                </p>

                <p style="margin:0;font-size:12px;color:#999;">
                  <a href="mailto:${fromEmail}" style="color:#007bff;">
                    ${fromEmail}
                  </a>
                </p>

              </div>


            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>`;
  }


  // =====================================================
  // 1️⃣ NORMALIZE Y VALUES (Fix broken Y placements)
  // =====================================================
const CONTAINER_WIDTH = 600;

const normalized = canvasData.map((e) => {
  const x = Number(e.x) || 0;
  const width = Number(e.width) || 300;

  let computedAlign = e.textAlign;

if (!computedAlign) {
    const center = x + width / 2;
    
    // ✅ Updated thresholds to 200-400
    if (center >= 200 && center <= 400) {
      computedAlign = "center";
    } else if (center > 400) {
      computedAlign = "right";
    } else {
      computedAlign = "left";
    }
  }
  return {
    ...e,
    y: Number(e.y) || 0,
    x,
    width,
    textAlign: computedAlign
  };
});


  // =====================================================
  // 2️⃣ SORT ELEMENTS BY Y (top → bottom)
  // =====================================================
  const sorted = normalized.sort((a, b) => a.y - b.y);


  // =====================================================
  // 3️⃣ GROUP ELEMENTS INTO ROWS (for side-by-side support)
  // =====================================================
function groupRows(elements, threshold = 15) {  // ✅ Changed from 50 to 15 to match canvas
  let rows = [];

  // Sort elements by Y position first, then by X if Y is close
  const sortedElements = [...elements].sort((a, b) => {
    if (Math.abs(a.y - b.y) > 10) {
      return a.y - b.y;
    }
    return a.x - b.x;
  });

  sortedElements.forEach(el => {
    const elTop = el.y;
    const elBottom = el.y + (el.height || 80);
    const elMidpoint = el.y + ((el.height || 80) / 2);
    
    let added = false;

    for (let row of rows) {
      // Use first element in row as reference
      const rowEl = row[0];
      const rowMidpoint = rowEl.y + ((rowEl.height || 80) / 2);
      
      // ✅ Stricter grouping - only group if midpoints are very close
      if (Math.abs(elMidpoint - rowMidpoint) <= threshold) {
        row.push(el);
        added = true;
        break;
      }
    }

    if (!added) {
      rows.push([el]);
    }
  });

  // Sort items within each row by X position (left to right)
  rows.forEach(row => row.sort((a, b) => a.x - b.x));

  return rows;
}

  const rows = groupRows(sorted);


  // =====================================================
  // 4️⃣ RENDER FUNCTION (converts each element → HTML)
  // =====================================================
function renderElement(el) {
  switch (el.type) {

    case "heading":
      return `
        <h1 style="
          margin:6px 0;
          font-size:${el.fontSize || 28}px;
          color:${el.color || "#333"};
          background:${el.backgroundColor || "transparent"};
          font-weight:${el.fontWeight || "700"};
          font-family:${el.fontFamily || "Arial, sans-serif"};
          text-align:${el.textAlign || "left"};
          line-height:1.3;
        ">${el.content || "Heading"}</h1>
      `;

    case "subheading":
      return `
        <h2 style="
          margin:6px 0;
          font-size:${el.fontSize || 22}px;
          color:${el.color || "#333"};
          background:${el.backgroundColor || "transparent"};
          font-weight:${el.fontWeight || "600"};
          font-family:${el.fontFamily || "Arial, sans-serif"};
          text-align:${el.textAlign || "left"};
        ">${el.content || "Subheading"}</h2>
      `;

    case "paragraph":
      return `
        <div style="
          font-size:${el.fontSize || 16}px;
          color:${el.color || "#333"};
          background:${el.backgroundColor || "transparent"};
          font-family:${el.fontFamily || "Arial, sans-serif"};
          font-weight:${el.fontWeight || "normal"};
          font-style:${el.fontStyle || "normal"};
          text-decoration:${el.textDecoration || "none"};
          line-height:${el.lineHeight || 1.6};
          text-align:${el.textAlign || "left"};
          margin:8px 0;
          word-wrap:break-word;
          word-break:break-word;
          overflow-wrap:break-word;
          -webkit-hyphens:auto;
          -moz-hyphens:auto;
          hyphens:auto;
        ">
          ${el.content || "Paragraph text"}
        </div>
      `;

    case "blockquote":
      return `
        <div style="
          font-size:${el.fontSize || 16}px;
          color:${el.color || "#333"};
          background:${el.backgroundColor || "transparent"};
          font-family:${el.fontFamily || "Arial, sans-serif"};
          font-style:italic;
          border-left:4px solid ${el.borderColor || "#ccc"};
          padding-left:12px;
          margin:12px 0;
        ">${el.content || "Blockquote"}</div>
      `;

case "image": {
  let imgSrc = el.src;

  // 1️⃣ If blob/base64 → use placeholder OR block sending
  if (!imgSrc || imgSrc.startsWith("blob:") || imgSrc.startsWith("data:")) {
    console.warn("Invalid image source detected:", imgSrc);
    imgSrc = "https://via.placeholder.com/600x400?text=No+Image+Available";
  }

  // 2️⃣ If relative URL → convert to absolute (required for email)
  if (!imgSrc.startsWith("http://") && !imgSrc.startsWith("https://")) {
    imgSrc = `${process.env.API_BASE_URL}${imgSrc}`;
  }

  return `
    <div style="text-align:${el.textAlign || "center"};margin:12px 0;">
      <img 
        src="${imgSrc}"
        alt="${el.alt || "Image"}"
        style="
          display:block;
          margin:0 auto;
          width:100%;
          max-width:${el.width || 300}px;
          height:auto;
          border-radius:${el.borderRadius || 0}px;
          ${el.borderWidth ? `border:${el.borderWidth}px solid ${el.borderColor || "#ccc"};` : ""}
        "
      />
    </div>
  `;
}


case 'button': {
  // ✅ Calculate alignment from element position
  let buttonAlignment = el.textAlign;
  if (!buttonAlignment && el.x !== undefined) {
    const center = el.x + (el.width || 150) / 2;
    
    // ✅ Better thresholds for 600px canvas
    if (center >= 200 && center <= 400) {
      buttonAlignment = "center";
    } else if (center > 400) {
      buttonAlignment = "right";
    } else {
      buttonAlignment = "left";
    }
  }
  buttonAlignment = buttonAlignment || 'left';
  
  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin: 12px 0;">
      <tr>
        <td align="${buttonAlignment}">
          <a href="${el.link || '#'}" 
             style="display: inline-block;
                    padding: ${el.padding || '10px 18px'};
                    background-color: ${el.backgroundColor || '#c2831f'};
                    color: ${el.color || '#ffffff'};
                    text-decoration: none;
                    border-radius: ${el.borderRadius || 6}px;
                    font-weight: ${el.fontWeight || '700'};
                    font-size: ${el.fontSize || 16}px;
                    font-family: ${el.fontFamily || 'Arial, sans-serif'};">
            ${el.content || 'Click Me'}
          </a>
        </td>
      </tr>
    </table>
  `;
}
    case "line":
    return `
      <hr style="
        border:none;
        height:${el.strokeWidth || 1}px;
        background:${el.strokeColor || "#ddd"};
        margin:${el.marginTop || 12}px 0 ${el.marginBottom || 12}px 0;
      "/>
    `;

    case "rectangle":
      return `
        <div style="
          width:100%;
          height:${el.height || 100}px;
          background:${el.backgroundColor || "#4ECDC4"};
          ${el.borderWidth ? `border:${el.borderWidth}px solid ${el.borderColor || "#000"};` : ""}
          border-radius:${el.borderRadius || 4}px;
          margin:8px 0;
        "></div>
    `;
    case "social":
    return `
      <a href="${el.link || "#"}" target="_blank" style="margin:0 6px;display:inline-block;">
        <img src="${el.src}" width="32" height="32" style="display:inline-block;" />
      </a>
    `;


    case "circle":
      return `
        <div style="
          width:${Math.min(el.width || 100, el.height || 100)}px;
          height:${Math.min(el.width || 100, el.height || 100)}px;
          background:${el.backgroundColor || "#FF6B6B"};
          ${el.borderWidth ? `border:${el.borderWidth}px solid ${el.borderColor || "#000"};` : ""}
          border-radius:50%;
          margin:8px auto;
        "></div>
    `;

    default:
      return "";
  }
}


  // =====================================================
  // 5️⃣ BUILD FINAL HTML WITH AUTO SIDE-BY-SIDE ROWS
  // =====================================================
let htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center" style="padding:20px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#fff;max-width:600px;">
        <tr><td style="padding:30px;">`;

// ✅ Loop through rows exactly like SendCampaign preview
rows.forEach(row => {
  if (row.length > 1) {
    // Multi-column row
    const colWidth = Math.floor(100 / row.length);
    htmlContent += `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;"><tr>`;
    
    row.forEach(el => {
      htmlContent += `
        <td width="${colWidth}%" valign="top" style="padding:6px;">
          ${renderElement(el)}
        </td>
      `;
    });
    
    htmlContent += `</tr></table>`;
  } else {
    // Single element row
    htmlContent += `<div style="margin-bottom:8px;">${renderElement(row[0])}</div>`;
  }
});


  // =====================================================
  // 6️⃣ FOOTER
  // =====================================================
  htmlContent += `
          </td></tr>
          <tr>
            <td style="padding:20px;background:#f8f9fa;border-top:1px solid #ddd;text-align:center;">

              <p style="margin:0 0 5px;font-size:12px;color:#777;">
                Sent by <strong>${fromName}</strong>
              </p>

              <p style="margin:5px 0;font-size:12px;color:#777;">
                ${fromAddress}
              </p>

              <p style="margin:0;font-size:12px;color:#777;">
                Reply to:
                <a href="mailto:${replyToEmail || fromEmail}" style="color:#007bff;">
                  ${replyToEmail || fromEmail}
                </a>
              </p>


            </td>
          </tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>
  `;

  return htmlContent;
};



const generatePlainTextFromCanvas = (canvasData, subject, fromName, fromEmail, replyToEmail) => {
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
  plainText += `\n\nSent by ${fromName}\nReply To: ${replyToEmail || fromEmail}`;
  return plainText;
};

/* ==========================================================
   ✅ GET USER CREDITS (Accumulated from all payments)
========================================================== */
router.get("/credits", async (req, res) => {
  try {
    console.log("📊 Fetching accumulated credits for user:", req.user.id);

    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id, status: "succeeded" },
      select: { emailSendCredits: true, emailVerificationCredits: true },
    });

    const totalEmailSendCredits = payments.reduce((sum, p) => sum + (p.emailSendCredits || 0), 0);
    const totalEmailVerificationCredits = payments.reduce((sum, p) => sum + (p.emailVerificationCredits || 0), 0);

    // ✅ Return only what’s purchased
    const emailSendCredits = totalEmailSendCredits;
    const emailVerificationCredits = totalEmailVerificationCredits;

    console.log("✅ Payment-based Credits:", { emailSendCredits, emailVerificationCredits });

    res.json({
      success: true,
      emailSendCredits,
      emailVerificationCredits,
      plan: "Based on payments",
    });
  } catch (error) {
    console.error("❌ Error fetching credits:", error);
    res.status(500).json({ success: false, error: "Failed to fetch credits" });
  }
});


router.post("/send", async (req, res) => {
  try {
    console.log("📨 /api/campaigns/send called by user:", req.user?.id);

    const {
      recipients,
      fromEmail,
      fromName,
      fromAddress,
      replyToEmail, 
      subject,
      canvasData,
      scheduleType = "immediate",
      scheduledDate,
      scheduledTime,
      timezone,
      recurringFrequency,
      recurringDays,
      recurringEndDate,
    } = req.body;

    // 🧩 Basic validation
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: "No recipients specified" });
    }
    if (!fromEmail || !fromName) {
      return res.status(400).json({ error: "Missing sender fields (fromEmail/fromName)" });
    }
    if (!fromAddress) {
      return res.status(400).json({ error: "Sender address is required" });
    }


    const emailSubject = subject?.trim() || "Untitled Campaign";

    // ==========================================================
    // 🧮 STEP 1: Credit Validation
    // ==========================================================
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id, status: "succeeded" },
      select: { id: true, emailSendCredits: true },
    });

    const totalPaymentCredits = payments.reduce((sum, p) => sum + (p.emailSendCredits || 0), 0);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { emailLimit: true, plan: true },
    });

    const availableCredits = (user?.emailLimit ?? 0) + totalPaymentCredits;
    const requiredCredits = recipients.length;

    console.log(`📊 Credits check - Available: ${availableCredits}, Required: ${requiredCredits}`);

    if (availableCredits < requiredCredits) {
      return res.status(403).json({
        error: `Insufficient credits. You need ${requiredCredits} credits but only have ${availableCredits}.`,
        available: availableCredits,
        required: requiredCredits,
        creditLimitReached: true,
      });
    }

    // ==========================================================
    // 🧠 STEP 2: SendGrid setup
    // ==========================================================
    if (!process.env.SENDGRID_API_KEY) {
      return res.status(500).json({ error: "SendGrid API key not configured" });
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // ==========================================================
    // 💾 STEP 3: Prepare Scheduled DateTime
    // ==========================================================
    let scheduledDateTime = null;

    if (scheduleType !== "immediate" && scheduledDate && scheduledTime) {
      scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
      const now = new Date();
      if (scheduledDateTime <= now) {
        return res.status(400).json({
          error: "Scheduled time must be in the future (at least 5 minutes from now)",
        });
      }
      console.log(`📅 Campaign scheduled for: ${scheduledDateTime.toISOString()}`);
    }

    // ==========================================================
    // 💾 STEP 4: Create Campaign Record
    // ==========================================================
    const campaign = await prisma.campaign.create({
      data: {
        userId: req.user.id,
        name: emailSubject,
        subject: emailSubject,
        fromEmail,
        fromName,
        replyToEmail,
        fromAddress,
        scheduleType,
        designJson: JSON.stringify(canvasData || []),
        recipientsJson: JSON.stringify(recipients),
        scheduledAt: scheduledDateTime,
        recurringFrequency: scheduleType === "recurring" ? recurringFrequency : null,
        recurringDays: scheduleType === "recurring" ? JSON.stringify(recurringDays || []) : null,
        recurringEndDate: scheduleType === "recurring" && recurringEndDate ? new Date(recurringEndDate) : null,
        status: scheduleType === "immediate" ? "sending" : "scheduled",
      },
    });

    console.log(`✅ Campaign ${campaign.id} created with scheduleType: ${scheduleType}`);

    // ==========================================================
    // 🕒 STEP 5: If scheduled or recurring → Save only
    // ==========================================================
    if (scheduleType === "scheduled" || scheduleType === "recurring") {
      await prisma.automationLog.create({
        data: {
          userId: req.user.id,
          campaignId: campaign.id,
          campaignName: emailSubject,
          status: "scheduled",
          message:
            scheduleType === "scheduled"
              ? `Campaign scheduled for ${scheduledDateTime.toLocaleString()}`
              : `Recurring campaign created (${recurringFrequency})`,
        },
      });

      // 📝 Enhanced console logging for debugging
      console.log(`✅ Campaign ${campaign.id} scheduled:`);
      console.log(`   📧 Subject: ${emailSubject}`);
      console.log(`   📅 Date: ${scheduledDate} ${scheduledTime}`);
      console.log(`   👥 Recipients: ${recipients.length}`);
      console.log(`   🎨 Canvas Elements: ${canvasData?.length || 0}`);
      console.log(`   ⏰ Scheduled DateTime: ${scheduledDateTime.toISOString()}`);
      console.log(`   📍 Type: ${scheduleType}`);
      console.log(`   ✉️ From: ${fromName} <${fromEmail}>`);

      return res.status(200).json({
        success: true,
        message:
          scheduleType === "scheduled"
            ? `✅ Campaign scheduled for ${scheduledDate} at ${scheduledTime}.`
            : `✅ Recurring campaign created (${recurringFrequency}).`,
        campaignId: campaign.id,
        scheduledAt: scheduledDateTime,
        recipientCount: recipients.length,
        scheduleInfo: {
          date: scheduledDate,
          time: scheduledTime,
          timezone: timezone,
          type: scheduleType,
        },
      });
    }

    // ==========================================================
    // 🚀 STEP 6: Immediate Send
    // ==========================================================
    const htmlContent = generateHtmlFromCanvas(
        canvasData,
        subject,
        fromName,
        fromEmail,
        fromAddress,
        replyToEmail
      );

      const plainTextContent = generatePlainTextFromCanvas(
        canvasData,
        subject,
        fromName,
        fromEmail,
        replyToEmail
      );

    const results = { success: [], failed: [] };
    let actualSentCount = 0;

    console.log(`📤 Sending immediate campaign to ${recipients.length} recipients`);

    for (const r of recipients) {
      const toEmail = typeof r === "string" ? r : r.email;
      if (!toEmail) continue;
      if (actualSentCount >= availableCredits) {
        results.failed.push({ email: toEmail, error: "Credit limit reached" });
        break;
      }

      const msg = {
        to: toEmail,
        from: { name: fromName, email: fromEmail },
        replyTo: replyToEmail || fromEmail,
        subject: emailSubject,
        text: plainTextContent,
        html: htmlContent,
        customArgs: {
          campaignId: campaign.id,
        },
      };

      try {
        const response = await sgMail.send(msg);
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

    // ==========================================================
    // 💰 STEP 7: Deduct Credits (updated)
    // ==========================================================
    console.log("💰 Deducting credits after campaign send...");
    let remainingToDeduct = actualSentCount;

    // 1️⃣ Deduct from payments first (FIFO)
    const succeededPayments = await prisma.payment.findMany({
      where: { userId: req.user.id, status: "succeeded" },
      orderBy: { paymentDate: "asc" },
      select: { id: true, emailSendCredits: true },
    });

    for (const p of succeededPayments) {
      if (remainingToDeduct <= 0) break;
      const current = p.emailSendCredits || 0;
      const deduct = Math.min(current, remainingToDeduct);
      const newCredit = Math.max(0, current - deduct);

      await prisma.payment.update({
        where: { id: p.id },
        data: { emailSendCredits: newCredit },
      });

      remainingToDeduct -= deduct;
      console.log(`🧾 Deducted ${deduct} from payment ${p.id}, remaining: ${remainingToDeduct}`);
    }

    // 2️⃣ Deduct any remaining from user.emailLimit
    const finalUserEmailLimit = Math.max(0, (user.emailLimit ?? 0) - remainingToDeduct);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { emailLimit: finalUserEmailLimit },
    });

    console.log(`✅ Credits updated — user.emailLimit now ${finalUserEmailLimit}`);

    // 3️⃣ Calculate remaining credits total
    const remainingPaymentCredits = succeededPayments.reduce((sum, p) => sum + (p.emailSendCredits || 0), 0);
    const totalRemainingCredits = remainingPaymentCredits + finalUserEmailLimit;

    // ==========================================================
    // ✅ Update campaign + logs
    // ==========================================================
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        sentCount: actualSentCount,
        status: results.failed.length === 0 ? "completed" : "failed",
      },
    });

    await prisma.automationLog.create({
      data: {
        userId: req.user.id,
        campaignId: campaign.id,
        campaignName: emailSubject,
        status: results.failed.length === 0 ? "completed" : "failed",
        message: `Campaign sent: ${results.success.length} success, ${results.failed.length} failed`,
        error: results.failed.length > 0 ? `${results.failed.length} emails failed` : null,
      },
    });

    console.log(`✅ Immediate campaign sent - Success: ${results.success.length}, Failed: ${results.failed.length}`);

    // ==========================================================
    // 📤 STEP 8: Response
    // ==========================================================
    res.status(200).json({
      success: true,
      message: `Sent: ${results.success.length}, Failed: ${results.failed.length}`,
      campaignId: campaign.id,
      results,
      creditsUsed: actualSentCount,
      creditsRemaining: totalRemainingCredits,
    });
  } catch (err) {
    console.error("❌ Campaign send error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to process campaign",
    });
  }
});



router.get("/", async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { userId: req.user.id },
      include: { events: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(campaigns);
  } catch {
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.id },
      include: { events: true },
    });
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    res.json(campaign);
  } catch {
    res.status(500).json({ error: "Failed to fetch campaign" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const campaign = await prisma.campaign.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    await prisma.campaign.delete({ where: { id } });
    res.json({ message: "Campaign deleted successfully" });
  } catch {
    res.status(500).json({ error: "Failed to delete campaign" });
  }
});

/* ==========================================================
   ✅ VERIFY EMAIL IN SENDGRID (Check if sender is verified)
========================================================== */
router.post("/verify-email", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        verified: false, 
        error: 'Email address is required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        verified: false, 
        error: 'Invalid email format' 
      });
    }

    console.log(`🔍 Checking verification status for: ${email}`);

    // Check SendGrid verified senders using fetch
    const response = await fetch('https://api.sendgrid.com/v3/verified_senders', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ SendGrid API error:', response.status);
      return res.status(500).json({ 
        verified: false, 
        error: 'Failed to check verification status with SendGrid' 
      });
    }

    const data = await response.json();
    
    // Check if email exists in verified senders list
    const isVerified = data.results?.some(
      sender => sender.from_email?.toLowerCase() === email.toLowerCase() && 
                sender.verified === true
    );

    console.log(`${isVerified ? '✅' : '❌'} Email ${email} verification status: ${isVerified}`);

    return res.json({ 
      verified: isVerified,
      email: email,
      message: isVerified 
        ? 'Email is verified and ready to send campaigns' 
        : 'Email is not verified in SendGrid. Please verify it first.'
    });

  } catch (error) {
    console.error('❌ Error verifying email:', error);
    return res.status(500).json({ 
      verified: false, 
      error: 'Internal server error while checking verification' 
    });
  }
});


// Add this route to server/routes/campaigns.js after the /send route

/* ==========================================================
   📧 SEND SHUFFLED CAMPAIGN WITH MULTIPLE SUBJECT LINES
   Distributes emails across multiple subject lines
========================================================== */
/* ==========================================================
   📧 SEND SHUFFLED CAMPAIGN WITH MULTIPLE SUBJECT LINES
   Supports both immediate and scheduled sending
========================================================== */
router.post("/send-shuffled", async (req, res) => {
  try {
    console.log("🔀 /api/campaigns/send-shuffled called by user:", req.user?.id);
    console.log("📦 Request body:", JSON.stringify(req.body, null, 2));

    const {
      fromEmail,
      fromName,
      fromAddress,
      canvasData,
      distribution, // Array of { subject, emails, count }
      scheduleType = "immediate",
      scheduledDate,
      scheduledTime,
      timezone
    } = req.body;

    // Validation with detailed error messages
    if (!fromEmail) {
      console.error("❌ Missing fromEmail");
      return res.status(400).json({ error: "Missing fromEmail field" });
    }
    if (!fromName) {
      console.error("❌ Missing fromName");
      return res.status(400).json({ error: "Missing fromName field" });
    }
    if (!Array.isArray(distribution)) {
      console.error("❌ distribution is not an array:", typeof distribution);
      return res.status(400).json({ error: "Distribution must be an array" });
    }
    if (distribution.length === 0) {
      console.error("❌ distribution array is empty");
      return res.status(400).json({ error: "No distribution data provided" });
    }

    // Validate distribution structure
    for (let i = 0; i < distribution.length; i++) {
      const item = distribution[i];
      if (!item.subject) {
        console.error(`❌ Distribution item ${i} missing subject`);
        return res.status(400).json({ error: `Distribution item ${i} missing subject` });
      }
      if (!Array.isArray(item.emails)) {
        console.error(`❌ Distribution item ${i} emails is not an array`);
        return res.status(400).json({ error: `Distribution item ${i} emails must be an array` });
      }
      if (item.emails.length === 0) {
        console.error(`❌ Distribution item ${i} has no emails`);
        return res.status(400).json({ error: `Distribution item ${i} has no emails` });
      }
    }

    // Calculate total recipients
    const totalRecipients = distribution.reduce((sum, item) => sum + item.emails.length, 0);
    
    console.log(`📊 Shuffled campaign - ${distribution.length} subjects, ${totalRecipients} total recipients, scheduleType: ${scheduleType}`);

    // ==========================================================
    // 💰 STEP 1: Credit Validation
    // ==========================================================
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id, status: "succeeded" },
      select: { id: true, emailSendCredits: true },
    });

    const totalPaymentCredits = payments.reduce((sum, p) => sum + (p.emailSendCredits || 0), 0);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { emailLimit: true, plan: true },
    });

    const availableCredits = (user?.emailLimit ?? 0) + totalPaymentCredits;
    const requiredCredits = totalRecipients;

    console.log(`💳 Credits check - Available: ${availableCredits}, Required: ${requiredCredits}`);

    if (availableCredits < requiredCredits) {
      return res.status(403).json({
        error: `Insufficient credits. You need ${requiredCredits} credits but only have ${availableCredits}.`,
        available: availableCredits,
        required: requiredCredits,
        creditLimitReached: true,
      });
    }

    // ==========================================================
    // 📧 STEP 2: SendGrid setup
    // ==========================================================
    if (!process.env.SENDGRID_API_KEY) {
      return res.status(500).json({ error: "SendGrid API key not configured" });
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // ==========================================================
    // 💾 STEP 3: Prepare Scheduled DateTime
    // ==========================================================
    let scheduledDateTime = null;

    if (scheduleType === "scheduled" && scheduledDate && scheduledTime) {
      scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
      const now = new Date();
      if (scheduledDateTime <= now) {
        return res.status(400).json({
          error: "Scheduled time must be in the future (at least 5 minutes from now)",
        });
      }
      console.log(`📅 Shuffled campaign scheduled for: ${scheduledDateTime.toISOString()}`);
    }

    // ==========================================================
    // 💾 STEP 4: Create Campaign Records for Each Subject Line
    // ==========================================================
    const campaignIds = [];
    
    for (const item of distribution) {
      const campaign = await prisma.campaign.create({
        data: {
          userId: req.user.id,
          name: `${item.subject} (Shuffled Campaign)`,
          subject: item.subject,
          fromEmail,
          fromName,
          fromAddress,
          scheduleType,
          designJson: JSON.stringify(canvasData || []),
          recipientsJson: JSON.stringify(item.emails),
          scheduledAt: scheduledDateTime,
          status: scheduleType === "immediate" ? "sending" : "scheduled",
        },
      });
      campaignIds.push(campaign.id);
      console.log(`✅ Campaign ${campaign.id} created for subject: "${item.subject}"`);
    }

    // ==========================================================
    // 🕒 STEP 5: If scheduled → Save only and return
    // ==========================================================
    if (scheduleType === "scheduled") {
      // Create automation logs for each campaign
      for (let i = 0; i < campaignIds.length; i++) {
        await prisma.automationLog.create({
          data: {
            userId: req.user.id,
            campaignId: campaignIds[i],
            campaignName: distribution[i].subject,
            status: "scheduled",
            message: `Shuffled campaign scheduled for ${scheduledDateTime.toLocaleString()} - ${distribution[i].emails.length} recipients`,
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: `✅ Shuffled campaign scheduled for ${scheduledDate} at ${scheduledTime}. ${totalRecipients} emails will be sent across ${distribution.length} subject lines.`,
        campaignIds,
        scheduledAt: scheduledDateTime,
        distribution: distribution.map(d => ({
          subject: d.subject,
          count: d.count
        }))
      });
    }

    // ==========================================================
    // 🚀 STEP 6: Immediate Send
    // ==========================================================
    const results = { success: [], failed: [] };
    const distributionResults = [];
    let actualSentCount = 0;

    for (let i = 0; i < distribution.length; i++) {
      const item = distribution[i];
      const { subject, emails } = item;
      const campaignId = campaignIds[i];
      let sentForSubject = 0;
      let failedForSubject = 0;

      console.log(`📤 Sending with subject: "${subject}" to ${emails.length} recipients`);

      const htmlContent = generateHtmlFromCanvas(canvasData, subject, fromName, fromEmail,fromAddress);
      const plainTextContent = generatePlainTextFromCanvas(canvasData, subject, fromName, fromEmail);

      for (const email of emails) {
        if (actualSentCount >= availableCredits) {
          results.failed.push({ email, subject, error: "Credit limit reached" });
          failedForSubject++;
          break;
        }

        const msg = {
          to: email,
          from: { name: fromName, email: fromEmail },
          replyTo: replyToEmail || fromEmail,
          subject: subject,
          text: plainTextContent,
          html: htmlContent,

          // ✅ REQUIRED
          customArgs: {
            campaignId: campaignId,
          },
        };


        try {
          const response = await sgMail.send(msg);
          if (response[0].statusCode >= 200 && response[0].statusCode < 300) {
            results.success.push({ email, subject });
            actualSentCount++;
            sentForSubject++;
          } else {
            results.failed.push({ email, subject, error: `SendGrid status ${response[0].statusCode}` });
            failedForSubject++;
          }
        } catch (err) {
          const msgErr = err.response?.body?.errors?.[0]?.message || err.message || "Unknown error";
          console.error(`❌ Failed to send to ${email}:`, msgErr);
          results.failed.push({ email, subject, error: msgErr });
          failedForSubject++;
        }

        await new Promise((r) => setTimeout(r, 200)); // Rate limiting
      }

      // Update campaign status
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          sentCount: sentForSubject,
          status: failedForSubject === 0 ? "completed" : "failed",
        },
      });

      // Log for this subject
      await prisma.automationLog.create({
        data: {
          userId: req.user.id,
          campaignId: campaignId,
          campaignName: subject,
          status: failedForSubject === 0 ? "completed" : "failed",
          message: `Shuffled campaign sent: ${sentForSubject} success, ${failedForSubject} failed`,
          error: failedForSubject > 0 ? `${failedForSubject} emails failed` : null,
        },
      });

      distributionResults.push({
        subject,
        sent: sentForSubject,
        failed: failedForSubject,
        total: emails.length
      });
    }
// ==========================================================
    // 💰 STEP 7: Deduct Credits (ONLY for immediate sends)
    // ==========================================================
    if (scheduleType === "immediate") {
      console.log("💰 Deducting credits after shuffled campaign...");
      let remainingToDeduct = actualSentCount;

      // Deduct from payments first (FIFO)
      const succeededPayments = await prisma.payment.findMany({
        where: { userId: req.user.id, status: "succeeded" },
        orderBy: { paymentDate: "asc" },
        select: { id: true, emailSendCredits: true },
      });

      for (const p of succeededPayments) {
        if (remainingToDeduct <= 0) break;
        const current = p.emailSendCredits || 0;
        const deduct = Math.min(current, remainingToDeduct);
        const newCredit = Math.max(0, current - deduct);

        await prisma.payment.update({
          where: { id: p.id },
          data: { emailSendCredits: newCredit },
        });

        remainingToDeduct -= deduct;
        console.log(`💳 Deducted ${deduct} from payment ${p.id}, remaining: ${remainingToDeduct}`);
      }

      // Deduct remaining from user.emailLimit
      const finalUserEmailLimit = Math.max(0, (user.emailLimit ?? 0) - remainingToDeduct);

      await prisma.user.update({
        where: { id: req.user.id },
        data: { emailLimit: finalUserEmailLimit },
      });

      console.log(`✅ Credits updated – user.emailLimit now ${finalUserEmailLimit}`);

      // Calculate total remaining credits
      const updatedPayments = await prisma.payment.findMany({
        where: { userId: req.user.id, status: "succeeded" },
        select: { emailSendCredits: true },
      });
      const remainingPaymentCredits = updatedPayments.reduce((sum, p) => sum + (p.emailSendCredits || 0), 0);
      const totalRemainingCredits = remainingPaymentCredits + finalUserEmailLimit;

      // ==========================================================
      // 📤 STEP 8: Response for IMMEDIATE send
      // ==========================================================
      console.log(`✅ Shuffled campaign complete - Success: ${results.success.length}, Failed: ${results.failed.length}`);

      return res.status(200).json({
        success: true,
        message: `Sent: ${results.success.length}, Failed: ${results.failed.length}`,
        results,
        distribution: distributionResults,
        creditsUsed: actualSentCount,
        creditsRemaining: totalRemainingCredits,
      });
    }
    // Deduct remaining from user.emailLimit
    const finalUserEmailLimit = Math.max(0, (user.emailLimit ?? 0) - remainingToDeduct);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { emailLimit: finalUserEmailLimit },
    });

    console.log(`✅ Credits updated – user.emailLimit now ${finalUserEmailLimit}`);

    // Calculate total remaining credits
    const remainingPaymentCredits = succeededPayments.reduce((sum, p) => sum + (p.emailSendCredits || 0), 0);
    const totalRemainingCredits = remainingPaymentCredits + finalUserEmailLimit;

    // ==========================================================
    // 📤 STEP 8: Response
    // ==========================================================
    console.log(`✅ Shuffled campaign complete - Success: ${results.success.length}, Failed: ${results.failed.length}`);

    res.status(200).json({
      success: true,
      message: `Sent: ${results.success.length}, Failed: ${results.failed.length}`,
      results,
      distribution: distributionResults,
      creditsUsed: actualSentCount,
      creditsRemaining: totalRemainingCredits,
    });
  } catch (err) {
    console.error("❌ Shuffled campaign error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to process shuffled campaign",
    });
  }
});

export { router };