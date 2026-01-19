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
  console.log("🔥 WEBHOOK HIT");
  console.log(req.body);

  try {
    const events = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    console.log(`📨 SendGrid events received: ${events.length}`);

    for (const event of events) {
      try {
        // ✅ Correct campaignId extraction (this is critical)
        const campaignId =
          event.custom_args?.campaignId ||
          event.unique_args?.campaignId ||
          event.campaignId ||
          event.category?.[0]?.replace("campaign_", "");


        if (!campaignId) {
          console.warn("⚠️ Missing campaignId, skipping event:", event.event);
          continue;
        }

        const parsedCampaignId = Number(campaignId);
        if (isNaN(parsedCampaignId)) continue;

        const campaign = await prisma.campaign.findUnique({
          where: { id: parsedCampaignId },
          select: { id: true, userId: true },
        });

        if (!campaign) {
          console.warn(`⚠️ Campaign not found: ${parsedCampaignId}`);
          continue;
        }

        // Avoid duplicates
        if (event.sg_event_id) {
          const existing = await prisma.campaignEvent.findFirst({
            where: { sgEventId: event.sg_event_id },
          });
          if (existing) continue;
        }

        // Normalize event names
        let type = event.event;
        if (type === "spam_report") type = "spamreport";

        // Only store useful events
        const allowed = ["delivered", "open", "click", "bounce", "spamreport"];
        if (!allowed.includes(type)) continue;

        await prisma.campaignEvent.create({
          data: {
            campaignId: parsedCampaignId,
            userId: campaign.userId,
            type,
            email: event.email || null,
            url: event.url || null,
            ip: event.ip || null,
            userAgent: event.useragent || null,
            sgEventId: event.sg_event_id || null,
          },
        });

        console.log(`✅ Saved event: ${type} (${event.email})`);
      } catch (err) {
        console.error("❌ Event processing error:", err.message);
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(500).json({ error: "Webhook failed" });
  }
});

export default router;
