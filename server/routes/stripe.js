// server/routes/stripe.js
import express from "express";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { sendInvoiceEmail } from "../config/sendgrid.js";
import { generateInvoice } from "../utils/invoiceGenerator.js";
import { generatePrintingInvoice } from "../utils/printInvoiceGen.js";
import { invoiceEmailTemplate } from "../utils/invoiceEmailTemplate.js";
import cron from "node-cron";  // 🕒 Add this line

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();
 
// Check Stripe secret key validity on server start
stripe.customers.list({ limit: 1 })
  .then(() => console.log('✅ Stripe SECRET key is valid'))
  .catch(err => console.error('❌ Stripe SECRET key error:', err.message));
 
/**
 * Utility: Get next payment date from plan type
 */
/**
 * 🧮 Utility: Get next payment date based on plan type
 * Supports: monthly (30 days), quarterly (90 days), yearly (365 days)
 */
export const getNextPaymentDate = (currentDate, planType) => {
  const date = new Date(currentDate);
  const normalized = planType?.toLowerCase() || "";

  if (["month", "monthly"].includes(normalized)) {
    date.setDate(date.getDate() + 30);
  } else if (["quarter", "quarterly"].includes(normalized)) {
    date.setDate(date.getDate() + 90);
  } else if (["year", "yearly", "annual", "annually"].includes(normalized)) {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    console.warn(`⚠️ Unknown planType "${planType}", defaulting to +30 days`);
    date.setDate(date.getDate() + 30);
  }

  return date.toISOString();
};

 
 
/**
 * Create Stripe Payment Intent
 */
router.post("/create-payment-intent", async (req, res) => {
  const { amount, email, planName, planType, currency = "usd" } = req.body;
 
  if (!amount || !email) {
    return res.status(400).json({ error: "Amount and email are required" });
  }
 
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects cents
      currency,
      receipt_email: email,
      description: `${planName || "Subscription"} for ${email}`,
      payment_method_types: ["card"],
    });
 
    res.json({ 
      clientSecret: paymentIntent.client_secret,
      transactionId: paymentIntent.id,
    });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: err.message });
  }
});
 
/**
 * Save Payment + Generate & Email Invoice
 */
// ✅ Save Payment + Generate & Email Invoice

// Updated /api/stripe/save-payment endpoint - stripe.js
// Replace the entire endpoint (around line 85-250)
// ✅ Save Payment + Generate & Email Invoice
router.post("/save-payment", async (req, res) => {
  try {
    const {
      name,
      amount,
      discount,
      planPrice,
      paymentDate,
      billingAddress,
      planName,
      planType,
      email,
      transactionId,
      userId,
      provider,
      currency,
      paymentMethod,
      cardLast4,
      status,

      // ✅ All credit types from frontend
      emailVerificationCredits,
      emailSendCredits,
      smsCredits,
      whatsappCredits,
    } = req.body;

    console.log("📥 Received payment data:", {
      userId,
      planName,
      planType,
      emailVerificationCredits,
      emailSendCredits,
      smsCredits,
      whatsappCredits,
    });

    // 🧩 Basic validation
    if (!name || !planName || !email || !transactionId || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const userIdInt = parseInt(userId, 10);
    if (isNaN(userIdInt)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    const paymentDateObj = paymentDate ? new Date(paymentDate) : new Date();

    // ✅ Normalize plan type for SMS / WhatsApp / Email
    let normalizedPlanType = planType?.toLowerCase() || "";
    const lowerPlanName = planName?.toLowerCase() || "";
    if (lowerPlanName.includes("sms")) normalizedPlanType = "multimedia-sms";
    else if (lowerPlanName.includes("whatsapp")) normalizedPlanType = "multimedia-whatsapp";
    else if (lowerPlanName.includes("verification")) normalizedPlanType = "email-verification";
    else if (lowerPlanName.includes("email")) normalizedPlanType = "email";

    const nextPaymentDate = getNextPaymentDate(paymentDateObj, normalizedPlanType);

    // 🧩 Validate user
    const user = await prisma.user.findUnique({ where: { id: userIdInt } });
    if (!user) {
      return res.status(400).json({ error: `User with ID ${userIdInt} not found` });
    }

    // ✅ Auto-fill credits based on plan (if not received from frontend)
    let finalEmailVerificationCredits = Number(emailVerificationCredits || 0);
    let finalEmailSendCredits = Number(emailSendCredits || 0);
    let finalSmsCredits = Number(smsCredits || 0);
    let finalWhatsappCredits = Number(whatsappCredits || 0);

    if (
      finalEmailVerificationCredits === 0 &&
      finalEmailSendCredits === 0 &&
      finalSmsCredits === 0 &&
      finalWhatsappCredits === 0
    ) {
      console.log("⚙️ Auto-assigning credits for plan:", lowerPlanName);

      if (lowerPlanName === "essentials") {
        finalEmailVerificationCredits = 0;
        finalEmailSendCredits = 50000;
        finalSmsCredits = 0;
        finalWhatsappCredits = 0;
      } else if (lowerPlanName === "standard") {
        finalEmailVerificationCredits = 150000;
        finalEmailSendCredits = 150000;
        finalSmsCredits = 5000;
        finalWhatsappCredits = 2000;
      } else if (lowerPlanName === "premium") {
        finalEmailVerificationCredits = 200000;
        finalEmailSendCredits = 200000;
        finalSmsCredits = 10000;
        finalWhatsappCredits = 5000;
      }
    }

    console.log("💳 Final Credit Breakdown:", {
      finalEmailVerificationCredits,
      finalEmailSendCredits,
      finalSmsCredits,
      finalWhatsappCredits,
    });

    // 🧾 Build base payment data (without customInvoiceId — added inside retry loop)
    const paymentData = {
      userId: userIdInt,
      name,
      email,
      transactionId,
      planName: lowerPlanName,
      planType: normalizedPlanType,
      provider: provider || "system",
      emailVerificationCredits: finalEmailVerificationCredits,
      emailSendCredits: finalEmailSendCredits,
      smsCredits: finalSmsCredits,
      whatsappCredits: finalWhatsappCredits,
      amount: lowerPlanName === "free" ? 0 : Number(amount),
      currency: currency || "usd",
      planPrice: lowerPlanName === "free" ? 0 : Number(planPrice) || Number(amount),
      discount: Number(discount) || 0,
      paymentMethod: lowerPlanName === "free" ? "system" : (paymentMethod || "card"),
      cardLast4: cardLast4 || "",
      billingAddress: billingAddress || "",
      paymentDate: paymentDateObj,
      nextPaymentDate: new Date(nextPaymentDate),
      status: status || "succeeded",
    };

    // 🔁 Save payment with retry on customInvoiceId collision
    const prefix = "BC234Ab";
    const startingNumber = 5000;
    const MAX_RETRIES = 5;

    let payment;
    let customInvoiceId;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // ✅ Re-query on every attempt to get the freshest last invoice ID
      const lastPayment = await prisma.payment.findFirst({
        where: { customInvoiceId: { not: null } },
        orderBy: { customInvoiceId: "desc" }, // ✅ Fixed: order by the invoice ID, not row id
        select: { customInvoiceId: true },
      });

      let newInvoiceNumber = startingNumber;

      if (lastPayment?.customInvoiceId) {
        const match = lastPayment.customInvoiceId.match(/\d+$/);
        if (match) {
          const lastNum = parseInt(match[0], 10);
          newInvoiceNumber = lastNum >= startingNumber ? lastNum + 1 : startingNumber;
        }
      }

      // ✅ On retry, bump further to avoid the same collision
      newInvoiceNumber += attempt;

      customInvoiceId = `${prefix}${String(newInvoiceNumber).padStart(4, "0")}`;

      try {
        payment = await prisma.payment.create({
          data: { ...paymentData, customInvoiceId },
        });
        console.log(`✅ Payment saved on attempt ${attempt + 1} → ${customInvoiceId}`);
        break; // ✅ Success — exit retry loop
      } catch (err) {
        const isCollision =
          err.code === "P2002" &&
          err.meta?.target?.includes("customInvoiceId");

        if (isCollision) {
          console.warn(
            `⚠️ Invoice ID collision on attempt ${attempt + 1}: ${customInvoiceId}. Retrying...`
          );
          if (attempt === MAX_RETRIES - 1) {
            throw new Error(
              `Failed to generate a unique invoice ID after ${MAX_RETRIES} attempts.`
            );
          }
        } else {
          throw err; // Non-collision error — rethrow immediately
        }
      }
    }

    // 🔁 Reattach credit values for invoice use
    payment.emailVerificationCredits = finalEmailVerificationCredits;
    payment.emailSendCredits = finalEmailSendCredits;
    payment.smsCredits = finalSmsCredits;
    payment.whatsappCredits = finalWhatsappCredits;
    payment.customInvoiceId = customInvoiceId;

    console.log("✅ Payment saved to DB:", payment.id, "→", payment.customInvoiceId);

    // ✅ Update user credits dynamically
    const updatedUserData = {
      plan: lowerPlanName,
      hasPurchasedBefore: true,
      contactLimit: (user.contactLimit || 0) + finalEmailVerificationCredits,
      emailLimit: (user.emailLimit || 0) + finalEmailSendCredits,
      smsCredits: (user.smsCredits || 0) + finalSmsCredits,
      whatsappCredits: (user.whatsappCredits || 0) + finalWhatsappCredits,
    };

    console.log("📝 Updating user:", updatedUserData);

    const updatedUser = await prisma.user.update({
      where: { id: userIdInt },
      data: updatedUserData,
    });

    console.log("✅ User updated:", {
      id: updatedUser.id,
      smsCredits: updatedUser.smsCredits,
      whatsappCredits: updatedUser.whatsappCredits,
    });

    // 🧾 Generate and send invoice
    try {
      const pdfBuffer = await generateInvoice(payment);
      const pdfBuffers = await generatePrintingInvoice(payment);

      const html = invoiceEmailTemplate({
        transactionId: payment.customInvoiceId || payment.transactionId,
        planName: payment.planName,
        total: payment.amount,
        currency: payment.currency?.toUpperCase() || "USD",
      });

      await sendInvoiceEmail({
        to: payment.email,
        subject: `Invoice ${payment.customInvoiceId} - ${payment.planName}`,
        html,
        pdfBuffer,
        pdfBuffers,
        fileName: `invoice-${payment.customInvoiceId}.pdf`,
      });

      console.log("✅ Invoice sent successfully");
    } catch (invoiceError) {
      console.error("⚠️ Invoice generation/sending failed:", invoiceError);
    }

    // ✅ Respond success
    res.json({
      success: true,
      message: "Payment and user credits saved successfully",
      payment,
      updatedUser,
    });
  } catch (err) {
    console.error("❌ Error saving payment:", err);
    res.status(500).json({ error: err.message });
  }
});




// 🕒 Every midnight, check and expire outdated plans
cron.schedule("0 0 * * *", async () => {
  console.log("🧹 Running daily plan expiry check...");

  const now = new Date();

  try {
    // Find expired users
    const expiredUsers = await prisma.payment.findMany({
      where: {
        nextPaymentDate: { lt: now },
        status: "succeeded",
      },
      include: { user: true },
    });

    for (const record of expiredUsers) {
      // Reset user's credits
      await prisma.user.update({
        where: { id: record.userId },
        data: {
          emailLimit: 0,
          contactLimit: 0,
          plan: "Expired",
        },
      });

      // Mark payment as expired
      await prisma.payment.update({
        where: { id: record.id },
        data: { status: "expired" },
      });

      console.log(`🚫 Expired plan for user ${record.userId}`);
    }

    console.log(`✅ Plan expiry check completed (${expiredUsers.length} users updated).`);
  } catch (err) {
    console.error("❌ Error running expiry check:", err);
  }
});

export default router;


