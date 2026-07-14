import { supabase } from "@/integrations/supabase/client";

const BUCKET = "avatars";

export async function uploadAvatarFile(file: File, uid: string) {
  const timestamp = Date.now();
  const path = `${uid}/${timestamp}_${file.name}`;

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { publicUrl: pub.publicUrl, path };
}

export async function deleteAvatarPath(path: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

export function publicUrlToPath(publicUrl: string) {
  const base = (import.meta.env.VITE_SUPABASE_URL as string) || "";
  const marker = `${base.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}
