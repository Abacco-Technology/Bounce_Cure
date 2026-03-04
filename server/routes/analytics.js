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

  try {

    // ===============================
    // 1️⃣ Get campaigns for user
    // ===============================
    const campaigns = await prisma.campaign.findMany({
      where: {
        userId: req.user.id,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate + "T23:59:59.999Z"),
        },
      },
      select: {
        id: true,
        sentCount: true
      }
    });

    const campaignIds = campaigns.map(c => c.id);

    // ===============================
    // 2️⃣ If no campaigns
    // ===============================
    if (campaignIds.length === 0) {
      return res.json({
        source: "db",
        processed: 0,
        delivered: 0,
        opens: 0,
        uniqueOpens: 0,
        clicks: 0,
        uniqueClicks: 0,
        bounces: 0,
        spam: 0,
        openRate: 0,
        clickRate: 0,
        deliveryRate: 0,
        bounceRate: 0,
        spamRate: 0
      });
    }

    // ===============================
    // 3️⃣ Total emails sent
    // ===============================
    const processed = campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0);

    // ===============================
    // 4️⃣ UNIQUE DELIVERED
    // ===============================
    const deliveredRows = await prisma.campaignEvent.findMany({
      where: {
        campaignId: { in: campaignIds },
        type: "delivered"
      },
      distinct: ["email"],
      select: { email: true }
    });

    const delivered = deliveredRows.length;

    // ===============================
    // 5️⃣ TOTAL OPENS
    // ===============================
    const opens = await prisma.campaignEvent.count({
      where: {
        campaignId: { in: campaignIds },
        type: "open"
      }
    });

    // ===============================
    // 6️⃣ UNIQUE OPENS
    // ===============================
    const uniqueOpenRows = await prisma.campaignEvent.findMany({
      where: {
        campaignId: { in: campaignIds },
        type: "open"
      },
      distinct: ["email"],
      select: { email: true }
    });

    const uniqueOpens = uniqueOpenRows.length;

    // ===============================
    // 7️⃣ TOTAL CLICKS
    // ===============================
    const clicks = await prisma.campaignEvent.count({
      where: {
        campaignId: { in: campaignIds },
        type: "click"
      }
    });

    // ===============================
    // 8️⃣ UNIQUE CLICKS
    // ===============================
    const uniqueClickRows = await prisma.campaignEvent.findMany({
      where: {
        campaignId: { in: campaignIds },
        type: "click"
      },
      distinct: ["email"],
      select: { email: true }
    });

    const uniqueClicks = uniqueClickRows.length;

    // ===============================
    // 9️⃣ UNIQUE BOUNCES
    // ===============================
    // Count unique emails that had a bounce/dropped/blocked event
    // BUT exclude emails that were successfully delivered in ANY campaign
    // (same email can be in multiple campaigns — delivered in one, bounced in another)
    const bounceEmailRows = await prisma.campaignEvent.groupBy({
      by: ["email"],
      where: {
        campaignId: { in: campaignIds },
        type: { in: ["bounce", "dropped", "blocked"] }
      }
    });
    const bouncedEmails = bounceEmailRows.map(r => r.email);

    // Remove emails that were also delivered (cross-campaign overlap fix)
    const deliveredEmailSet = new Set(deliveredRows.map(r => r.email));
    const trueBounces = bouncedEmails.filter(email => !deliveredEmailSet.has(email));
    const bounces = trueBounces.length;

    // ===============================
    // 🔟 SPAM REPORTS
    // ===============================
    const spam = await prisma.campaignEvent.count({
      where: {
        campaignId: { in: campaignIds },
        type: "spamreport"
      }
    });

    // ===============================
    // 11️⃣ Calculate rates
    // ===============================
    const openRate = delivered > 0 ? Math.round((uniqueOpens / delivered) * 100) : 0;
    const clickRate = delivered > 0 ? Math.round((uniqueClicks / delivered) * 100) : 0;
    const deliveryRate = processed > 0 ? Math.round((delivered / processed) * 100) : 0;
    const bounceRate = processed > 0 ? Math.round((bounces / processed) * 100) : 0;
    const spamRate = delivered > 0 ? Math.round((spam / delivered) * 100) : 0;

    // ===============================
    // 12️⃣ Return analytics
    // ===============================
    res.json({
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
      spamRate
    });

  } catch (error) {
    console.error("❌ Error fetching summary:", error);
    res.status(500).json({
      error: "Analytics unavailable",
      details: error.message
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