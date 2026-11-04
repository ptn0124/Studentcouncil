import { requireAdmin, requireUser } from "@/lib/auth";
import { MINUTES_BUCKET } from "@/lib/storage";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string; fileId: string }>;
}

// 첨부파일 다운로드 (로그인 필요) — 60초짜리 서명 URL로 리다이렉트
export async function GET(req: Request, context: Params) {
  const { id, fileId } = await context.params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { data: file } = await auth.supabase
    .from("meeting_minute_files")
    .select("storage_path, file_name")
    .eq("id", fileId)
    .eq("minute_id", id)
    .maybeSingle();
  if (!file) return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });

  const { data, error } = await auth.supabase.storage
    .from(MINUTES_BUCKET)
    .createSignedUrl(file.storage_path, 60, { download: file.file_name });
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "다운로드 URL 생성 실패" }, { status: 500 });
  }
  return NextResponse.redirect(data.signedUrl);
}

// 첨부파일 삭제 (admin+)
export async function DELETE(req: Request, context: Params) {
  const { id, fileId } = await context.params;
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { data: file } = await auth.supabase
    .from("meeting_minute_files")
    .select("storage_path")
    .eq("id", fileId)
    .eq("minute_id", id)
    .maybeSingle();
  if (!file) return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });

  const { error: rmErr } = await auth.supabase.storage
    .from(MINUTES_BUCKET)
    .remove([file.storage_path]);
  if (rmErr) return NextResponse.json({ error: rmErr.message }, { status: 500 });

  const { error } = await auth.supabase
    .from("meeting_minute_files")
    .delete()
    .eq("id", fileId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: "파일이 삭제되었습니다." });
}
