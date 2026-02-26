//server/src/controllers/uploadController.js
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import r2 from "../lib/r2.js";
 
const prisma = new PrismaClient();
 
export const uploadUserImage = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware
    const file = req.file;
 
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
 
    const key = `users/${userId}/${Date.now()}-${file.originalname}`;
 
    // Upload to R2
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );
 
    const imageUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
 
    // Save to DB
    await prisma.userUpload.create({
      data: {
        userId,
        url: imageUrl,
        key,
        mimeType: file.mimetype,
        size: file.size,
      },
    });
 
    // Immediately fetch updated list
    const images = await prisma.userUpload.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
 
    res.json({
      success: true,
      images,
    });
 
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Upload failed" });
  }
};

export const getUserImages = async (req, res) => {
  try {
    const userId = req.user.id;

    const images = await prisma.userUpload.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json(images);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch images" });
  }
};