// server/routes/analytics.js
import express from "express";
import { prisma } from "../prisma/prismaClient.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

/* ==========================================================
   🧪 Health Check
========================================================== */
router.get("/", (req, res) => {
  res.json({ message: "Analytics route working" });
});

/* ==========================================================
   📊 SENDGRID SUMMARY (DB BASED, USER SCOPED)
========================================================== */
router.get("/sendgrid/summary", protect, async (req, res) => {
  const startDate = req.query.startDate || "2024-01-01";
  const endDate = req.query.endDate || new Date().toISOString().split("T")[0];

  try {
    const campaigns = await prisma.campaign.findMany({
      where: {
        userId: req.user.id,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate + "T23:59:59.999Z"),
        },
      },
      include: { events: true },
    });

    let processed = 0;
    let delivered = 0;
    let opens = 0;
    let clicks = 0;
    let bounces = 0;
    let spam = 0;

    for (const c of campaigns) {
      const events = c.events || [];

      const processedEvents = events.filter(
        (e) => e.type === "processed",
      ).length;
      const deliveredEvents = events.filter(
        (e) => e.type === "delivered",
      ).length;
      const bounceEvents = events.filter((e) => e.type === "bounce").length;
      const droppedEvents = events.filter((e) => e.type === "dropped").length;

      const openEvents = events.filter((e) => e.type === "open").length;
      const clickEvents = events.filter((e) => e.type === "click").length;
      const spamEvents = events.filter((e) => e.type === "spamreport").length;

      processed += processedEvents || c.sentCount || 0;

      // ✅ Delivered logic (fallback if SendGrid does not emit delivered)
      if (deliveredEvents > 0) {
        delivered += deliveredEvents;
      } else {
        delivered += Math.max(
          0,
          processedEvents - bounceEvents - droppedEvents,
        );
      }

      opens += openEvents;
      clicks += clickEvents;
      bounces += bounceEvents;
      spam += spamEvents;
    }

    const openRate = delivered > 0 ? Math.round((opens / delivered) * 100) : 0;
    const clickRate =
      delivered > 0 ? Math.round((clicks / delivered) * 100) : 0;
    const deliveryRate =
      processed > 0 ? Math.round((delivered / processed) * 100) : 0;

    return res.json({
      source: "db",
      processed,
      delivered,
      opens,
      clicks,
      bounces,
      spam,
      openRate,
      clickRate,
      deliveryRate,
    });
  } catch (error) {
    console.error("❌ Error fetching summary:", error);
    return res.status(500).json({
      error: "Analytics unavailable",
      details: error.message,
    });
  }
});

/* ==========================================================
   📊 CAMPAIGN-LEVEL ANALYTICS
========================================================== */
router.get("/sendgrid/campaigns", protect, async (req, res) => {
  const startDate = req.query.startDate || "2024-01-01";
  const endDate = req.query.endDate || new Date().toISOString().split("T")[0];

  try {
    const campaigns = await prisma.campaign.findMany({
      where: {
        userId: req.user.id,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate + "T23:59:59.999Z"),
        },
      },
      include: { events: true },
      orderBy: { createdAt: "desc" },
    });

    const formatted = campaigns.map((c) => {
      const events = c.events || [];

      const processed = events.filter((e) => e.type === "processed").length;
      const deliveredRaw = events.filter((e) => e.type === "delivered").length;
      const bounces = events.filter((e) => e.type === "bounce").length;
      const dropped = events.filter((e) => e.type === "dropped").length;

      const opens = events.filter((e) => e.type === "open").length;
      const clicks = events.filter((e) => e.type === "click").length;
      const spam = events.filter((e) => e.type === "spamreport").length;

      const delivered =
        deliveredRaw > 0
          ? deliveredRaw
          : Math.max(0, processed - bounces - dropped);

      // Parse recipients
      let totalRecipients = 0;
      try {
        if (c.recipientsJson) {
          const parsed = JSON.parse(c.recipientsJson);
          totalRecipients = Array.isArray(parsed) ? parsed.length : 0;
        }
      } catch {}

      const pending =
        totalRecipients > 0 ? Math.max(0, totalRecipients - c.sentCount) : null;

      return {
        id: c.id,
        name: c.name,
        status: c.status,
        sentCount: c.sentCount,
        totalRecipients,
        pending,

        processedCount: processed,
        deliveredCount: delivered,
        openCount: opens,
        clickCount: clicks,
        bounceCount: bounces,
        spamCount: spam,

        openRate:
          delivered > 0 ? ((opens / delivered) * 100).toFixed(2) : "0.00",
        clickRate:
          delivered > 0 ? ((clicks / delivered) * 100).toFixed(2) : "0.00",
        deliveryRate:
          c.sentCount > 0
            ? ((delivered / c.sentCount) * 100).toFixed(2)
            : "0.00",
      };
    });

    res.json({ campaigns: formatted });
  } catch (err) {
    console.error("❌ Campaign analytics error:", err);
    res.status(500).json({ error: "Failed to load analytics" });
  }
});

export { router };
