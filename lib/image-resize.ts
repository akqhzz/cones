/**
 * Resize image buffer for smaller file size. Outputs JPEG.
 * Max dimension 800px, quality 85.
 */
export async function resizeImage(
  buffer: Buffer,
  mimeType: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  const sharp = (await import('sharp')).default;
  const maxSize = 800;
  const quality = 85;

  const image = sharp(buffer)
    .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality });

  const out = await image.toBuffer();
  return { buffer: out, mimeType: 'image/jpeg' };
}
