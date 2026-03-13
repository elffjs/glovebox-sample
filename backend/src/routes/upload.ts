import { Router } from "express";
import multer from "multer";
import { convertToImage } from "../services/convert.js";
import { parseDocumentImage } from "../services/openai.js";
import { attestDocument, attestRawFile } from "../services/attest.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

const router = Router();

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const tokenId = req.body.tokenId as string | undefined;
    if (!tokenId) {
      res.status(400).json({ error: "tokenId is required" });
      return;
    }

    const { buffer, mimetype, originalname } = req.file;
    console.log(`Received: ${originalname} (${mimetype}, ${buffer.length} bytes)`);

    const { base64, mediaType } = await convertToImage(buffer, mimetype, originalname);
    console.log(`Converted to ${mediaType} (${Math.round(base64.length * 0.75 / 1024)}KB)`);

    const result = await parseDocumentImage(base64, mediaType);
    console.log(`Parsed:`, JSON.stringify(result, null, 2));

    await Promise.all([
      attestDocument(result, tokenId),
      attestRawFile(buffer, mimetype, tokenId),
    ]);
    console.log(`Attested parsed doc and raw file to vehicle token ${tokenId}`);

    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Upload error:", message);
    res.status(500).json({ error: message });
  }
});

export default router;
