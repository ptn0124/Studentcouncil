import { requireUser, studentIdFromEmail } from "@/lib/auth";
import { NextResponse } from "next/server";

// 현재 로그인 사용자의 정보 조회 (로그인 안 했으면 role: null)
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return NextResponse.json({ role: null });

  return NextResponse.json({
    role: auth.role,
    email: auth.user.email ?? null,
    student_id: studentIdFromEmail(auth.user.email),
  });
}
