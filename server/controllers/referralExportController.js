// server/controllers/referralExportController.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 🟢 GET /api/internal/referrals/export?since=<ISO date>
//
// Bulk export for Abacco Tech's scheduled sync job. Returns every user with
// a non-null referredByCode, optionally limited to rows updated after
// `since` so repeat runs only pull what changed.
//
// Field list confirmed against the actual Prisma-generated User model
// (2026-07-28) — there is no phone/contact scalar field on this model, so
// Referral.phone on the Abacco side is left null for rows synced from here.
export const exportReferredUsers = async (req, res) => {
  try {
    const { since } = req.query;

    if (since && isNaN(Date.parse(since))) {
      return res.status(400).json({ message: "Invalid 'since' date" });
    }

    const where = {
      referredByCode: { not: null },
      ...(since && { updatedAt: { gt: new Date(since) } }),
    };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        plan: true,
        hasPurchasedBefore: true,
        referredByCode: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "asc" },
    });

    return res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    console.error("❌ exportReferredUsers error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🟢 GET /api/internal/referrals/by-code/:code
// Scoped lookup — kept for a possible future admin "refresh one code" tool.
export const getReferredUsersByCode = async (req, res) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({ success: false, message: "Referral code is required" });
    }

    const users = await prisma.user.findMany({
      where: { referredByCode: code },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        plan: true,
        hasPurchasedBefore: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    console.error("❌ getReferredUsersByCode error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};