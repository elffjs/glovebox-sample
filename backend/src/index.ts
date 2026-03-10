import "dotenv/config";
import express from "express";
import cors from "cors";
import uploadRouter from "./routes/upload.js";
import { authenticate } from "./services/dimo.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/upload", uploadRouter);

app.listen(PORT, async () => {
  console.log(`Backend listening on http://localhost:${PORT}`);

  try {
    await authenticate();
  } catch (err) {
    console.warn("DIMO auth skipped:", (err as Error).message);
  }
});
