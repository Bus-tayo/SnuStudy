import { supabase } from "@/lib/supabase/client";

// Supabase 퍼블릭 버킷 이름
const BUCKET = "profile";

function assertImage(file) {
  const type = (file?.type || "").toLowerCase();
  const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

  if (!allowed.includes(type)) {
    throw new Error("jpg/png/webp 형식의 이미지만 업로드할 수 있습니다.");
  }

  const sizeMb = (file?.size || 0) / (1024 * 1024);
  if (sizeMb > 5) {
    throw new Error("파일이 너무 큽니다. (최대 5MB)");
  }
}

function buildPath({ userId, file }) {
  const ts = Date.now();
  const safeName = (file?.name || "avatar.jpg").replace(/[^\w.\-]+/g, "_");
  return `${userId}/${ts}_${safeName}`;
}

export async function uploadProfileImage({ userId, file }) {
  if (!userId) throw new Error("로그인이 필요합니다.");
  if (!file) throw new Error("업로드할 파일이 없습니다.");

  assertImage(file);

  const path = buildPath({ userId, file });

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true, // 기존 이미지는 덮어쓰기
      contentType: file.type || "image/jpeg",
    });

  if (uploadErr) throw uploadErr;

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = urlData?.publicUrl;
  if (!publicUrl) {
    throw new Error("이미지 공개 URL 생성에 실패했습니다.");
  }

  return { path, publicUrl };
}
