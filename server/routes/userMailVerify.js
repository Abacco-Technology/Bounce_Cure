// src/routes/verifiedEmails.js
import express from "express";
import sgMail from "@sendgrid/mail";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../prisma/prismaClient.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Initialize SendGrid
const initSendGrid = () => {
    if (!process.env.SENDGRID_USER_API_KEY) {
        throw new Error("Missing SENDGRID_USER_API_KEY in environment variables");
    }
    sgMail.setApiKey(process.env.SENDGRID_USER_API_KEY);
};

/**
 * -------------------------------
 *  GET /api/verified-emails
 *  List verified senders for current user
 * -------------------------------
 */
router.get("/", protect, async (req, res) => {
    try {
        const senders = await prisma.verifiedSender.findMany({
            where: { userId: req.user.id, verified: true },
            orderBy: { createdAt: "desc" },
        });
        res.json(senders);
    } catch (err) {
        console.error("Failed to fetch verified senders:", err);
        res.status(500).json({ error: "Failed to fetch verified senders" });
    }
});

/**
 * -------------------------------
 *  GET /api/verified-emails/check/:email
 *  Check if this email is verified for current user
 * -------------------------------
 */
router.get("/check/:email", protect, async (req, res) => {
    try {
        const email = decodeURIComponent(req.params.email).toLowerCase();
        const sender = await prisma.verifiedSender.findUnique({
            where: {
                email_userId: {
                    email,
                    userId: req.user.id,
                },
            },
        });

        if (!sender) return res.json({ isVerified: false });

        res.json({
            isVerified: !!sender.verified,
            verifiedAt: sender.verifiedAt || null,
            fromName: sender.fromName || null,
        });
    } catch (err) {
        console.error("Error checking verified email:", err);
        res.status(500).json({ error: "Error checking verification status" });
    }
});

/**
 * -------------------------------
 *  POST /api/verified-emails/send-verification
 *  Send verification email
 * -------------------------------
 */
router.post("/send-verification", protect, async (req, res) => {
    try {
        const { email: rawEmail, fromName } = req.body;
        if (!rawEmail) return res.status(400).json({ error: "email is required" });

        const email = String(rawEmail).toLowerCase();
        initSendGrid();

        const token = uuidv4();
        const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.verifiedSender.upsert({
            where: {
                email_userId: { email, userId: req.user.id },
            },
            create: {
                email,
                fromName: fromName || null,
                verified: false,
                token,
                tokenExpiresAt,
                userId: req.user.id,
            },
            update: {
                fromName: fromName || undefined,
                token,
                tokenExpiresAt,
                verified: false,
            },
        });

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5000";
        const verifyLink = `${frontendUrl}/verify-email?token=${token}`;

        const sendFromEmail = process.env.SENDGRID_VERIFICATION_FROM;
        const sendFromName =
            process.env.SENDGRID_VERIFICATION_FROM_NAME || "No Reply";

        if (!sendFromEmail) {
            return res
                .status(500)
                .json({ error: "Server missing SENDGRID_VERIFICATION_FROM env var" });
        }

        await sgMail.send({
            to: email,
            from: { email: sendFromEmail, name: sendFromName },
            subject: "Verify your sender email for campaigns",
            html: `
        <p>Hi ${fromName || ""},</p>
        <p>Click the link below to verify <strong>${email}</strong> for campaigns:</p>
        <p><a href="${verifyLink}">Verify this email</a></p>
        <p>If the link doesn't work copy-paste: ${verifyLink}</p>
        <hr>
        <p>If you didn't request this, ignore this message.</p>
      `,
        });

        res.json({ message: "Verification email sent" });
    } catch (err) {
        console.error("Error sending verification email:", err);
        res.status(500).json({
            error: "Failed to send verification email",
            details: err.message,
        });
    }
});

/**
 * -------------------------------
 *  GET /api/verified-emails/verify/:token
 *  Verify email token
 * -------------------------------
 */
router.get("/verify/:token", async (req, res) => {
    try {
        const { token } = req.params;
        if (!token) return res.status(400).json({ error: "token missing" });

        const sender = await prisma.verifiedSender.findFirst({ where: { token } });
        if (!sender)
            return res.status(400).json({ error: "Invalid or expired token" });

        if (sender.tokenExpiresAt && sender.tokenExpiresAt < new Date()) {
            return res.status(400).json({ error: "Token expired" });
        }

        await prisma.verifiedSender.update({
            where: { email_userId: { email: sender.email, userId: sender.userId } },
            data: {
                verified: true,
                verifiedAt: new Date(),
                token: null,
                tokenExpiresAt: null,
            },
        });

        res.json({
            message: "Email verified successfully",
            email: sender.email,
        });
    } catch (err) {
        console.error("Verification error:", err);
        res.status(500).json({ error: "Verification failed", details: err.message });
    }
});

/**
 * -------------------------------
 *  POST /api/verified-emails/add
 *  Admin helper (protect in prod)
 * -------------------------------
 */
router.post("/add", protect, async (req, res) => {
    try {
        const { email: rawEmail, fromName } = req.body;
        if (!rawEmail) return res.status(400).json({ error: "email required" });

        const email = String(rawEmail).toLowerCase();

        await prisma.verifiedSender.upsert({
            where: {
                email_userId: { email, userId: req.user.id },
            },
            create: {
                email,
                fromName: fromName || null,
                verified: true,
                verifiedAt: new Date(),
                userId: req.user.id,
            },
            update: {
                verified: true,
                verifiedAt: new Date(),
                fromName: fromName || undefined,
            },
        });

        res.json({ message: "Added/updated verified sender" });
    } catch (err) {
        console.error("Error adding verified sender:", err);
        res.status(500).json({ error: "Failed to add verified sender" });
    }
});

export default router;
 