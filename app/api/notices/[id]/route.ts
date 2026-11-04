import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'

const MAX_TITLE = 100
const MAX_CONTENT = 10000

interface Params {
    params: Promise<{ id: string }>
}

// 상세 조회 — 조회수는 증가시키지 않는다. (조회수는 POST /api/notices/[id]/view 에서 처리)
export async function GET(req: Request, context: Params) {
    const { id } = await context.params
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('id', id)
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 404 })

    return NextResponse.json({ notice: data })
}

export async function PATCH(req: Request, context: Params) {
    const { id } = await context.params
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    const { title, content, is_pinned } = await req.json().catch(() => ({}))

    if (title !== undefined && (typeof title !== 'string' || !title.trim() || title.length > MAX_TITLE)) {
        return NextResponse.json({ error: `제목은 1~${MAX_TITLE}자로 입력해주세요.` }, { status: 400 })
    }
    if (content !== undefined && (typeof content !== 'string' || !content.trim() || content.length > MAX_CONTENT)) {
        return NextResponse.json({ error: `내용은 1~${MAX_CONTENT}자로 입력해주세요.` }, { status: 400 })
    }

    const { data, error } = await auth.supabase
        .from('notices')
        .update({
            ...(title !== undefined && { title: title.trim() }),
            ...(content !== undefined && { content }),
            ...(is_pinned !== undefined && { is_pinned: is_pinned === true }),
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        const status = error.code === 'PGRST116' ? 404 : 500
        return NextResponse.json({ error: error.message }, { status })
    }
    return NextResponse.json({ notice: data })
}

export async function DELETE(req: Request, context: Params) {
    const { id } = await context.params
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    const { data, error } = await auth.supabase
        .from('notices')
        .delete()
        .eq('id', id)
        .select('id')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data?.length) return NextResponse.json({ error: '공지사항을 찾을 수 없습니다.' }, { status: 404 })
    return NextResponse.json({ message: '공지사항이 삭제되었습니다.'}, { status: 200})
}
