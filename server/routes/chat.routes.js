import express from "express";
import { sendMessage, getMyMessages } from "../controllers/chatController.js";
import { verifyAuth } from "../controllers/authController.js";

const router = express.Router();

router.post("/send", verifyAuth, sendMessage);
router.get("/my-messages", verifyAuth, getMyMessages);

export default router;
