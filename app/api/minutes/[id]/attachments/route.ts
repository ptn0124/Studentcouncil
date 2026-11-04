import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { MINUTES_BUCKET, validateAttachment } from "@/lib/attachments";
import { getSessionWithRole, isAdminRole } from "@/lib/server/auth";

interface Params {
  params: Promise<{ id: string }>;
}

type UploadedFile = { path: string; name: string; size: number; type?: string | null };

// 2단계: 스토리지 업로드가 끝난 파일들을 minute_attachments 테이블에 등록한다.
export async function POST(req: Request, context: Params) {
  const { id } = await context.params;
  const supabase = await createClient();

  const { session, role } = await getSessionWithRole(supabase);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (!isAdminRole(role)) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const { files } = (await req.json()) as { files?: UploadedFile[] };
  if (!Array.isArray(files) || files.length === 0) {
    return NextResponse.json({ error: "등록할 파일이 없습니다." }, { status: 400 });
  }

  for (const file of files) {
    // 이 회의록 폴더 밖의 경로는 등록할 수 없다
    if (typeof file.path !== "string" || !file.path.startsWith(`${id}/`) || file.path.includes("..")) {
      return NextResponse.json({ error: "잘못된 파일 경로입니다." }, { status: 400 });
    }
    const invalid = validateAttachment(file);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

    // 실제로 업로드된 파일인지 확인
    const { error } = await supabase.storage.from(MINUTES_BUCKET).createSignedUrl(file.path, 60);
    if (error) {
      return NextResponse.json({ error: `"${file.name}" 업로드가 완료되지 않았습니다.` }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("minute_attachments")
    .insert(
      files.map((f) => ({
        minute_id: id,
        file_name: f.name,
        file_path: f.path,
        file_size: f.size,
        mime_type: f.type || null,
        uploaded_by: session.user.id,
      })),
    )
    .select("id, minute_id, file_name, file_path, file_size, mime_type, created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ attachments: data }, { status: 201 });
}
