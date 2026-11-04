import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { SUGGESTION_COLUMNS } from '@/lib/suggestionStatus'

// 목록 조회 (로그인한 사용자 누구나 — 읽기 전용, 상태 변경은 [id] PATCH에서 관리자만)
export async function GET() {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { data, error } = await supabase
        .from('suggestions')
        .select(SUGGESTION_COLUMNS)
        .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ suggestions: data })
}

// 생성 (로그인 사용자) — 작성자 정보를 함께 저장 (익명 작성 불가)
export async function POST(req: Request) {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { content } = await req.json()

    if (!content || !String(content).trim()) {
        return NextResponse.json({ error: '내용은 필수입니다.' }, { status: 400 })
    }

    const meta = session.user.user_metadata ?? {}
    const { data, error } = await supabase
        .from('suggestions')
        .insert({
            content,
            author_id: session.user.id,
            author_name: meta.full_name ?? meta.name ?? null,
            author_email: session.user.email ?? null,
        })
        .select(SUGGESTION_COLUMNS)
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ suggestion: data }, { status: 201 })
}
