// server/routes/webhooks.js
import express from "express";
import { prisma } from "../prisma/prismaClient.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 2000,
});

router.post("/sendgrid-events", express.json(), webhookLimiter, async (req, res) => {
  console.log("🔥 WEBHOOK HIT at", new Date().toISOString());
  
  try {
    const events = req.body;

    if (!Array.isArray(events)) {
      console.error("❌ Invalid webhook payload - not an array");
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    console.log(`📨 SendGrid events received: ${events.length}`);

    let processed = 0;
    let skipped = 0;
    let duplicates = 0;

    for (const event of events) {
      try {
        console.log(`\n📧 Processing event: ${event.event} for ${event.email}`);
        
        // ✅ Extract campaignId from multiple possible locations
        let campaignId = 
          event.custom_args?.campaignId ||
          event.customArgs?.campaignId ||
          event.unique_args?.campaignId ||
          event.campaignId;

        // ✅ Also try extracting from categories array
        if (!campaignId && Array.isArray(event.category)) {
          const catWithId = event.category.find(c => c?.startsWith('campaign_'));
          if (catWithId) {
            campaignId = catWithId.replace('campaign_', '');
          }
        }

        // ✅ Also try single category string
        if (!campaignId && typeof event.category === 'string' && event.category.startsWith('campaign_')) {
          campaignId = event.category.replace('campaign_', '');
        }

        if (!campaignId) {
          console.warn(`⚠️ Missing campaignId for event: ${event.event}, email: ${event.email}`);
          console.warn("Event data:", JSON.stringify(event, null, 2));
          skipped++;
          continue;
        }

        const parsedCampaignId = Number(campaignId);
        if (isNaN(parsedCampaignId)) {
          console.warn(`⚠️ Invalid campaignId: ${campaignId}`);
          skipped++;
          continue;
        }

        console.log(`✅ Found campaignId: ${parsedCampaignId}`);

        // Verify campaign exists
        const campaign = await prisma.campaign.findUnique({
          where: { id: parsedCampaignId },
          select: { id: true, userId: true, name: true },
        });

        if (!campaign) {
          console.warn(`⚠️ Campaign not found: ${parsedCampaignId}`);
          skipped++;
          continue;
        }

        console.log(`✅ Campaign found: ${campaign.name} (ID: ${campaign.id})`);

        // ✅ Check for duplicates using sg_event_id
        if (event.sg_event_id) {
          const existing = await prisma.campaignEvent.findFirst({
            where: { sgEventId: event.sg_event_id },
          });
          if (existing) {
            console.log(`⚠️ Duplicate event detected (sg_event_id: ${event.sg_event_id})`);
            duplicates++;
            continue;
          }
        }

        // ✅ Normalize event names
        let type = event.event;
        if (type === 'spam_report') type = 'spamreport';

        // ✅ Only store useful events
        const allowedEvents = ['delivered', 'open', 'click', 'bounce', 'spamreport', 'dropped', 'deferred'];
        if (!allowedEvents.includes(type)) {
          console.log(`⚠️ Skipping non-tracked event type: ${type}`);
          skipped++;
          continue;
        }

        // ✅ Save event to database
        const savedEvent = await prisma.campaignEvent.create({
          data: {
            campaignId: parsedCampaignId,
            userId: campaign.userId,
            type,
            email: event.email || null,
            url: event.url || null,
            ip: event.ip || null,
            userAgent: event.useragent || null,
            sgEventId: event.sg_event_id || null,
            timestamp: event.timestamp ? new Date(event.timestamp * 1000) : new Date(),
          },
        });

        console.log(`✅ Event saved: ${type} for ${event.email} (Event ID: ${savedEvent.id})`);
        processed++;

      } catch (err) {
        console.error("❌ Event processing error:", err.message);
        console.error("Event data:", JSON.stringify(event, null, 2));
      }
    }

    console.log(`\n📊 Webhook Summary: Processed: ${processed}, Skipped: ${skipped}, Duplicates: ${duplicates}`);

    return res.status(200).json({ 
      success: true, 
      processed,
      skipped,
      duplicates 
    });

  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.status(500).json({ error: "Webhook failed", details: err.message });
  }
});

// ✅ Test endpoint to verify webhook is accessible
router.get("/sendgrid-events", (req, res) => {
  res.json({ 
    message: "SendGrid webhook endpoint is active",
    timestamp: new Date().toISOString()
  });
});

export default router;