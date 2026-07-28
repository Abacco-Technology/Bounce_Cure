// server/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

import { prisma } from "../prisma/prismaClient.js";
import sendEmail from '../utils/emailService.js';


// Helper: generate a short unique referral code
const generateReferralCode = (firstName) => {
    const namePart = (firstName || "USER").slice(0, 4).toUpperCase();
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${namePart}${randomPart}`;
};

// Signup
// NOTE: Abacco Tech referral synchronization is intentionally NOT handled here.
// It runs client-side in SignupPage.jsx (via VITE_ABACCO_API) after this endpoint
// already returns success, so it can never block, slow down, or roll back a
// Bounce Cure registration. This function is unchanged from before.
export const signup = async (req, res) => {
    try {
        const { firstName, lastName, email, password, referralCode } = req.body;

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // If a referral code was entered, always record it on referredByCode —
        // whether it matches a local Bounce Cure user's own code, or is an
        // external Abacco Tech code (e.g. "ABARC002"). We still look up a local
        // match in case other parts of the app rely on `referrer` existing, but
        // we no longer let a missing local match wipe out the code entirely —
        // that was silently losing the record of which referral brought the
        // user in. Abacco validates the code independently during its own
        // sync step (see syncReferralWithAbacco in SignupPage.jsx).
        let referredByCode = null;
        if (referralCode && referralCode.trim() !== "") {
            const trimmedCode = referralCode.trim().toUpperCase();

            // Kept for parity with before — harmless if it's an Abacco code and no local user exists
            await prisma.user.findUnique({
                where: { referralCode: trimmedCode }
            });

            referredByCode = trimmedCode;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a unique referral code for the new user
        let newReferralCode;
        let isUnique = false;
        while (!isUnique) {
            newReferralCode = generateReferralCode(firstName);
            const existing = await prisma.user.findUnique({ where: { referralCode: newReferralCode } });
            if (!existing) isUnique = true;
        }

        const newUser = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword,
                referralCode: newReferralCode,
                referredByCode
            }
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser.id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                name: `${newUser.firstName} ${newUser.lastName}`.trim(),
                email: newUser.email,
                profileImage: newUser.profileImage || null,
                referralCode: newUser.referralCode,
                referredByCode: newUser.referredByCode

            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Create login log
        await prisma.loginLog.create({
            data: {
                userId: user.id,
                ipAddress: req.ip,
                device: req.headers['user-agent'],
                location: 'Unknown'
            }
        });

        // Create session
        await prisma.session.create({
            data: {
                userId: user.id,
                ipAddress: req.ip,
                device: req.headers['user-agent']
            }
        });

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                name: `${user.firstName} ${user.lastName}`.trim(),
                email: user.email,
                profileImage: user.profileImage || null

            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get login logs
export const getLoginLogs = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const isAdmin = (req.user.role || "").toUpperCase() === "ADMIN";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const logs = await prisma.loginLog.findMany({
            where: isAdmin ? {} : { userId: req.user.id },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                }
            }
        });

        const totalLogs = await prisma.loginLog.count({
            where: isAdmin ? {} : { userId: req.user.id }
        });

        res.status(200).json({
            success: true,
            message: "Login logs fetched successfully",
            pagination: {
                total: totalLogs,
                page,
                limit,
                totalPages: Math.ceil(totalLogs / limit)
            },
            data: logs
        });
    } catch (error) {
        console.error("Error fetching login logs:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Send verification email
export const sendVerificationEmail = async (req, res) => {
    try {
        // req.user comes from JWT (id + email)
        const { id, email } = req.user;

        if (!email) {
            return res.status(400).json({ success: false, message: "User email not found in token" });
        }

        // Fetch full user details
        const user = await prisma.user.findUnique({
            where: { id },
            select: { firstName: true, lastName: true, email: true },
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: "15m" });
        const verificationLink = `${process.env.BACKEND_URL}/api/auth/verify-email?token=${token}`;

        const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Verify Your Email - BounceCure</title>
      </head>
      <body style="font-family:Arial,sans-serif;background-color:#f6f9fc;padding:0;margin:0;">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.1);">
          <div style="background:linear-gradient(135deg,#4f46e5,#3b82f6);color:#fff;padding:24px;text-align:center;">
            <h1 style="margin:0;font-size:24px;">Verify Your Email</h1>
          </div>
          <div style="padding:32px;text-align:left;">
            <h2 style="color:#111827;">Hi ${user.firstName || ''} ${user.lastName || ''},</h2>
            <p style="color:#4b5563;font-size:15px;">Welcome to <strong>BounceCure</strong>! To complete your registration, please verify your email address by clicking the button below.</p>
            <a href="${verificationLink}" style="display:inline-block;margin-top:25px;padding:12px 28px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;text-decoration:none;border-radius:8px;font-weight:600;">Verify My Email</a>
            <p style="margin-top:20px;font-size:13px;color:#6b7280;">If you did not create a BounceCure account, please ignore this email.</p>
          </div>
          <div style="background-color:#f9fafb;padding:20px;text-align:center;font-size:12px;color:#6b7280;">
            © ${new Date().getFullYear()} BounceCure. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

        await sendEmail({
            to: user.email,
            subject: "Verify your BounceCure account",
            html: htmlContent,
        });

        console.log(`✅ Verification email sent to ${user.email}`);

        res.status(200).json({
            success: true,
            message: "Verification email sent successfully!",
        });
    } catch (err) {
        console.error("❌ Email send error:", err);
        res.status(500).json({ success: false, message: "Failed to send verification email." });
    }
};


/**
 * Verify user email via token in query
 */
export const verifyEmail = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).send("Missing verification token.");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded?.email;

        if (!email) {
            return res.status(400).send("Invalid verification token payload.");
        }

        // Update user status
        const updatedUser = await prisma.user.updateMany({
            where: { email },
            data: { isVerified: true },
        });

        if (updatedUser.count === 0) {
            console.warn("No user found for email:", email);
            return res.redirect(`${process.env.FRONTEND_URL}/email-verification-failed`);
        }

        console.log(`✅ Email verified successfully for ${email}`);

        // Redirect to frontend success page
        res.redirect(`${process.env.FRONTEND_URL}/email-verified`);
    } catch (error) {
        console.error("❌ Email verification error:", error.message || error);
        res.redirect(`${process.env.FRONTEND_URL}/email-verification-failed`);
    }
};

// Change password
export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: "Both old and new passwords are required" });
        }

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });

        if (!user || !user.password) {
            return res.status(404).json({ message: "User not found or password missing" });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Old password incorrect" });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashed }
        });

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Enable 2FA
// authController.js

// Add these functions to your authController.js

// Enable 2FA - sends OTP to user's email
export const enable2FA = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate and send OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Delete any existing OTPs for this user
        await prisma.oTPCode.deleteMany({ where: { userId: user.id } });

        // Store new OTP with expiry
        await prisma.oTPCode.create({
            data: {
                code: otp,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
                userId: user.id,
            },
        });

        // Send OTP email
        await sendEmail({
            to: user.email,
            from: "info@bouncecure.com",
            subject: "Your 2FA Verification Code",
            text: `Your OTP code is: ${otp}. This code will expire in 10 minutes.`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin-bottom: 20px;">Two-Factor Authentication</h2>
                        <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
                            You requested to enable Two-Factor Authentication for your account.
                        </p>
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                            <p style="color: #666; margin-bottom: 10px; font-size: 14px;">Your verification code is:</p>
                            <h1 style="color: #007bff; font-size: 36px; letter-spacing: 8px; margin: 10px 0;">${otp}</h1>
                        </div>
                        <p style="color: #999; font-size: 14px; margin-top: 20px;">
                            This code will expire in 10 minutes. If you didn't request this, please ignore this email.
                        </p>
                    </div>
                </div>
            `,
        });

        console.log(`✅ 2FA OTP sent to: ${user.email}`);
        res.status(200).json({
            success: true,
            message: 'OTP sent to your email successfully'
        });

    } catch (error) {
        console.error('Enable 2FA error:', error);
        res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
    }
};

// Verify 2FA OTP and enable 2FA for user
export const verify2FA = async (req, res) => {
    try {
        const { otp } = req.body;
        const userId = req.user.id;

        if (!otp) {
            return res.status(400).json({ message: 'OTP is required' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find the latest valid OTP for the user
        const otpRecord = await prisma.oTPCode.findFirst({
            where: {
                userId,
                code: otp,
                expiresAt: { gt: new Date() },  // not expired
            },
            orderBy: { expiresAt: 'desc' }
        });

        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Enable 2FA on user
        await prisma.user.update({
            where: { id: userId },
            data: { is2FAEnabled: true },
        });

        // Delete all OTP codes for this user after successful verification
        await prisma.oTPCode.deleteMany({ where: { userId } });

        console.log(`✅ 2FA enabled for user: ${user.email}`);
        res.json({
            success: true,
            message: '2FA enabled successfully'
        });

    } catch (err) {
        console.error('Verify 2FA error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Disable 2FA
export const disable2FA = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.is2FAEnabled) {
            return res.status(400).json({ message: '2FA is not enabled for this account' });
        }

        // Disable 2FA
        await prisma.user.update({
            where: { id: userId },
            data: { is2FAEnabled: false },
        });

        // Delete any pending OTP codes
        await prisma.oTPCode.deleteMany({ where: { userId } });

        console.log(`✅ 2FA disabled for user: ${user.email}`);
        res.json({
            success: true,
            message: '2FA disabled successfully'
        });

    } catch (error) {
        console.error('Disable 2FA error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get user profile with 2FA status
export const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profileImage: true,
                isVerified: true,
                is2FAEnabled: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                ...user,
                name: `${user.firstName} ${user.lastName}`.trim()
            }
        });

    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Send OTP
export const sendOTP = async (user) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with expiry (preferable with a separate OTP model)
    await prisma.oTPCode.create({
        data: {
            code: otp,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            userId: user.id,
        },
    });

    await sendEmail({
        to: user.email,
        subject: "Your OTP Code",
        text: `Your OTP is: ${otp}`,
        html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
    });

    return otp;
};



// Fixed backend version of getSecurityLogs
export const getSecurityLogs = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const logs = await prisma.loginLog.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: "desc" },
            take: 5,  // <-- limits to 4 rows
        });

        res.status(200).json({ success: true, data: logs });
    } catch (err) {
        console.error("Error fetching security logs:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Get active sessions
export const getActiveSessions = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });

        const sessions = await prisma.session.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json({ success: true, data: sessions });
    } catch (err) {
        console.error("Error fetching sessions:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// server/controllers/authController.js

// server/controllers/authController.js

export const createSession = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });

        const { device, ipAddress } = req.body;
        const userId = req.user.id;

        // 🧾 Step 1: Fetch user's latest active payment plan
        const payment = await prisma.payment.findFirst({
            where: { userId, status: "success" },
            orderBy: { paymentDate: "desc" },
        });

        // Default plan limit
        let maxSessions = 1;
        let planName = "Free";

        if (payment) {
            planName = payment.planName?.toLowerCase() || "free";

            switch (planName) {
                case "essential":
                    maxSessions = 3;
                    break;
                case "standard":
                case "standard plan":
                    maxSessions = 5;
                    break;
                case "premium":
                case "premium plan":
                    maxSessions = Infinity; // unlimited
                    break;
                default:
                    maxSessions = 1;
            }
        }

        // 🧮 Step 2: Count current active sessions
        const activeCount = await prisma.session.count({ where: { userId } });

        // 🚫 Step 3: Block login if limit reached
        if (maxSessions !== Infinity && activeCount >= maxSessions) {
            console.warn(`❌ Login denied: user ${userId} exceeded session limit (${activeCount}/${maxSessions})`);

            return res.status(403).json({
                success: false,
                message: `You have reached your session limit (${maxSessions}). Please log out from another device.`,
            });
        }

        // ✅ Step 4: Create new session
        const newSession = await prisma.session.create({
            data: {
                userId,
                device: device || "Unknown Device",
                ipAddress: ipAddress || "N/A",
            },
        });

        console.log(
            `✅ New session created for user ${userId} (${device || "Unknown"}) | Plan: ${planName}`
        );

        res.status(201).json({
            success: true,
            data: newSession,
            message: `Session created successfully (${activeCount + 1}/${maxSessions === Infinity ? "Unlimited" : maxSessions})`,
        });
    } catch (err) {
        console.error("Error creating session:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


// server/controllers/authController.js

// Logout (delete) a specific session by ID
export const logoutSession = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check if session belongs to the user
        const session = await prisma.session.findUnique({ where: { id: parseInt(id) } });

        if (!session || session.userId !== userId) {
            return res.status(404).json({ success: false, message: "Session not found" });
        }

        await prisma.session.delete({ where: { id: session.id } });

        console.log(`🟡 Session ${id} logged out for user ${userId}`);
        res.json({ success: true, message: "Session logged out successfully" });
    } catch (err) {
        console.error("Logout session error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Logout all sessions for the current user
export const logoutAllSessions = async (req, res) => {
    try {
        const userId = req.user.id;
        await prisma.session.deleteMany({ where: { userId } });

        console.log(`🔴 All sessions logged out for user ${userId}`);
        res.json({ success: true, message: "All sessions logged out successfully" });
    } catch (err) {
        console.error("Logout all sessions error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};









export const verifyAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};

export const testEmail = async (req, res) => {
    try {
        await sendEmail({
            to: "user@example.com",
            subject: "Test Email",
            html: "<h1>Hello from Ethereal!</h1>",
        });

        res.status(200).json({ message: "Email sent successfully!" });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ error: "Failed to send email" });
    }
};