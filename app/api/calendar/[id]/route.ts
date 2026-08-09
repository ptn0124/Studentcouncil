import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

interface Params {
    params: Promise<{ id: string }>
}

// 학사 일정 수정 (admin+)
export async function PATCH(req: Request, context: Params) {
    const { id } = await context.params
    if (id.startsWith('neis-')) {
        return NextResponse.json({ error: 'NEIS 공식 일정은 수정할 수 없습니다.' }, { status: 400 })
    }
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

    const { title, start_date, end_date, description } = await req.json()

    const { data, error } = await supabase
        .from('calendar')
        .update({
            ...(title && { title }),
            ...(start_date && { start_date }),
            ...(end_date && { end_date }),
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
        .from('calendar')
        .delete()
        .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ message: '학사 일정이 삭제되었습니다.' }, { status: 200 })
}
