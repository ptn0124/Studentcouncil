import { requireAdmin, requireUser, isValidDate } from "@/lib/auth";
import { MINUTES_BUCKET, MINUTE_SELECT } from "@/lib/storage";
import { NextResponse } from "next/server";

const MAX_TITLE = 80;
const MAX_CONTENT = 20000;

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, context: Params) {
  const { id } = await context.params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from("meeting_minutes")
    .select(MINUTE_SELECT)
    .eq("id", id)
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ minute: data });
}

export async function PATCH(req: Request, context: Params) {
  const { id } = await context.params;
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { title, content, meeting_date } = await req.json().catch(() => ({}));

  if (title !== undefined && (typeof title !== "string" || !title.trim() || title.trim().length > MAX_TITLE)) {
    return NextResponse.json({ error: `제목은 1~${MAX_TITLE}자로 입력해주세요.` }, { status: 400 });
  }
  if (content !== undefined && (typeof content !== "string" || content.length > MAX_CONTENT)) {
    return NextResponse.json({ error: `내용은 ${MAX_CONTENT}자 이하로 입력해주세요.` }, { status: 400 });
  }
  if (meeting_date !== undefined && !isValidDate(meeting_date)) {
    return NextResponse.json({ error: "회의 날짜 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("meeting_minutes")
    .update({
      ...(title !== undefined && { title: title.trim() }),
      // 내용을 빈 문자열로 비우는 것도 허용
      ...(content !== undefined && { content }),
      ...(meeting_date !== undefined && { meeting_date }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(MINUTE_SELECT)
    .single();

  if (error) {
    const status = error.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ minute: data });
}

export async function DELETE(req: Request, context: Params) {
  const { id } = await context.params;
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  // 회의록 삭제 전에 Storage의 첨부파일도 함께 지운다 (DB 행은 cascade로 삭제됨)
  const { data: files } = await supabase
    .from("meeting_minute_files")
    .select("storage_path")
    .eq("minute_id", id);

  const { data: deleted, error } = await supabase
    .from("meeting_minutes")
    .delete()
    .eq("id", id)
    .select("id");
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  if (!deleted?.length)
    return NextResponse.json({ error: "회의록을 찾을 수 없습니다." }, { status: 404 });

  if (files?.length) {
    await supabase.storage
      .from(MINUTES_BUCKET)
      .remove(files.map((f) => f.storage_path));
  }

  return NextResponse.json(
    { message: "회의록이 삭제되었습니다." },
    { status: 200 },
  );
}
