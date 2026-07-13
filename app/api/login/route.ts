import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const { credential } = await req.json()
    if (!credential) return NextResponse.json({ error: '토큰이 없습니다.' }, { status: 400 })
    
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`) 
    const googleData = await googleRes.json()
    if (googleData.error_description) return NextResponse.json({ error: googleData.error_description }, { status: 400 })
    
    const email = googleData.email as string
    const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL

    const supabase = await createClient()
    const { data: config } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'allowed_domain')
        .single()

    const ALLOWED_DOMAIN = config?.value ?? '@g.cnees.kr'

    
    if (email !== SUPERADMIN_EMAIL && !email.endsWith(ALLOWED_DOMAIN)) {
        return NextResponse.json({ error: '허용되지 않은 이메일 주소입니다.' }, { status: 403 })
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credential
    })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user?.id)
        .single()

    return NextResponse.json({
        user: data.user,
        role: profile?.role ?? 'user'
    })
}

