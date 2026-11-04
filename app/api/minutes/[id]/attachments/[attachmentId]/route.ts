import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { MINUTES_BUCKET } from "@/lib/attachments";
import { getSessionWithRole, isAdminRole } from "@/lib/server/auth";

interface Params {
  params: Promise<{ id: string; attachmentId: string }>;
}

async function findAttachment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  minuteId: string,
  attachmentId: string,
) {
  const { data } = await supabase
    .from("minute_attachments")
    .select("id, file_name, file_path")
    .eq("id", attachmentId)
    .eq("minute_id", minuteId)
    .single();
  return data;
}

// 첨부파일 다운로드 (로그인 사용자) — 짧게 유효한 서명 URL로 리다이렉트
export async function GET(req: Request, context: Params) {
  const { id, attachmentId } = await context.params;
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const attachment = await findAttachment(supabase, id, attachmentId);
  if (!attachment) return NextResponse.json({ error: "첨부파일을 찾을 수 없습니다." }, { status: 404 });

  const { data, error } = await supabase.storage
    .from(MINUTES_BUCKET)
    .createSignedUrl(attachment.file_path, 60, { download: attachment.file_name });
  if (error || !data) {
    return NextResponse.json({ error: "다운로드 URL 생성 실패" }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}

// 첨부파일 개별 삭제 (admin+)
export async function DELETE(req: Request, context: Params) {
  const { id, attachmentId } = await context.params;
  const supabase = await createClient();

  const { session, role } = await getSessionWithRole(supabase);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (!isAdminRole(role)) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const attachment = await findAttachment(supabase, id, attachmentId);
  if (!attachment) return NextResponse.json({ error: "첨부파일을 찾을 수 없습니다." }, { status: 404 });

  const { error } = await supabase
    .from("minute_attachments")
    .delete()
    .eq("id", attachmentId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: storageError } = await supabase.storage
    .from(MINUTES_BUCKET)
    .remove([attachment.file_path]);
  if (storageError) console.error("첨부파일 스토리지 삭제 실패:", storageError.message);

  return NextResponse.json({ message: "첨부파일이 삭제되었습니다." });
}
