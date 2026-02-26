// server/routes/analytics.js
import express from "express";
import { prisma } from "../prisma/prismaClient.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

/* ==========================================================
   🧪 Health Check
========================================================== */
router.get("/", (req, res) => {
  res.json({ message: "Analytics route working", timestamp: new Date().toISOString() });
});

// ✅ SendGrid Summary with DB (User-Specific)
router.get("/sendgrid/summary", protect, async (req, res) => {
  const startDate = req.query.startDate || "2024-01-01";
  const endDate = req.query.endDate || new Date().toISOString().split("T")[0];

  console.log(`📊 Fetching analytics summary for user ${req.user.id} from ${startDate} to ${endDate}`);

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

    console.log(`📧 Found ${campaigns.length} campaigns with events`);

    let processed = 0;
    let delivered = 0;
    let opens = 0;
    let uniqueOpens = 0;
    let clicks = 0;
    let uniqueClicks = 0;
    let bounces = 0;
    let spam = 0;

    for (const c of campaigns) {
      const events = c.events || [];

      processed += c.sentCount || 0;

      // Count all events
      delivered += events.filter(e => e.type === "delivered").length;
      bounces += events.filter(e => e.type === "bounce").length;
      spam += events.filter(e => e.type === "spamreport").length;

      // For opens and clicks, count both total and unique
      const openEvents = events.filter(e => e.type === "open");
      opens += openEvents.length;
      uniqueOpens += new Set(openEvents.map(e => e.email)).size;

      const clickEvents = events.filter(e => e.type === "click");
      clicks += clickEvents.length;
      uniqueClicks += new Set(clickEvents.map(e => e.email)).size;
    }

    // Calculate rates
    const openRate = delivered > 0 ? Math.round((uniqueOpens / delivered) * 100) : 0;
    const clickRate = delivered > 0 ? Math.round((uniqueClicks / delivered) * 100) : 0;
    const deliveryRate = processed > 0 ? Math.round((delivered / processed) * 100) : 0;
    const bounceRate = processed > 0 ? Math.round((bounces / processed) * 100) : 0;
    const spamRate = delivered > 0 ? Math.round((spam / delivered) * 100) : 0;

    console.log(`✅ Summary calculated: ${processed} processed, ${delivered} delivered, ${uniqueOpens} unique opens`);

    return res.json({
      source: "db",
      processed,
      delivered,
      opens,
      uniqueOpens,
      clicks,
      uniqueClicks,
      bounces,
      spam,
      openRate,
      clickRate,
      deliveryRate,
      bounceRate,
      spamRate,
    });
  } catch (error) {
    console.error("❌ Error fetching summary:", error);
    return res.status(500).json({
      error: "Analytics unavailable",
      details: error.message,
    });
  }
});


// ✅ Get detailed stats per campaign
router.get("/sendgrid/campaigns", protect, async (req, res) => {
  const startDate = req.query.startDate || "2024-01-01";
  const endDate = req.query.endDate || new Date().toISOString().split("T")[0];

  console.log(`📊 Fetching campaign details for user ${req.user.id}`);

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

    console.log(`📧 Found ${campaigns.length} campaigns`);

    const formatted = campaigns.map((c) => {
      const events = c.events || [];

      // Count events
      const deliveredEvents = events.filter(e => e.type === "delivered");
      const openEvents = events.filter(e => e.type === "open");
      const clickEvents = events.filter(e => e.type === "click");
      const bounceEvents = events.filter(e => e.type === "bounce");
      const spamEvents = events.filter(e => e.type === "spamreport");

      const delivered = deliveredEvents.length;
      const opens = openEvents.length;
      const clicks = clickEvents.length;
      const bounces = bounceEvents.length;
      const spam = spamEvents.length;

      // Calculate unique opens and clicks
      const uniqueOpens = new Set(openEvents.map(e => e.email)).size;
      const uniqueClicks = new Set(clickEvents.map(e => e.email)).size;

      // Calculate total recipients from recipientsJson
      let totalRecipients = 0;
      try {
        if (c.recipientsJson) {
          const parsed = JSON.parse(c.recipientsJson);
          totalRecipients = Array.isArray(parsed) ? parsed.length : 0;
        }
      } catch (err) {
        console.warn(`⚠️ Failed to parse recipientsJson for campaign ${c.id}`);
      }

      // Calculate pending emails
      const pending = totalRecipients > 0
        ? Math.max(0, totalRecipients - c.sentCount)
        : null;

      // Calculate rates
      const openRate = delivered > 0 ? ((uniqueOpens / delivered) * 100).toFixed(2) : "0.00";
      const clickRate = delivered > 0 ? ((uniqueClicks / delivered) * 100).toFixed(2) : "0.00";
      const deliveryRate = c.sentCount > 0 ? ((delivered / c.sentCount) * 100).toFixed(2) : "0.00";
      const bounceRate = c.sentCount > 0 ? ((bounces / c.sentCount) * 100).toFixed(2) : "0.00";

      return {
        id: c.id,
        name: c.name,
        status: c.status,
        createdAt: c.createdAt,
        scheduledAt: c.scheduledAt,
        
        // Counts
        sentCount: c.sentCount,
        totalRecipients,
        pending,

        // Event counts
        deliveredCount: delivered,
        openCount: opens,
        uniqueOpenCount: uniqueOpens,
        clickCount: clicks,
        uniqueClickCount: uniqueClicks,
        bounceCount: bounces,
        spamCount: spam,

        // Rates
        openRate: parseFloat(openRate),
        clickRate: parseFloat(clickRate),
        deliveryRate: parseFloat(deliveryRate),
        bounceRate: parseFloat(bounceRate),
      };
    });

    console.log(`✅ Returning ${formatted.length} formatted campaigns`);

    res.json({ campaigns: formatted });
  } catch (err) {
    console.error("❌ Analytics error:", err);
    res.status(500).json({ error: "Failed to load analytics", details: err.message });
  }
});

// ✅ Get events for a specific campaign
router.get("/campaigns/:campaignId/events", protect, async (req, res) => {
  const campaignId = parseInt(req.params.campaignId);

  if (isNaN(campaignId)) {
    return res.status(400).json({ error: "Invalid campaign ID" });
  }

  try {
    // Verify campaign belongs to user
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        userId: req.user.id,
      },
    });

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // Get all events for this campaign
    const events = await prisma.campaignEvent.findMany({
      where: { campaignId },
      orderBy: { timestamp: "desc" },
    });

    console.log(`✅ Found ${events.length} events for campaign ${campaignId}`);

    res.json({ events });
  } catch (err) {
    console.error("❌ Error fetching campaign events:", err);
    res.status(500).json({ error: "Failed to load events", details: err.message });
  }
});

export { router };
