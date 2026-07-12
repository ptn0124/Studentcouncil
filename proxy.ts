import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const email = session?.user?.email ?? "";

  const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL;

  if (req.nextUrl.pathname.startsWith("/superadmin")) {
    if (email !== SUPERADMIN_EMAIL) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (session && email !== SUPERADMIN_EMAIL) {
    const { data: config } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "allowed_domain")
      .single();

    const ALLOWED_DOMAIN = config?.value ?? "@g.cnees.kr";

    if (!email.endsWith(ALLOWED_DOMAIN)) {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL("/login?error=unauthorized", req.url),
      );
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|auth/callback).*)"],
};
