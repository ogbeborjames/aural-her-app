import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  uploadAvatarFile,
  deleteAvatarPath,
  publicUrlToPath,
  saveAvatarToProfile,
  clearAvatarFromProfile,
} from "./avatarStorage";

type Props = {
  size?: number; // px
  name: string;
  currentUrl?: string | null;
  avatarPath?: string | null;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function resizeImage(file: File, maxDim = 1024) {
  // simple client-side resize to contain within maxDim, returns a Blob
  return new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      const ratio = width / height;
      if (width > maxDim || height > maxDim) {
        if (ratio > 1) {
          width = maxDim;
          height = Math.round(maxDim / ratio);
        } else {
          height = maxDim;
          width = Math.round(maxDim * ratio);
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unsupported"));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Compression failed"));
          resolve(blob);
        },
        "image/jpeg",
        0.85,
      );
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load error"));
    };
    img.src = url;
  });
}

export default function ProfileAvatar({ size = 48, name, currentUrl, avatarPath }: Props) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);

  const uid = user?.id;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  useEffect(() => {
    // if an avatarPath is provided and we don't yet have a preview, fetch its public url
    if (avatarPath && !preview) {
      const fetchUrl = async () => {
        try {
          const { data } = supabase.storage.from("avatars").getPublicUrl(avatarPath);
          setPreview(data.publicUrl ?? null);
        } catch (e) {
          console.warn("failed to get public url for avatar path", e);
        }
      };
      void fetchUrl();
    }
  }, [avatarPath, preview]);

  async function handleUpload(file: File) {
    if (!file) {
      alert("Please choose an image to upload.");
      return;
    }

    if (!uid) {
      alert("You must be signed in to upload an avatar.");
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("Please select a JPG, PNG, or WebP image.");
      return;
    }

    setUploading(true);
    try {
      if (file.size > MAX_FILE_SIZE) {
        const blob = await resizeImage(file, 1024);
        file = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
      }

      const { publicUrl, path } = await uploadAvatarFile(file, uid);
      await saveAvatarToProfile(uid, publicUrl, path);

      try {
        const oldPath = avatarPath ?? publicUrlToPath(currentUrl ?? "");
        if (oldPath) await deleteAvatarPath(oldPath);
      } catch (error) {
        console.warn("[Avatar] Failed to delete previous storage object", error);
      }

      setPreview(publicUrl);
      setOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      console.error("[Avatar] Upload failed", { userId: uid, error });
      alert(message);
    } finally {
      setUploading(false);
    }
  }

  function onPick() {
    inputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setPreview(url);
    void handleUpload(f);
  }

  async function onRemove() {
    if (!uid) {
      alert("You must be signed in to remove your avatar.");
      return;
    }

    const ok = window.confirm("Remove your profile picture?");
    if (!ok) return;

    setUploading(true);
    try {
      const pathToRemove = avatarPath ?? publicUrlToPath(preview ?? "");
      if (pathToRemove) {
        await deleteAvatarPath(pathToRemove);
      }

      await clearAvatarFromProfile(uid);
      setPreview(null);
      setOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Remove failed";
      console.error("[Avatar] Remove failed", { userId: uid, error });
      alert(message);
    } finally {
      setUploading(false);
    }
  }

  function onView() {
    if (!preview) return;
    window.open(preview, "_blank");
    setOpen(false);
  }

  const avatar = (
    <div
      className="group block cursor-pointer rounded-full transition-transform active:scale-95"
      style={{ width: size, height: size }}
      role="button"
      tabIndex={0}
      aria-label="Profile photo options"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") setOpen(true);
      }}
      onClick={() => setOpen(true)}
    >
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={onFileChange} />

      <div
        className="rounded-full overflow-hidden bg-muted flex items-center justify-center shadow-sm"
        style={{ width: size, height: size, boxShadow: "0 6px 18px rgba(16,24,40,0.08)" }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={`${name} avatar`}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "";
              setPreview(null);
            }}
          />
        ) : (
          <div className="flex items-center justify-center font-bold text-white bg-primary h-full w-full">
            {name
              .trim()
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );

  // Menu content
  const menu = (
    <div className="flex flex-col gap-2">
      {preview ? (
        <>
          <button className="text-left px-3 py-2 rounded hover:bg-muted" onClick={onView}>
            View Photo
          </button>
          <button className="text-left px-3 py-2 rounded hover:bg-muted" onClick={onPick}>
            Change Photo
          </button>
          <button className="text-left px-3 py-2 rounded text-destructive hover:bg-muted" onClick={onRemove}>
            Remove Photo
          </button>
        </>
      ) : (
        <button className="text-left px-3 py-2 rounded hover:bg-muted" onClick={onPick}>
          Upload Photo
        </button>
      )}
      <button className="text-left px-3 py-2 rounded hover:bg-muted" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </div>
  );

  return (
    <div className="inline-flex items-center">
      {isMobile ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>{avatar}</SheetTrigger>
          <SheetContent side="bottom">
            <div className="max-w-md mx-auto">
              <div className="mb-2 text-center">
                <h3 className="text-lg font-medium">Profile Photo</h3>
                <p className="text-sm text-muted-foreground">Manage your profile picture</p>
              </div>
              {menu}
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{avatar}</PopoverTrigger>
          <PopoverContent>{menu}</PopoverContent>
        </Popover>
      )}
    </div>
  );
}
