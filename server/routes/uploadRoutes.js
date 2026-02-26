import express from "express";
import { upload } from "../middleware/upload.js";
import { uploadUserImage, getUserImages } from "../controllers/uploadController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload", protect, upload.single("image"), uploadUserImage);
router.get("/images", protect, getUserImages);

export default router;