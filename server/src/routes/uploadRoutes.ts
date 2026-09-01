import { Router, Request, Response } from "express";
import multer from "multer";
import { processUpload } from "../services/uploadService";
import { getUploadBlob, getUploadById, listUploads } from "../services/uploadStore";

const router = Router();

// Memory storage — file bytes live in req.file.buffer, which uploadService
// then persists into the `uploads.rawBlob` BLOB column. 20MB cap is plenty
// for a hospital patient-history export while still protecting the server.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// POST /api/uploads — multipart/form-data, field name "file"
router.post("/uploads", upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded. Attach a CSV file under field name 'file'." });
  }

  try {
    const record = processUpload(req.file.originalname, req.file.buffer);
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Upload processing failed" });
  }
});

// GET /api/uploads — history of past uploads (no raw blob, kept light)
router.get("/uploads", (_req: Request, res: Response) => {
  res.json(listUploads());
});

// GET /api/uploads/:id — single upload record + analytics
router.get("/uploads/:id", (req: Request, res: Response) => {
  const record = getUploadById(req.params.id);
  if (!record) return res.status(404).json({ error: `Upload ${req.params.id} not found` });
  res.json(record);
});

// GET /api/uploads/:id/file — download the original raw file back out of the BLOB
router.get("/uploads/:id/file", (req: Request, res: Response) => {
  const blob = getUploadBlob(req.params.id);
  if (!blob) return res.status(404).json({ error: `Upload ${req.params.id} not found` });
  res.setHeader("Content-Disposition", `attachment; filename="${blob.filename}"`);
  res.setHeader("Content-Type", "text/csv");
  res.send(blob.buffer);
});

export default router;
