import { createClient } from "@/lib/supabase/server";
import { getVerifiedSession } from "@/lib/server/auth"
import { NextResponse } from "next/server";

// 현재 로그인 사용자의 역할 조회 (로그인 안 했으면 role: null)
export async function GET() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await getVerifiedSession(supabase);

  if (!session) return NextResponse.json({ role: null });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  return NextResponse.json({ role: profile?.role ?? "user" });
}