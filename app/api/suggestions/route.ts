import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// 목록 조회 (admin+)
export async function GET() {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

    if (!['admin', 'superadmin'].includes(profile?.role)) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { data, error } = await supabase
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ suggestions: data })
}

// 생성 (누구나)
export async function POST(req: Request) {
    const supabase = await createClient()

    const { content, is_anonymous } = await req.json()

    if (!content) {
    return NextResponse.json({ error: '내용은 필수입니다.' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('suggestions')
        .insert({
            content,
            is_anonymous: is_anonymous ?? true
        })
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ suggestion: data }, { status: 201 })
}