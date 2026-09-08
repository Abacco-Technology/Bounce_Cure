import express from "express";
import { prisma } from "../prisma/prismaClient.js";

const router = express.Router();

/* One table serves both galleries. `type` is the discriminator:
     "canvas" → Template Studio designs  (content = array of canvas elements)
     "text"   → Text Editor campaigns    (content = markdown string)
   Every read filters on it, so neither gallery shows the other's rows. */
const TYPES = ["canvas", "text"];
const normType = (t) => (TYPES.includes(t) ? t : "canvas");

/** Shape a row for the client, omitting fields the other type doesn't use. */
const present = (row) => ({
  id:         row.id,
  templateId: row.templateId,
  name:       row.name,
  type:       row.type,
  category:   row.category,
  preview:    row.preview || "",
  content:    row.content,
  createdAt:  row.createdAt,
  updatedAt:  row.updatedAt,
  ...(row.type === "text"
    ? { format: row.format || null, subject: row.subject || "" }
    : { canvasBackgroundColor: row.canvasBackgroundColor || "#ffffff" }),
});

// -------------------- SAVE (create or overwrite) --------------------
router.post("/save", async (req, res) => {
  try {
    const {
      userId, templateId, name, category, preview, content,
      type, format, subject, canvasBackgroundColor,
    } = req.body;

    if (!userId || !templateId || !name || content === undefined || content === null) {
      return res.status(400).json({
        error: "Missing required fields",
        received: { userId, templateId, name, hasContent: content !== undefined },
      });
    }

    const kind = normType(type);

    // Content must match the declared type, or a text template lands in the
    // canvas gallery and breaks the element renderer.
    if (kind === "canvas" && !Array.isArray(content)) {
      return res.status(400).json({ error: "Canvas templates require content to be an array of elements" });
    }
    if (kind === "text" && typeof content !== "string") {
      return res.status(400).json({ error: "Text templates require content to be a markdown string" });
    }

    const data = {
      name,
      type: kind,
      category: category || "Saved",
      preview: preview || "",
      content,
      canvasBackgroundColor: kind === "canvas" ? (canvasBackgroundColor || "#ffffff") : null,
      format:  kind === "text" ? (format || null) : null,
      subject: kind === "text" ? (subject || "") : null,
    };

    const existing = await prisma.savedTemplate.findFirst({
      where: { userId: Number(userId), templateId },
    });

    if (existing) {
      const updated = await prisma.savedTemplate.update({ where: { id: existing.id }, data });
      return res.status(200).json(present(updated));
    }

    const saved = await prisma.savedTemplate.create({
      data: { userId: Number(userId), templateId, ...data },
    });
    res.status(201).json(present(saved));
  } catch (err) {
    console.error("SAVE TEMPLATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------- LIST --------------------
// GET /api/saved-templates/:userId?type=text   (omit type → canvas)
// GET /api/saved-templates/:userId?type=all    (both kinds)
router.get("/:userId", async (req, res) => {
  try {
    const { type } = req.query;
    const where = { userId: Number(req.params.userId) };
    if (type !== "all") where.type = normType(type);

    const saved = await prisma.savedTemplate.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });
    res.json(saved.map(present));
  } catch (error) {
    console.error("FETCH TEMPLATES ERROR:", error);
    res.status(500).json({ error: "Failed to fetch saved templates" });
  }
});

// -------------------- DELETE --------------------
router.delete("/:userId/:templateId", async (req, res) => {
  try {
    const result = await prisma.savedTemplate.deleteMany({
      where: { userId: Number(req.params.userId), templateId: req.params.templateId },
    });
    if (!result.count) return res.status(404).json({ error: "Template not found" });
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("DELETE TEMPLATE ERROR:", error);
    res.status(500).json({ error: "Failed to delete saved template" });
  }
});

// -------------------- RENAME / PARTIAL UPDATE --------------------
router.put("/update", async (req, res) => {
  try {
    const { userId, templateId, name, content, category, subject, format } = req.body;
    if (!userId || !templateId) {
      return res.status(400).json({ error: "userId and templateId are required" });
    }

    // Only touch supplied fields — a rename must not blank the content
    const data = {};
    if (name     !== undefined) data.name = name;
    if (content  !== undefined) data.content = content;
    if (category !== undefined) data.category = category;
    if (subject  !== undefined) data.subject = subject;
    if (format   !== undefined) data.format = format;

    if (!Object.keys(data).length) return res.status(400).json({ error: "Nothing to update" });

    const updated = await prisma.savedTemplate.updateMany({
      where: { userId: Number(userId), templateId },
      data,
    });
    if (!updated.count) return res.status(404).json({ error: "Template not found" });
    res.json({ message: "Updated", count: updated.count });
  } catch (err) {
    console.error("UPDATE TEMPLATE ERROR:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

export default router;