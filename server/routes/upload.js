// server/routes/upload.js
import express       from "express";
import fs            from "fs";
import path          from "path";
import multer        from "multer";
import { fileURLToPath } from "url";
import { protect }   from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

/* ─── Helpers ────────────────────────────────────────────────
   Ensure a directory exists (creates it recursively if needed)
──────────────────────────────────────────────────────────── */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/* ─── Build public URL from a relative path ─────────────────*/
function buildPublicUrl(relativePath) {
  const baseUrl = process.env.API_BASE_URL ||
                  `http://localhost:${process.env.PORT || 5000}`;
  return `${baseUrl}/${relativePath.replace(/\\/g, "/")}`;
}


/* ═══════════════════════════════════════════════════════════
   POST /api/upload/image
   ─────────────────────────────────────────────────────────
   Accepts a multipart/form-data POST with field name "image".
   Saves the file to:   public/uploads/images/<timestamp>_<name>
   Returns:  { success: true, url: "https://…/uploads/images/abc.jpg" }

   ── Setup in server/index.js ────────────────────────────────
   import { router as uploadRouter } from "./routes/upload.js";
   app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));
   app.use("/api/upload", uploadRouter);

   ── Install dependency ──────────────────────────────────────
   npm install multer
═══════════════════════════════════════════════════════════ */

/* ─── Multer storage config for /image ───────────────────── */
const imageStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(__dirname, "../public/uploads/images");
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase() || ".jpg";
    const safe = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, "_").slice(0, 40);
    cb(null, `img_${Date.now()}_${safe}${ext}`);
  },
});

const imageUpload = multer({
  storage: imageStorage,
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

router.post("/image", imageUpload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No image file provided" });
    }

    // Build the public URL
    const relativePath = `uploads/images/${req.file.filename}`;
    const publicUrl    = buildPublicUrl(relativePath);

    console.log(`✅ Image saved → ${publicUrl}  (${Math.round(req.file.size / 1024)} KB)`);

    return res.status(200).json({ success: true, url: publicUrl });

  } catch (err) {
    console.error("❌ Image upload error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to upload image" });
  }
});

// Multer error handler for /image (file too large, wrong type, etc.)
router.use("/image", (err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === "LIMIT_FILE_SIZE"
      ? "Image exceeds 10 MB limit"
      : err.message;
    return res.status(400).json({ success: false, error: msg });
  }
  if (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});


/* ═══════════════════════════════════════════════════════════
   POST /api/upload/snapshot
   ─────────────────────────────────────────────────────────
   Accepts a JSON body:  { imageBase64: "data:image/png;base64,..." }
   Saves to:   public/uploads/snapshots/<timestamp>.png
   Returns:  { success: true, url: "https://…/uploads/snapshots/abc.png" }
═══════════════════════════════════════════════════════════ */
router.post("/snapshot", async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64 || !imageBase64.startsWith("data:image/")) {
      return res.status(400).json({ success: false, error: "Invalid or missing image data" });
    }

    // Strip the data-URL prefix
    const matches = imageBase64.match(/^data:image\/(\w+);base64,(.+)$/s);
    if (!matches) {
      return res.status(400).json({ success: false, error: "Malformed base64 image string" });
    }

    const ext        = matches[1] === "jpeg" ? "jpg" : matches[1]; // png | jpg | webp
    const base64Data = matches[2];
    const buffer     = Buffer.from(base64Data, "base64");

    // Guard against oversized uploads (max 10 MB)
    if (buffer.byteLength > 10 * 1024 * 1024) {
      return res.status(413).json({ success: false, error: "Snapshot exceeds 10 MB limit" });
    }

    // Ensure the target directory exists
    const uploadDir = path.join(__dirname, "../public/uploads/snapshots");
    ensureDir(uploadDir);

    // Write file
    const filename  = `snap_${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${ext}`;
    const filepath  = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, buffer);

    // Build public URL
    const publicUrl = buildPublicUrl(`uploads/snapshots/${filename}`);

    console.log(`✅ Snapshot saved → ${publicUrl}  (${Math.round(buffer.byteLength / 1024)} KB)`);

    return res.status(200).json({ success: true, url: publicUrl });

  } catch (err) {
    console.error("❌ Snapshot upload error:", err);
    return res.status(500).json({ success: false, error: "Failed to save snapshot image" });
  }
});


export { router };

/* ═══════════════════════════════════════════════════════════
   REQUIRED: Add to your server/index.js (or server.js)
   ──────────────────────────────────────────────────────────

   import { router as uploadRouter } from "./routes/upload.js";
   import path from "path";
   import { fileURLToPath } from "url";

   const __filename = fileURLToPath(import.meta.url);
   const __dirname  = path.dirname(__filename);

   // Serve uploaded files as static assets (images + snapshots)
   app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

   // Mount upload routes
   app.use("/api/upload", uploadRouter);

   ── Install multer if not already ────────────────────────────
   npm install multer
═══════════════════════════════════════════════════════════ */