import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { MINUTES_BUCKET } from "@/lib/attachments";
import { getSessionWithRole, isAdminRole } from "@/lib/server/auth";

interface Params {
  params: Promise<{ id: string }>;
}

const WITH_ATTACHMENTS =
  "*, minute_attachments(id, minute_id, file_name, file_path, file_size, mime_type, created_at)";

export async function GET(req: Request, context: Params) {
  const { id } = await context.params;
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 },
    );

  const { data, error } = await supabase
    .from("meeting_minutes")
    .select(WITH_ATTACHMENTS)
    .eq("id", id)
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ minute: data });
}

export async function PATCH(req: Request, context: Params) {
  const { id } = await context.params;
  const supabase = await createClient();

  const { session, role } = await getSessionWithRole(supabase);
  if (!session)
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 },
    );
  if (!isAdminRole(role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { title, content, meeting_date } = await req.json();
  const { data, error } = await supabase
    .from("meeting_minutes")
    .update({
      ...(title && { title }),
      // 내용을 비우는 수정도 허용
      ...(content !== undefined && { content }),
      ...(meeting_date && { meeting_date }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(WITH_ATTACHMENTS)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ minute: data });
}

// 회의록 삭제 — 스토리지의 첨부파일도 함께 삭제한다.
// (minute_attachments 행은 FK ON DELETE CASCADE로 자동 삭제)
export async function DELETE(req: Request, context: Params) {
  const { id } = await context.params;
  const supabase = await createClient();

  const { session, role } = await getSessionWithRole(supabase);
  if (!session)
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 },
    );
  if (!isAdminRole(role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { data: attachments } = await supabase
    .from("minute_attachments")
    .select("file_path")
    .eq("minute_id", id);

  const { error } = await supabase
    .from("meeting_minutes")
    .delete()
    .eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const paths = (attachments ?? []).map((a) => a.file_path);
  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(MINUTES_BUCKET)
      .remove(paths);
    if (storageError) {
      // 회의록은 이미 삭제됨 — 고아 파일만 남으므로 로그로 남기고 성공 처리
      console.error("첨부파일 스토리지 삭제 실패:", storageError.message, paths);
    }
  }

  return NextResponse.json(
    { message: "회의록이 삭제되었습니다." },
    { status: 200 },
  );
}
