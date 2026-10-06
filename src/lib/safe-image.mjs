import sharp from "sharp";

export async function normalizeImage(bytes, size) {
  const input = sharp(bytes, { limitInputPixels: 16000000, animated: false, failOn: "warning" });
  const metadata = await input.metadata();
  if (!["jpeg", "png", "webp"].includes(metadata.format) || (metadata.pages || 1) > 1) {
    throw new Error("Unsupported image format");
  }
  // Decode and re-encode; discard injected trailing content and embedded metadata.
  return input.rotate().resize(size, size, { fit: "cover", position: "centre", withoutEnlargement: true }).png().toBuffer();
}
