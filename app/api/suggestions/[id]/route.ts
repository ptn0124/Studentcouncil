import { requireAdmin, requireUser, ADMIN_ROLES } from "@/lib/auth";
import { NextResponse } from "next/server";

const STATUSES = ["pending", "in_progress", "resolved", "rejected"] as const;
const MAX_REPLY = 2000;
const COLUMNS =
    "id, content, status, reply, student_id, author_id, created_at, updated_at, replied_at";

interface Params {
    params: Promise<{ id: string }>
}

// 단건 조회 — admin+ 또는 작성자 본인
export async function GET(req: Request, context: Params) {
    const { id } = await context.params
    const auth = await requireUser()
    if (!auth.ok) return auth.response

    const { data, error } = await auth.supabase
        .from('suggestions')
        .select(COLUMNS)
        .eq('id', id)
        .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })

    if (!ADMIN_ROLES.includes(auth.role) && data.author_id !== auth.user.id) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }
    return NextResponse.json({ suggestion: data })
}

// 상태 변경 / 답변 작성 (admin+)
export async function PATCH(req: Request, context: Params) {
    const { id } = await context.params
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    const { status, reply } = await req.json().catch(() => ({}))

    if (status !== undefined && !STATUSES.includes(status)) {
        return NextResponse.json(
            { error: `status는 ${STATUSES.join(', ')} 중 하나여야 합니다.` },
            { status: 400 },
        )
    }
    if (reply !== undefined && reply !== null && (typeof reply !== 'string' || reply.length > MAX_REPLY)) {
        return NextResponse.json({ error: `답변은 ${MAX_REPLY}자 이하로 입력해주세요.` }, { status: 400 })
    }
    if (status === undefined && reply === undefined) {
        return NextResponse.json({ error: '변경할 내용이 없습니다.' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const trimmedReply = typeof reply === 'string' ? reply.trim() : reply
    const { data, error } = await auth.supabase
        .from('suggestions')
        .update({
            ...(status !== undefined && { status }),
            ...(reply !== undefined && {
                reply: trimmedReply || null,
                // 답변을 새로 달거나 수정하면 답변 시각/작성자를 기록하고, 비우면 초기화
                replied_at: trimmedReply ? now : null,
                replied_by: trimmedReply ? auth.user.id : null,
            }),
            updated_at: now
        })
        .eq('id', id)
        .select(COLUMNS)
        .single()

    if (error) {
        const code = error.code === 'PGRST116' ? 404 : 500
        return NextResponse.json({ error: error.message }, { status: code })
    }

    return NextResponse.json({ suggestion: data })
}

export async function DELETE(req: Request, context: Params) {
    const { id } = await context.params
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    const { data, error } = await auth.supabase
        .from('suggestions')
        .delete()
        .eq('id', id)
        .select('id')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data?.length) return NextResponse.json({ error: '건의사항을 찾을 수 없습니다.' }, { status: 404 })

    return NextResponse.json({ message: '건의사항이 삭제되었습니다.' }, { status: 200 })
}
