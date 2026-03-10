import sharp from "sharp";
import * as mupdf from "mupdf";

const MAX_LONG_EDGE = 2048;

async function resizeIfNeeded(buffer: Buffer): Promise<Buffer> {
  const image = sharp(buffer);
  const metadata = await image.metadata();
  const { width, height } = metadata;

  if (width && height && Math.max(width, height) > MAX_LONG_EDGE) {
    const resized = await image
      .resize({
        width: width >= height ? MAX_LONG_EDGE : undefined,
        height: height > width ? MAX_LONG_EDGE : undefined,
        fit: "inside",
      })
      .jpeg({ quality: 90 })
      .toBuffer();
    return resized;
  }

  return buffer;
}

function isHeic(mimetype: string, filename: string): boolean {
  if (mimetype === "image/heic" || mimetype === "image/heif") return true;
  if (mimetype === "application/octet-stream") {
    const ext = filename.toLowerCase().split(".").pop();
    return ext === "heic" || ext === "heif";
  }
  return false;
}

function pdfFirstPageToPng(fileBuffer: Buffer): Buffer {
  const doc = mupdf.Document.openDocument(fileBuffer, "application/pdf");
  const page = doc.loadPage(0);
  const bounds = page.getBounds();
  const pageWidth = bounds[2] - bounds[0];
  const pageHeight = bounds[3] - bounds[1];

  // Scale so the longest edge is MAX_LONG_EDGE
  const scale = MAX_LONG_EDGE / Math.max(pageWidth, pageHeight);
  const matrix = mupdf.Matrix.scale(scale, scale);

  const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);
  const pngData = pixmap.asPNG();
  return Buffer.from(pngData);
}

export async function convertToImage(
  fileBuffer: Buffer,
  mimetype: string,
  filename: string
): Promise<{ base64: string; mediaType: string }> {
  let outputBuffer: Buffer;

  if (mimetype === "application/pdf") {
    outputBuffer = pdfFirstPageToPng(fileBuffer);
    return {
      base64: outputBuffer.toString("base64"),
      mediaType: "image/png",
    };
  }

  if (isHeic(mimetype, filename)) {
    outputBuffer = await sharp(fileBuffer).jpeg({ quality: 90 }).toBuffer();
    outputBuffer = await resizeIfNeeded(outputBuffer);
    return {
      base64: outputBuffer.toString("base64"),
      mediaType: "image/jpeg",
    };
  }

  if (mimetype.startsWith("image/")) {
    outputBuffer = await resizeIfNeeded(fileBuffer);
    const meta = await sharp(outputBuffer).metadata();
    const outType = meta.format === "png" ? "image/png" : "image/jpeg";

    if (meta.format !== "png" && meta.format !== "jpeg") {
      outputBuffer = await sharp(outputBuffer).jpeg({ quality: 90 }).toBuffer();
      return { base64: outputBuffer.toString("base64"), mediaType: "image/jpeg" };
    }

    return { base64: outputBuffer.toString("base64"), mediaType: outType };
  }

  // Fallback: try sharp JPEG conversion for unknown types
  try {
    outputBuffer = await sharp(fileBuffer).jpeg({ quality: 90 }).toBuffer();
    outputBuffer = await resizeIfNeeded(outputBuffer);
    return { base64: outputBuffer.toString("base64"), mediaType: "image/jpeg" };
  } catch {
    throw new Error(`Unsupported file type: ${mimetype}`);
  }
}
