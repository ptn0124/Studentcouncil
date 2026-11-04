import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  MAX_FILES_PER_MINUTE,
  MINUTES_BUCKET,
  getExtension,
  validateAttachment,
} from "@/lib/attachments";
import { getSessionWithRole, isAdminRole } from "@/lib/server/auth";

interface Params {
  params: Promise<{ id: string }>;
}

type FileInfo = { name: string; size: number; type?: string };

// 1단계: 업로드할 파일 정보를 검증하고, 파일마다 서명된 업로드 URL(토큰)을 발급한다.
// 파일 본문은 클라이언트가 Supabase Storage로 직접 올린다 (서버 요청 크기 제한 회피).
export async function POST(req: Request, context: Params) {
  const { id } = await context.params;
  const supabase = await createClient();

  const { session, role } = await getSessionWithRole(supabase);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (!isAdminRole(role)) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const { files } = (await req.json()) as { files?: FileInfo[] };
  if (!Array.isArray(files) || files.length === 0) {
    return NextResponse.json({ error: "업로드할 파일이 없습니다." }, { status: 400 });
  }

  const { data: minute } = await supabase
    .from("meeting_minutes")
    .select("id")
    .eq("id", id)
    .single();
  if (!minute) return NextResponse.json({ error: "회의록을 찾을 수 없습니다." }, { status: 404 });

  const errors = files.map((f) => validateAttachment(f)).filter(Boolean);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join("\n") }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("minute_attachments")
    .select("id")
    .eq("minute_id", id);
  if ((existing?.length ?? 0) + files.length > MAX_FILES_PER_MINUTE) {
    return NextResponse.json(
      { error: `첨부파일은 회의록당 최대 ${MAX_FILES_PER_MINUTE}개까지 가능합니다.` },
      { status: 400 },
    );
  }

  const uploads = [];
  for (const file of files) {
    // 스토리지 키에는 한글 등 비ASCII 문자를 쓸 수 없어 무작위 이름을 쓰고, 원래 이름은 DB에 저장
    const path = `${id}/${crypto.randomUUID()}.${getExtension(file.name)}`;
    const { data, error } = await supabase.storage
      .from(MINUTES_BUCKET)
      .createSignedUploadUrl(path);
    if (error || !data) {
      return NextResponse.json(
        { error: "업로드 URL 발급 실패: " + (error?.message ?? "알 수 없는 오류") },
        { status: 500 },
      );
    }
    uploads.push({ path, token: data.token, name: file.name, size: file.size, type: file.type ?? null });
  }

  return NextResponse.json({ uploads });
}
