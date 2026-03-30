// server/src/controllers/uploadController.js
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import r2 from "../lib/r2.js";

const prisma = new PrismaClient();

// ── UPLOAD ──────────────────────────────────────────────────────────────────
export const uploadUserImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const key = `users/${userId}/${Date.now()}-${file.originalname}`;

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    const imageUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    await prisma.userUpload.create({
      data: {
        userId,
        url: imageUrl,
        key,
        mimeType: file.mimetype,
        size: file.size,
      },
    });

    const images = await prisma.userUpload.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, images });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Upload failed" });
  }
};

// ── GET ALL IMAGES ───────────────────────────────────────────────────────────
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

// ── DELETE SINGLE IMAGE ──────────────────────────────────────────────────────
export const deleteSingleImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // numeric string — convert below

    // Verify ownership
    const record = await prisma.userUpload.findFirst({
      where: { id: Number(id), userId },
    });

    if (!record) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Delete from R2
    await r2.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: record.key,
      })
    );

    // Delete from DB
    await prisma.userUpload.delete({ where: { id: Number(id) } });

    res.json({ success: true, deletedId: Number(id) });
  } catch (error) {
    console.error("Delete single error:", error);
    res.status(500).json({ message: "Failed to delete image" });
  }
};

// ── BULK DELETE IMAGES ───────────────────────────────────────────────────────
export const deleteManyImages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ids } = req.body; // array of ids from frontend

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No ids provided" });
    }

    // Only delete records that belong to this user
    const records = await prisma.userUpload.findMany({
      where: { id: { in: ids.map(Number) }, userId },
    });

    if (records.length === 0) {
      return res.status(404).json({ message: "No matching images found" });
    }

    // Delete each file from R2
    await Promise.all(
      records.map((record) =>
        r2.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: record.key,
          })
        )
      )
    );

    // Delete all from DB in one query
    await prisma.userUpload.deleteMany({
      where: { id: { in: records.map((r) => r.id) }, userId },
    });

    res.json({
      success: true,
      deletedIds: records.map((r) => r.id),
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    res.status(500).json({ message: "Failed to delete images" });
  }
};