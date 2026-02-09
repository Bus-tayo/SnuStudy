"use client";

import { useEffect, useRef, useState } from "react";
import { uploadProfileImage } from "@/lib/storage/profileImageStorage";
import { fetchMyProfile, updateMyAvatarUrl, updateMyName } from "@/lib/repositories/profileRepo";
import { persistAppUserToStorage } from "@/lib/auth/session";

export default function ProfileCard() {
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [nameInput, setNameInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const p = await fetchMyProfile();
        if (!alive) return;
        setProfile(p);
        setNameInput(p.name || "");
      } catch (e) {
        if (!alive) return;
        setErr(e?.message ?? "프로필 정보를 불러오지 못했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const onPickFile = () => fileInputRef.current?.click();

  const onChangeFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.userId) return;

    try {
      setErr("");
      setToast("이미지 업로드 중...");
      const { publicUrl } = await uploadProfileImage({ userId: profile.userId, file });
      await updateMyAvatarUrl(publicUrl);
      setProfile((prev) => ({ ...prev, avatarUrl: publicUrl }));
      setToast("프로필 이미지가 업데이트되었습니다.");
    } catch (ex) {
      console.error("[ProfileCard/upload]", ex);
      setErr(ex?.message ?? "이미지 업로드에 실패했습니다.");
      setToast("");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSaveName = async () => {
    if (!nameInput?.trim()) {
      setErr("닉네임을 입력해주세요.");
      return;
    }
    try {
      setErr("");
      setSavingName(true);
      const newName = nameInput.trim();
      await updateMyName(newName);
      setProfile((prev) => ({ ...prev, name: newName }));
      if (profile) {
        persistAppUserToStorage({
          appUserId: profile.userId,
          role: profile.role,
          mentorId: profile.mentorId,
          name: newName,
        });
      }
      setToast("닉네임이 저장되었습니다.");
    } catch (ex) {
      console.error("[ProfileCard/saveName]", ex);
      setErr(ex?.message ?? "닉네임 저장에 실패했습니다.");
    } finally {
      setSavingName(false);
    }
  };

  const avatarFallback = profile?.name?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="card-base p-3 space-y-3">
      <div className="flex items-center gap-3">
        {profile?.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt="avatar"
            className="w-16 h-16 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-extrabold border border-border">
            {avatarFallback}
          </div>
        )}

        <div className="flex-1">
          <div className="text-xs text-foreground/60">마이페이지</div>
          <div className="text-base font-extrabold">
            {loading ? "불러오는 중..." : profile?.name || "닉네임"}
          </div>
        </div>

        <button
          onClick={onPickFile}
          className="btn-primary"
          disabled={loading}
        >
          이미지 변경
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/jpg, image/webp"
          className="hidden"
          onChange={onChangeFile}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-extrabold">닉네임</label>
        <div className="flex gap-2">
          <input
            className="flex-1 border border-border rounded-xl px-3 py-2 text-sm bg-background"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="닉네임을 입력하세요"
          />
          <button
            onClick={onSaveName}
            disabled={savingName || loading}
            className="btn-primary disabled:opacity-60"
          >
            {savingName ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      {toast ? <div className="text-xs text-foreground/70">{toast}</div> : null}
      {err ? <div className="text-xs text-red-600">{err}</div> : null}
    </div>
  );
}
