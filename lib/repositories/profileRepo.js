import { supabase } from "@/lib/supabase/client";
import { fetchAppUserByAuthUid } from "./appUserRepo";

export async function fetchMyProfile() {
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  const user = authData?.user;
  if (!user) throw new Error("로그인이 필요합니다.");

  const appUser = await fetchAppUserByAuthUid(user.id);

  return {
    userId: appUser.id,
    role: appUser.role,
    mentorId: appUser.mentor_id,
    name: appUser.name,
    avatarUrl: user.user_metadata?.avatar_url ?? null,
  };
}

export async function updateMyName(newName) {
  if (!newName) throw new Error("닉네임을 입력해주세요.");

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  const authUid = authData?.user?.id;
  if (!authUid) throw new Error("로그인이 필요합니다.");

  const { error: updErr } = await supabase.from("users").update({ name: newName }).eq("auth_uid", authUid);
  if (updErr) throw updErr;

  // auth metadata도 맞춰서 보정
  await supabase.auth.updateUser({ data: { full_name: newName } });

  return newName;
}

export async function updateMyAvatarUrl(avatarUrl) {
  if (!avatarUrl) throw new Error("avatarUrl 이 비어 있습니다.");
  const { error } = await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
  if (error) throw error;
  return avatarUrl;
}
