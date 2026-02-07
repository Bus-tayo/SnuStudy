import { supabase } from "@/lib/supabase/client";

const PDF_BUCKET_NAME = "task-materials";

export async function fetchTaskPdfMaterials({ taskId }) {
  const { data, error } = await supabase
    .from("task_materials")
    .select("*")
    .eq("task_id", taskId)
    .eq("type", "PDF")
    .order("id", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function uploadTaskMaterialPdf({ taskId, file, uploaderId }) {
  const ext = file.name.split(".").pop();
  const filename = `${Date.now()}.${ext}`;
  const path = `${taskId}/${filename}`;

  // 스토리지의 task_materials 버킷에 업로드
  const { data: storageData, error: storageError } = await supabase.storage
    .from(PDF_BUCKET_NAME)
    .upload(path, file);

  if (storageError) throw storageError;

  // 스토리지의 task_materials 버킷에서 파일의 public url을 가져옴
  const { data: publicData } = supabase.storage
    .from(PDF_BUCKET_NAME)
    .getPublicUrl(path);

  const publicUrl = publicData.publicUrl;

  // DB에 task_materials 테이블에 insert
  const { data, error } = await supabase
    .from("task_materials")
    .insert({
      task_id: taskId,
      type: "PDF",
      title: file.name,
      file_url: publicUrl,
      uploaded_by: uploaderId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTaskMaterial({ materialId, uploaderId }) {
  // 1. DB에서 메타데이터 조회 (storage 경로 확인용)
  // file_url 컬럼만 있으므로, 거기서 실제 스토리지 경로(폴더/파일명)를 추출해야 함
  // URL 예: .../task-materials/101/1707321234.pdf

  const { data: material, error: fetchErr } = await supabase
    .from("task_materials")
    .select("*")
    .eq("id", materialId)
    .single();

  if (fetchErr) throw fetchErr;
  if (!material) throw new Error("자료를 찾을 수 없습니다.");

  // 업로더(멘토) 본인만 삭제 가능
  if (material.uploaded_by !== uploaderId) {
    throw new Error("삭제 권한이 없습니다.");
  }

  // URL에서 스토리지 경로(폴더/파일명) 추출
  const filename = material.file_url.split(`/${PDF_BUCKET_NAME}/`).pop();

  // 2. 스토리지에서 파일 삭제
  const { error: storageErr } = await supabase.storage
    .from(PDF_BUCKET_NAME)
    .remove([filename]);

  if (storageErr) {
    console.error("Storage delete error:", storageErr);
    throw storageErr;
  }

  // 3. DB 레코드 삭제
  const { error: dbErr } = await supabase
    .from("task_materials")
    .delete()
    .eq("id", materialId);

  if (dbErr) throw dbErr;
  return true;
}
