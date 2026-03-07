import { supabase } from './supabase';

const BUCKET = 'cones';

/**
 * Upload a buffer to Supabase Storage and return the public URL.
 * Bucket must exist and be public. Create in Supabase: Storage → New bucket → "cones" → Public.
 */
export async function uploadImageToStorage(
  path: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return publicUrl;
}
