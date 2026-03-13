import { Router } from "express";
import { getAttestations } from "../services/attestations.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const tokenId = req.query.tokenId as string | undefined;
    if (!tokenId) {
      res.status(400).json({ error: "tokenId is required" });
      return;
    }

    const limit = Number(req.query.limit) || 20;

    const result = await getAttestations(tokenId, limit);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Attestations error:", message);
    res.status(500).json({ error: message });
  }
});

export default router;
