import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const fail = (error: string, status: number) =>
    NextResponse.json({ ok: false, error }, { status })

export async function POST(req: Request) {
    const { credential } = await req.json().catch(() => ({}))
    if (!credential || typeof credential !== 'string') return fail('토큰이 없습니다.', 400)

    // 구글 ID 토큰 검증
    const googleRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
        { cache: 'no-store' },
    ).catch(() => null)
    if (!googleRes) return fail('구글 인증 서버에 연결할 수 없습니다.', 502)

    const googleData = await googleRes.json().catch(() => ({}))
    if (!googleRes.ok || googleData.error_description) {
        return fail(googleData.error_description ?? '유효하지 않은 토큰입니다.', 400)
    }

    // 발급 대상(client id)이 우리 앱인지 확인 (GOOGLE_CLIENT_ID 설정 시)
    const expectedAud = process.env.GOOGLE_CLIENT_ID
    if (expectedAud && googleData.aud !== expectedAud) return fail('유효하지 않은 토큰입니다.', 400)

    if (String(googleData.email_verified) !== 'true') return fail('인증되지 않은 이메일입니다.', 403)

    const email = String(googleData.email ?? '').toLowerCase()
    const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL?.toLowerCase()

    const supabase = await createClient()
    const { data: config } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'allowed_domain')
        .single()

    const ALLOWED_DOMAIN = config?.value ?? '@g.cnees.kr'

    if (email !== SUPERADMIN_EMAIL && !email.endsWith(ALLOWED_DOMAIN)) {
        return fail('허용되지 않은 이메일 주소입니다.', 403)
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credential
    })

    if (error) return fail(error.message, 500)

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user?.id)
        .single()

    return NextResponse.json({
        ok: true,
        user: data.user,
        role: profile?.role ?? 'user',
    })
}
