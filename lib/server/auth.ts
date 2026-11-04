import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export const ADMIN_ROLES = ["admin", "superadmin"];

/**
 * 서버에서 신뢰할 수 있는 로그인 정보.
 *
 * supabase.auth.getSession()은 브라우저 쿠키 내용을 검증 없이 그대로 돌려주므로
 * (쿠키를 조작하면 다른 사람의 id·이메일로 위장 가능) 서버 권한 판단에 쓰면 안 된다.
 * getUser()는 Supabase Auth 서버에 토큰을 검증받아 실제 사용자를 돌려준다.
 *
 * 기존 코드와 같은 모양({ data: { session } })으로 돌려줘 호출부 변경을 최소화한다.
 */
export async function getVerifiedSession(supabase: SupabaseServerClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { data: { session: user ? { user } : null } };
}

/**
 * 검증된 사용자와 역할(profiles.role)을 조회한다.
 * 로그인 안 했으면 session = null, role = null.
 */
export async function getSessionWithRole(supabase: SupabaseServerClient) {
  const {
    data: { session },
  } = await getVerifiedSession(supabase);
  if (!session) return { session: null, role: null as string | null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  return { session, role: (profile?.role as string | undefined) ?? "user" };
}

export function isAdminRole(role: string | null | undefined) {
  return !!role && ADMIN_ROLES.includes(role);
}
