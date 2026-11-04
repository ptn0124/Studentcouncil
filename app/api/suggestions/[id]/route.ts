import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { SUGGESTION_COLUMNS, isSuggestionStatus } from "@/lib/suggestionStatus";

interface Params {
    params: Promise<{ id: string }>
}

// 상세 조회 (로그인한 사용자 누구나 — 읽기 전용)
export async function GET(req: Request, context: Params) {
    const { id } = await context.params
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { data, error } = await supabase
        .from('suggestions')
        .select(SUGGESTION_COLUMNS)
        .eq('id', id)
        .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json({ suggestion: data })

}

export async function PATCH(req: Request, context: Params) {
    const { id } = await context.params
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
    const { status, reply } = await req.json()
    if (status !== undefined && !isSuggestionStatus(status)) {
        return NextResponse.json({ error: '올바르지 않은 상태 값입니다.' }, { status: 400 })
    }
    const { data, error } = await supabase
        .from('suggestions')
        .update({
            ...(status && { status }),
            ...(reply !== undefined && { reply }),
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(SUGGESTION_COLUMNS)
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ suggestion: data })
}

export async function DELETE(req: Request, context: Params) {
    const { id } = await context.params
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

    const { error } = await supabase
        .from('suggestions')
        .delete()
        .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ message: '건의사항이 삭제되었습니다.' }, { status: 200 })
}
