// server/server.js

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import http from "http";
import { Server} from "socket.io";
import { PrismaClient } from "@prisma/client";

// Routes
import authRoutes from './routes/authRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import pushRoutes from "./routes/pushRoutes.js";
import settingsRoutes from './routes/settingsRoutes.js';
import verifySettingsAuth from './middleware/settingsMiddleware.js';
import dashboardCRM from './routes/dashboardCRM.js';
import notificationsRoutes from "./routes/notificationsRoutes.js";
import forgotPasswordRoutes from "./routes/forgotPasswordRoute.js";
import advancedVerificationRoute from "./routes/advancedVerification.js";
import passwordRoutes from "./routes/passwordRoutes.js";
import contactCRMRoutes from "./routes/contactCRM.js";
import sendContactsRoutes from "./routes/SendCampaignContact.js";
import sendCampaignsRoutes from "./routes/CampaignRoutes.js";
import taskRoutes from "./routes/tasks.js";
import dealsRoutes from "./routes/deals.js";
import { router as campaignContactsRoutes } from './routes/contacts.js';
import { router as campaignsRoutes, resumeStuckCampaigns } from './routes/campaigns.js';
import leadsRouter from "./routes/leads.js";
import listRoutes from "./routes/listRoutes.js";
import orderRoutes from "./routes/ordersRoutes.js";
import crmDashRoutes from "./routes/crmDashRoutes.js";
import emailsRouter from "./routes/emails.js";
import accountsRouter from "./routes/accounts.js";
import convRouter from "./routes/conversations.js";
import savedRepliesRouter from "./routes/savedReplies.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import multimediaRoutes from './routes/multimedia.js';
import invoiceRoutes from "./routes/invoiceRoutes.js";
import campaignsAutoRouter from './routes/campaignsAuto.js';
import { router as verifiedEmailsRouter } from './routes/verifiedEmails.js';
import verifiedEmailsRouters from "./routes/userMailVerify.js"; // if actually used
import sendgridSendersRouter from "./routes/sendgridSenders.js";
import { router as analyticsRouter } from './routes/analytics.js';
import automationLogs from "./routes/automationLogs.js";
// Services
import { startEmailScheduler } from "./services/imapScheduler.js";
import { initSocket } from "./services/socketService.js";
 
// Middleware
import { protect } from "./middleware/auth.js";
import webhookRoutes from "./routes/webhooks.js";

import accountsAuthRoutes from "./routes/accountsAuth.js";
import stripeRoutes from './routes/stripe.js';
import razorpayRoutes from './routes/razorpay.js';
import creditcardRoutes from './routes/creditcard.js';
import contactRoutes from './routes/ContactUs.js';
import userRoutes from './routes/user.js';
import upiRoutes from "./routes/upi.js";
// import bodyParser from "body-parser";

import multimediaCampaignRoutes from "./routes/multimediaCampaign.js";

import twilioRoutes from "./routes/twilioConfig.js";
import whatsappRoutes from "./routes/whatsappCampaign.js";
import smsRoutes from "./routes/smsCampaign.js";
import savedTemplatesRouter from "./routes/savedTemplates.js";
import chatRoutes from "./routes/chat.routes.js";

// For uploading images from the editor
import { router as uploadRouter } from "./routes/upload.js";
import path from "path";
import { fileURLToPath } from "url";

// ENV setup
import customRoutes from "./routes/customRoutes.js";
import chatbotRouter from "./routes/chatbot.js";
import verifiFrontendRoutes from "./routes/verifiFrontend.js";

import campaignUserMails from "./routes/campaignUserMails.js";
import { startCampaignScheduler } from "./services/campaignScheduler.js";
import userCredit from "./routes/userRoutes.js"
import uploadRoutes from "./routes/uploadRoutes.js"
import { startScheduledCampaignCron } from "./cron/scheduledCampaignCron.js";

dotenv.config();

// Init
startEmailScheduler();

// ✅ On every server restart, resume any campaign stuck mid-send
// 3s delay ensures Prisma/DB is fully connected first
setTimeout(() => resumeStuckCampaigns(), 3000);
const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;





const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://www.bouncecure.com"
];

app.use(cors({
  origin: function (origin, callback) {

    // allow Postman / server-to-server
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.options("*", cors());
// ---------- end updated CORS block ----------

// HTTP server and socket
const server = http.createServer(app);

// Step 2: Pass CORS options to Socket.IO
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'https://www.bouncecure.com'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('a user connected');
  // your socket logic here
});

// CORS


 


app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use((req, res, next) => {
  console.log(`📥 [${req.method}] ${req.url} | Body:`, req.body);
  next();
});

// ----------------------- Routes -----------------------
// Chat routes
app.use("/api/chat", chatRoutes);


app.use('/api', userRoutes);
app.use('/api/users', userCredit);
// Test protected route
app.get("/api/dashboard-data", protect, (req, res) => {
  res.json({ message: "Secret data for logged-in users", user: req.user });
});

// Auth routes
app.use("/api/auth", authRoutes);
app.use("/api/auth", passwordRoutes); // Optional, combine with authRoutes if desired
app.use("/api/saved-templates", savedTemplatesRouter);

// Dashboard & verification
app.use("/api/dashboard", dashboardCRM);
app.use("/api/verification", protect, verificationRoutes);
app.use("/api", dashboardRoutes);
app.use("/api/webhooks", webhookRoutes);

// Other API routes
app.use("/api", invoiceRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/razorpay', razorpayRoutes);
app.use('/api/upi', upiRoutes);
app.use('/api', creditcardRoutes);

app.use("/api/verification", advancedVerificationRoute);
app.use("/auth", forgotPasswordRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/settings", verifySettingsAuth, settingsRoutes);
app.use("/api/push", pushRoutes);
app.use("/notifications", notificationsRoutes);

// Campaign and multimedia routes
app.use("/api/automation", protect, campaignsAutoRouter);
app.use('/api/sendContacts', protect, sendContactsRoutes);
app.use('/api/sendCampaigns', protect, sendCampaignsRoutes);
app.use('/api/multimedia', protect, multimediaRoutes);
app.use("/api/tasks", protect, taskRoutes);
app.use("/api/deals", protect, dealsRoutes);
app.use("/api/leads", protect, leadsRouter);
app.use("/api/lists", protect, listRoutes);
app.use("/api/contact", protect, contactCRMRoutes);
app.use("/api/orders", protect, orderRoutes);
app.use("/api/stats", protect, crmDashRoutes);
app.use("/api/emails", protect, emailsRouter);
app.use("/api/accounts", protect, accountsRouter);
app.use("/api/auth", accountsAuthRoutes);
app.use("/api/conversations", protect, convRouter);
app.use("/api/saved-replies", protect, savedRepliesRouter);
app.use("/api/campaigncontacts", protect, campaignContactsRoutes);
app.use("/api/campaigns", protect, campaignsRoutes);
app.use("/api/verified-emails", protect, verifiedEmailsRouter);
app.use('/api/analytics', protect, analyticsRouter);
app.use('/api/contact', contactRoutes);

app.use("/api/multimedia-campaign", multimediaCampaignRoutes);
app.use("/api/twilioConfig", twilioRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/sms", smsRoutes);
app.use("/api/chatbot", chatbotRouter);
// public verification route (no auth)
app.use("/api/verifi-frontend", verifiFrontendRoutes);

app.get("/", (req, res) => res.send("Twilio SMS/WhatsApp API Running"));

app.use("/api/custom", customRoutes);

app.use("/api/automation-logs", protect, automationLogs);

// Socket service
initSocket(io);

app.use("/api/senders", sendgridSendersRouter);

app.use("/api/sender", campaignUserMails);

startCampaignScheduler();

// Root route
app.get('/', (req, res) => {
  res.send('Backend is running...');
});


app.use("/api/files", uploadRoutes);




// Email verification route
app.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send('Verification token is required');
    }


    const record = await prisma.campaignVerifiedEmail.findFirst({
      where: { verificationToken: token }
    });

    if (!record) {
      return res.status(404).send('Invalid verification token');
    }


    if (record.expiresAt && new Date() > record.expiresAt) {
      return res.status(400).send('Verification token has expired');
    }

    await prisma.campaignVerifiedEmail.update({
      where: { id: record.id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verificationToken: null
      }
    });


    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Email Verified</title>
          <style>
            body { font-family: Arial; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f5f5f5; }
            .container { background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
            h1 { color: #4CAF50; margin-bottom: 20px; }
            p { color: #333; margin-bottom: 30px; }
            .btn { background-color: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Email Verified Successfully!</h1>
            <p>Thank you for verifying your email address. You can now close this window.</p>
            <button class="btn" onclick="window.close()">Close Window</button>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).send('An error occurred during email verification');
  }


});



// After all your routes are set up and before app.listen():
// Start the scheduled campaign cron job
startScheduledCampaignCron();

// 🔥 Global crash protection
process.on("uncaughtException", (err) => {
  console.error("🔥 UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("🔥 UNHANDLED REJECTION:", err);
});

// Start server
server.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
});

 
