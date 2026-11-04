import { requireAdmin } from "@/lib/auth";
import {
  ALLOWED_EXTENSIONS,
  MAX_FILES_PER_MINUTE,
  MAX_FILE_SIZE,
  MINUTES_BUCKET,
  extensionOf,
  sanitizeFileName,
} from "@/lib/storage";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

// 회의록 첨부파일 업로드 (admin+)
// multipart/form-data, 필드명 "files" (여러 개 가능). 파일당 2MB, 회의록당 최대 5개.
export async function POST(req: Request, context: Params) {
  const { id } = await context.params;
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  const form = await req.formData().catch(() => null);
  const files = (form?.getAll("files") ?? []).filter(
    (f): f is File => f instanceof File && f.size > 0,
  );
  if (!files.length) {
    return NextResponse.json({ error: "업로드할 파일이 없습니다." }, { status: 400 });
  }

  for (const f of files) {
    if (f.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `"${f.name}" 파일이 2MB를 초과합니다.` },
        { status: 413 },
      );
    }
    if (!ALLOWED_EXTENSIONS.has(extensionOf(f.name))) {
      return NextResponse.json(
        { error: `"${f.name}" 은(는) 허용되지 않는 파일 형식입니다.` },
        { status: 415 },
      );
    }
  }

  const { data: minute } = await supabase
    .from("meeting_minutes")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!minute) {
    return NextResponse.json({ error: "회의록을 찾을 수 없습니다." }, { status: 404 });
  }

  const { count } = await supabase
    .from("meeting_minute_files")
    .select("id", { count: "exact", head: true })
    .eq("minute_id", id);
  if ((count ?? 0) + files.length > MAX_FILES_PER_MINUTE) {
    return NextResponse.json(
      { error: `첨부파일은 회의록당 최대 ${MAX_FILES_PER_MINUTE}개까지 가능합니다.` },
      { status: 400 },
    );
  }

  const uploadedPaths: string[] = [];
  const rows = [];
  try {
    for (const f of files) {
      // Storage 키는 한글/특수문자를 피하기 위해 랜덤 이름 + 확장자 사용, 원본 이름은 DB에 저장
      const path = `${id}/${crypto.randomUUID()}.${extensionOf(f.name)}`;
      const { error: upErr } = await supabase.storage
        .from(MINUTES_BUCKET)
        .upload(path, f, { contentType: f.type || undefined, upsert: false });
      if (upErr) throw new Error(upErr.message);
      uploadedPaths.push(path);

      const { data: row, error: insErr } = await supabase
        .from("meeting_minute_files")
        .insert({
          minute_id: id,
          storage_path: path,
          file_name: sanitizeFileName(f.name),
          size: f.size,
          mime_type: f.type || null,
          uploaded_by: user.id,
        })
        .select("id, file_name, size, mime_type")
        .single();
      if (insErr) throw new Error(insErr.message);
      rows.push(row);
    }
  } catch (err) {
    // 일부만 올라간 상태를 남기지 않도록 이번 요청에서 올린 파일을 되돌린다
    if (uploadedPaths.length) {
      await supabase.storage.from(MINUTES_BUCKET).remove(uploadedPaths);
      await supabase.from("meeting_minute_files").delete().in("storage_path", uploadedPaths);
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  return NextResponse.json({ files: rows }, { status: 201 });
}
