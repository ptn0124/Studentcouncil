import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export const ADMIN_ROLES = ["admin", "superadmin"];

export type Auth =
  | { ok: true; supabase: SupabaseClient; user: User; role: string }
  | { ok: false; response: NextResponse };

const fail = (error: string, status: number): Auth => ({
  ok: false,
  response: NextResponse.json({ error }, { status }),
});

// 로그인한 사용자를 검증한다. (getUser는 Supabase 서버에서 토큰을 검증한다)
export async function requireUser(): Promise<Auth> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("로그인이 필요합니다.", 401);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return { ok: true, supabase, user, role: profile?.role ?? "user" };
}

// admin / superadmin만 통과시킨다.
export async function requireAdmin(): Promise<Auth> {
  const auth = await requireUser();
  if (!auth.ok) return auth;
  if (!ADMIN_ROLES.includes(auth.role)) return fail("권한이 없습니다.", 403);
  return auth;
}

// 이메일 앞부분을 학번으로 사용한다. 예) bi202611122@g.cnees.kr -> bi202611122
export function studentIdFromEmail(email?: string | null): string | null {
  const local = email?.split("@")[0]?.trim();
  return local ? local : null;
}

// YYYY-MM-DD 형식이며 실제로 존재하는 날짜인지 검사
export function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
