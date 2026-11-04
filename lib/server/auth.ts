import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export const ADMIN_ROLES = ["admin", "superadmin"];

/**
 * 현재 요청의 세션과 역할을 조회한다.
 * 로그인 안 했으면 session = null, role = null.
 */
export async function getSessionWithRole(supabase: SupabaseServerClient) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
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
