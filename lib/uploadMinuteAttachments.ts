"use client";

import { createClient } from "@/lib/supabase/client";
import { MINUTES_BUCKET, MinuteAttachment } from "@/lib/attachments";

async function readError(res: Response) {
  try {
    return (await res.json()).error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

/**
 * 회의록 첨부파일 업로드
 * 1) 서버에서 파일 검증 + 서명된 업로드 URL 발급
 * 2) 브라우저에서 Supabase Storage로 직접 업로드
 * 3) 서버에 업로드 완료 등록 (minute_attachments 행 생성)
 */
export async function uploadMinuteAttachments(
  minuteId: string,
  files: File[],
): Promise<MinuteAttachment[]> {
  if (files.length === 0) return [];

  const prepRes = await fetch(`/api/minutes/${minuteId}/attachments/upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      files: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
    }),
  });
  if (!prepRes.ok) throw new Error(await readError(prepRes));
  const { uploads } = (await prepRes.json()) as {
    uploads: { path: string; token: string; name: string; size: number; type: string | null }[];
  };

  const supabase = createClient();
  const uploaded: typeof uploads = [];
  for (let i = 0; i < uploads.length; i++) {
    const u = uploads[i];
    const { error } = await supabase.storage
      .from(MINUTES_BUCKET)
      .uploadToSignedUrl(u.path, u.token, files[i], {
        contentType: files[i].type || "application/octet-stream",
      });
    if (error) {
      // 이미 올라간 파일만이라도 등록해 두고 실패를 알린다
      if (uploaded.length > 0) await register(minuteId, uploaded).catch(() => {});
      throw new Error(`"${u.name}" 업로드 실패: ${error.message}`);
    }
    uploaded.push(u);
  }

  return register(minuteId, uploaded);
}

async function register(
  minuteId: string,
  files: { path: string; name: string; size: number; type: string | null }[],
) {
  const res = await fetch(`/api/minutes/${minuteId}/attachments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return ((await res.json()).attachments ?? []) as MinuteAttachment[];
}
