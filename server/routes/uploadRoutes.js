// server/src/routes/fileRoutes.js
// Wire this up in your main app: app.use("/api/files", fileRoutes)

import express from "express";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js";
import {
  uploadUserImage,
  getUserImages,
  deleteSingleImage,
  deleteManyImages,
} from "../controllers/uploadController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Existing routes
router.post("/upload", protect, upload.single("image"), uploadUserImage);
router.get("/images", protect, getUserImages);

// New delete routes
router.delete("/images/:id", protect, deleteSingleImage); // single delete
router.delete("/images", protect, deleteManyImages);       // bulk delete

export default router;