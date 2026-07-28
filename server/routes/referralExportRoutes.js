// server/routes/referralExportRoutes.js
import express from "express";
import { exportReferredUsers, getReferredUsersByCode } from "../controllers/referralExportController.js";
import { verifyInternalApiKey } from "../middleware/verifyInternalApiKey.js";

const router = express.Router();

// Server-to-server only (Abacco Tech's backend). Never called from a browser.
router.get("/referrals/export", verifyInternalApiKey, exportReferredUsers);
router.get("/referrals/by-code/:code", verifyInternalApiKey, getReferredUsersByCode);

export default router;

/*
 * Wiring into server.js:
 *
 *   import referralExportRoutes from './routes/referralExportRoutes.js';
 *   ...
 *   app.use("/api/internal", referralExportRoutes);
 *
 * And add to Bounce Cure's .env:
 *   ABACCO_SYNC_API_KEY=<a long random shared secret>
 */