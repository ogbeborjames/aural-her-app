import { supabase } from "@/integrations/supabase/client";

const BUCKET = "avatars";

export async function uploadAvatarFile(file: File, uid: string) {
  const timestamp = Date.now();
  const safeName = file.name.replace(/\s+/g, "_");
  const path = `${uid}/${timestamp}_${safeName}`;

  console.info("[Avatar] Starting upload", {
    userId: uid,
    storagePath: path,
    fileName: file.name,
    fileSize: file.size,
  });

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    console.error("[Avatar] Storage upload failed", {
      userId: uid,
      storagePath: path,
      error,
    });
    throw new Error(`Avatar upload failed: ${error.message}`);
  }

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = publicData.publicUrl;

  if (!publicUrl) {
    console.error("[Avatar] Public URL generation failed", {
      userId: uid,
      storagePath: path,
    });
    throw new Error("Avatar upload succeeded but the public URL could not be generated.");
  }

  console.info("[Avatar] Upload completed", {
    userId: uid,
    storagePath: path,
    publicUrl,
  });

  return { publicUrl, path };
}

export async function saveAvatarToProfile(userId: string, avatarUrl: string, avatarPath: string) {
  console.info("[Avatar] Updating profile row", {
    userId,
    avatarUrl,
    avatarPath,
  });

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        avatar_url: avatarUrl,
        avatar_path: avatarPath,
      },
      { onConflict: "user_id" },
    )
    .select("user_id, avatar_url, avatar_path")
    .single();

  if (error) {
    console.error("[Avatar] Profile persistence failed", {
      userId,
      avatarUrl,
      avatarPath,
      error,
    });
    throw new Error(`Profile update failed: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Profile update for user ${userId} affected no rows.`);
  }

  console.info("[Avatar] Profile row updated", { userId, data });
  return data;
}

export async function clearAvatarFromProfile(userId: string) {
  console.info("[Avatar] Clearing profile avatar fields", { userId });

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        avatar_url: null,
        avatar_path: null,
      },
      { onConflict: "user_id" },
    )
    .select("user_id, avatar_url, avatar_path")
    .single();

  if (error) {
    console.error("[Avatar] Avatar removal failed", {
      userId,
      error,
    });
    throw new Error(`Failed to remove avatar: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Avatar removal for user ${userId} affected no rows.`);
  }

  console.info("[Avatar] Profile avatar cleared", { userId, data });
  return data;
}

export async function deleteAvatarPath(path: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    console.error("[Avatar] Storage object deletion failed", { path, error });
    throw new Error(`Failed to delete old avatar: ${error.message}`);
  }
}

export function publicUrlToPath(publicUrl: string) {
  const base = (import.meta.env.VITE_SUPABASE_URL as string) || "";
  const marker = `${base.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}
