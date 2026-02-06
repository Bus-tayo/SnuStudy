import { supabase } from "@/lib/supabase/client";

const BUCKET = "task-submissions";

function assertJpg(file) {
  const t = (file?.type || "").toLowerCase();
  if (t !== "image/jpeg" && t !== "image/jpg") {
    throw new Error("jpg/jpeg 파일만 업로드할 수 있습니다.");
  }
  const sizeMb = (file?.size || 0) / (1024 * 1024);
  if (sizeMb > 8) {
    throw new Error("파일이 너무 큽니다. (최대 8MB)");
  }
}

function buildPath({ taskId, menteeId, file }) {
  const ts = Date.now();
  const safeName = (file?.name || "photo.jpg").replace(/[^\w.\-]+/g, "_");
  return `${menteeId}/${taskId}/${ts}_${safeName}`;
}

export async function uploadTaskSubmissionImageJpg({ file, taskId, menteeId }) {
  assertJpg(file);

  const path = buildPath({ taskId, menteeId, file });

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      upsert: false,
      contentType: "image/jpeg",
      cacheControl: "3600",
    });

  if (upErr) throw upErr;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = data?.publicUrl;

  if (!publicUrl) {
    throw new Error("업로드는 되었지만 public URL 생성에 실패했습니다.");
  }

  return { path, publicUrl };
}
