//sendgridSender.js
import express from "express";
import axios from "axios";
import { prisma } from "../prisma/prismaClient.js";
import { protect } from "../middleware/authMiddleware.js";
 
const router = express.Router();
const SG_BASE = "https://api.sendgrid.com/v3";
 
// --- Utility: SendGrid Auth Header ---
function sgHeaders() {
    if (!process.env.SENDGRID_API_KEY)
        throw new Error("❌ Missing SENDGRID_API_KEY in .env");
    return {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
    };
}
 
/**
 * 📨 POST /api/senders/create
 * Creates or verifies a sender via SendGrid (supports both /verified_senders & /senders)
 */
router.post("/create", protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, name, nickname } = req.body;
 
        console.log("📥 [POST] /api/senders/create | Body:", req.body);
 
        if (!email || !name)
            return res.status(400).json({ error: "email and name are required" });
 
        // ✅ Build payload for the new SendGrid Verified Senders API
        const verifiedPayload = {
            nickname: nickname || `${name}-sender`,
            from_email: email,
            from_name: name,
            reply_to: email,
            address: "Address",        // 👈 you can hardcode or take from user input
            city: "City",
            country: "Country",
        };
 
 
        let sgRes;
        try {
            console.log("🚀 Trying /verified_senders (new API)...");
            sgRes = await axios.post(`${SG_BASE}/verified_senders`, verifiedPayload, {
                headers: sgHeaders(),
                });

        } catch (error) {
            // 🔁 fallback for legacy accounts using old API
            if (error.response?.status === 403 || error.response?.status === 404) {
                console.warn("⚠️ Falling back to legacy /senders API...");
                const legacyPayload = {
                    nickname: nickname || `${name}-sender`,
                    from: { email, name },
                    reply_to: { email, name },
                    address: "N/A",
                    city: "N/A",
                    state: "",
                    zip: "",
                    country: "N/A",
                };
                sgRes = await axios.post(`${SG_BASE}/senders`, legacyPayload, {
                    headers: sgHeaders(),
                });
            } else {
                throw error;
            }
        }
 
        const sgData = sgRes.data;
        console.log("✅ SendGrid response:", sgData);
 
        // 🧩 Save or update sender record in your database
        const record = await prisma.verifiedSender.upsert({
            where: { email_userId: { email: email.toLowerCase(), userId } },
            create: {
                userId,
                email: email.toLowerCase(),
                fromName: name,
                sendgridSenderId: sgData.id || null,
                sendgridStatus: sgData.status || JSON.stringify(sgData),
            },
            update: {
                fromName: name,
                sendgridSenderId: sgData.id || null,
                sendgridStatus: sgData.status || JSON.stringify(sgData),
            },
        });
 
        return res.json({
            message: "✅ SendGrid sender created (verification email sent)",
            record,
        });
    } catch (err) {
        console.error("❌ create sender error:", err.response?.data || err.message);
        return res.status(500).json({
            error: "Failed to create sender",
            details: err.response?.data || err.message,
        });
    }
});
 
/**
 * 🔍 GET /api/senders/check/:email
 * Check if a sender is verified
 */
router.get("/check/:email", protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const email = decodeURIComponent(req.params.email).toLowerCase();
 
        let record = await prisma.verifiedSender.findUnique({
            where: { email_userId: { email, userId } },
        });
        if (!record) return res.status(404).json({ error: "No sender record found" });
 
        // ✅ Choose correct SendGrid API based on what was stored
        const endpoint = record.sendgridSenderId
            ? `${SG_BASE}/verified_senders/${record.sendgridSenderId}`
            : null;
 
        if (!endpoint) {
            return res.json({
                isRegisteredWithSendGrid: false,
                isVerified: !!record.verified,
                record,
            });
        }
 
        const sgRes = await axios.get(endpoint, { headers: sgHeaders() });
        const sgData = sgRes.data;
 
        const isVerified =
            sgData.verified?.status === true ||
            sgData.verified?.sender === true ||
            ["verified", "active", "approved"].includes(sgData.status);
 
        record = await prisma.verifiedSender.update({
            where: { email_userId: { email, userId } },
            data: {
                sendgridStatus: sgData.status || JSON.stringify(sgData),
                verified: isVerified,
                verifiedAt: isVerified ? new Date() : null,
            },
        });
 
        return res.json({ sendgrid: sgData, isVerified, record });
    } catch (err) {
        console.error("❌ check sender error:", err.response?.data || err.message);
        return res.status(500).json({
            error: "Failed to check sendgrid sender",
            details: err.response?.data || err.message,
        });
    }
});
 
/**
 * 🧾 GET /api/senders/verified
 * Fetch all verified senders for the logged-in user
 */
router.get("/verified", protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const senders = await prisma.verifiedSender.findMany({ where: { userId } });
        const refreshed = [];
 
        for (const sender of senders) {
            if (!sender.sendgridSenderId) {
                refreshed.push(sender);
                continue;
            }
 
            try {
                const endpoint = `${SG_BASE}/verified_senders/${sender.sendgridSenderId}`;
                const sgRes = await axios.get(endpoint, { headers: sgHeaders() });
                const sgData = sgRes.data;
 
                const isVerified =
                    sgData.verified?.status === true ||
                    sgData.verified?.sender === true ||
                    ["verified", "active", "approved"].includes(sgData.status);
 
                const updated = await prisma.verifiedSender.update({
                    where: { id: sender.id },
                    data: {
                        sendgridStatus: sgData.status || JSON.stringify(sgData),
                        verified: isVerified,
                        verifiedAt: isVerified ? new Date() : null,
                    },
                });
 
                refreshed.push(updated);
            } catch (err) {
                if (err.response?.status === 404) {
                    const updated = await prisma.verifiedSender.update({
                        where: { id: sender.id },
                        data: { verified: false, verifiedAt: null, sendgridStatus: "deleted" },
                    });
                    refreshed.push(updated);
                } else {
                    refreshed.push(sender);
                }
            }
        }
 
        const onlyVerified = refreshed.filter((s) => s.verified === true);
        res.json(onlyVerified);
    } catch (err) {
        console.error("❌ verified senders error:", err);
        res.status(500).json({ error: "Failed to fetch verified senders" });
    }
});
 
export default router;
 