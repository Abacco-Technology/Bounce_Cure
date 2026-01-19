// server/routes/analytics.js
import express from "express";
import fetch from "node-fetch";
import { prisma } from "../prisma/prismaClient.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
const SENDGRID_API_KEY = process.env.SENDGRID_CMP_API_KEY;

if (!SENDGRID_API_KEY) {
  console.warn("SENDGRID_CMP_API_KEY not set - analytics will use database only");
}

// Simple in-memory cache for SendGrid API responses
const cache = new Map();

async function fetchWithCache(url, options, ttl = 600000) { // 10 minutes TTL
  if (cache.has(url)) {
    const cached = cache.get(url);
    if (Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Fetch failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  cache.set(url, { data, timestamp: Date.now() });
  return data;
}

// Test Route
router.get("/", (req, res) => {
  res.json({ message: "Analytics route working" });
});

// SendGrid Summary with DB (User-Specific)
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
      include: {
        events: true,
      },
    });

    let processed = 0;
    let delivered = 0;
    let opens = 0;
    let clicks = 0;
    let bounces = 0;
    let spam = 0;

    for (const c of campaigns) {
      const events = c.events || [];

      processed += c.sentCount || 0;
      delivered += events.filter(e => e.type === "delivered").length;
      opens += events.filter(e => e.type === "open").length;
      clicks += events.filter(e => e.type === "click").length;
      bounces += events.filter(e => e.type === "bounce").length;
      spam += events.filter(e => e.type === "spamreport").length;
    }

    const openRate = delivered > 0 ? Math.round((opens / delivered) * 100) : 0;
    const clickRate = delivered > 0 ? Math.round((clicks / delivered) * 100) : 0;
    const deliveryRate = processed > 0 ? Math.round((delivered / processed) * 100) : 0;

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
    console.error("Error fetching summary:", error);
    return res.status(500).json({
      error: "Analytics unavailable",
      details: error.message,
    });
  }
});


// Get detailed stats per campaign
// ==========================================================
// 📊 GET ALL CAMPAIGNS (SendGrid + DB Combined)
// ==========================================================
router.get("/sendgrid/campaigns", protect, async (req, res) => {
  const startDate = req.query.startDate || "2026-01-01";
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
      include: {
        events: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = campaigns.map((c) => {
      const events = c.events || [];

      const delivered = events.filter(e => e.type === "delivered").length;
      const opens = events.filter(e => e.type === "open").length;
      const clicks = events.filter(e => e.type === "click").length;
      const bounces = events.filter(e => e.type === "bounce").length;
      const spam = events.filter(e => e.type === "spamreport").length;

      // 👇 If recipientsJson exists, we can calculate total
      let totalRecipients = 0;
      try {
        if (c.recipientsJson) {
          const parsed = JSON.parse(c.recipientsJson);
          totalRecipients = Array.isArray(parsed) ? parsed.length : 0;
        }
      } catch {}

      const pending = totalRecipients > 0
        ? Math.max(0, totalRecipients - c.sentCount)
        : null;

      return {
        id: c.id,
        name: c.name,
        status: c.status,           // ✅ IMPORTANT
        sentCount: c.sentCount,
        totalRecipients,
        pending,

        deliveredCount: delivered,
        openCount: opens,
        clickCount: clicks,
        bounceCount: bounces,
        spamCount: spam,

        openRate: delivered > 0 ? ((opens / delivered) * 100).toFixed(2) : 0,
        clickRate: delivered > 0 ? ((clicks / delivered) * 100).toFixed(2) : 0,
        deliveryRate: c.sentCount > 0 ? ((delivered / c.sentCount) * 100).toFixed(2) : 0,
      };
    });

    res.json({ campaigns: formatted });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Failed to load analytics" });
  }
});




export { router };