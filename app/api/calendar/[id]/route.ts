import { requireAdmin, isValidDate } from "@/lib/auth"
import { NextResponse } from "next/server"

interface Params {
    params: Promise<{ id: string }>
}

// 학사 일정 수정 (admin+) — 같은 날짜에 일정이 여러 개여도 id로 정확히 해당 일정만 수정한다
export async function PATCH(req: Request, context: Params) {
    const { id } = await context.params
    if (id.startsWith('neis-')) {
        return NextResponse.json({ error: 'NEIS 공식 일정은 수정할 수 없습니다.' }, { status: 400 })
    }
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    const { title, start_date, end_date, description } = await req.json().catch(() => ({}))

    if (title !== undefined && (typeof title !== 'string' || !title.trim() || title.trim().length > 100)) {
        return NextResponse.json({ error: '제목은 1~100자로 입력해주세요.' }, { status: 400 })
    }
    if (typeof description === 'string' && description.length > 1000) {
        return NextResponse.json({ error: '설명은 1000자 이하로 입력해주세요.' }, { status: 400 })
    }
    if ((start_date !== undefined && !isValidDate(start_date)) || (end_date !== undefined && !isValidDate(end_date))) {
        return NextResponse.json({ error: '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)' }, { status: 400 })
    }

    // 기존 값과 합쳐서 시작일/종료일 순서를 검증
    const { data: current } = await auth.supabase
        .from('calendar_events')
        .select('start_date, end_date')
        .eq('id', id)
        .maybeSingle()
    if (!current) return NextResponse.json({ error: '일정을 찾을 수 없습니다.' }, { status: 404 })

    if ((end_date ?? current.end_date) < (start_date ?? current.start_date)) {
        return NextResponse.json({ error: '종료일은 시작일보다 빠를 수 없습니다.' }, { status: 400 })
    }

    const { data, error } = await auth.supabase
        .from('calendar_events')
        .update({
            ...(title !== undefined && { title: title.trim() }),
            ...(start_date !== undefined && { start_date }),
            ...(end_date !== undefined && { end_date }),
            ...(description !== undefined && { description }),
        })
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ event: data })
}

// 학사 일정 삭제 (admin+)
export async function DELETE(req: Request, context: Params) {
    const { id } = await context.params
    if (id.startsWith('neis-')) {
        return NextResponse.json({ error: 'NEIS 공식 일정은 삭제할 수 없습니다.' }, { status: 400 })
    }
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    const { data, error } = await auth.supabase
        .from('calendar_events')
        .delete()
        .eq('id', id)
        .select('id')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data?.length) return NextResponse.json({ error: '일정을 찾을 수 없습니다.' }, { status: 404 })

    return NextResponse.json({ message: '학사 일정이 삭제되었습니다.' }, { status: 200 })
}
