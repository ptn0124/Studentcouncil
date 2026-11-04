import { requireAdmin, requireUser, isValidDate } from '@/lib/auth'
import { MINUTE_SELECT } from '@/lib/storage'
import { NextResponse } from 'next/server'

const MAX_TITLE = 80
const MAX_CONTENT = 20000

export async function GET() {
    const auth = await requireUser()
    if (!auth.ok) return auth.response

    const { data, error } = await auth.supabase
        .from('meeting_minutes')
        .select(MINUTE_SELECT)
        .order('meeting_date', { ascending: false })
        .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ minutes: data })
}

export async function POST(req: Request) {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    const { title, content, meeting_date } = await req.json().catch(() => ({}))
    if (typeof title !== 'string' || !title.trim() || !isValidDate(meeting_date)) {
        return NextResponse.json({ error: '제목과 회의 날짜(YYYY-MM-DD)를 입력해주세요.' }, { status: 400 })
    }
    // 첨부파일만 올리는 회의록도 가능하므로 내용은 선택
    const body = typeof content === 'string' ? content : ''
    if (title.trim().length > MAX_TITLE || body.length > MAX_CONTENT) {
        return NextResponse.json(
            { error: `제목은 ${MAX_TITLE}자, 내용은 ${MAX_CONTENT}자 이하로 입력해주세요.` },
            { status: 400 },
        )
    }

    const { data, error } = await auth.supabase
        .from('meeting_minutes')
        .insert([{
            title: title.trim(),
            content: body,
            meeting_date,
            author_id: auth.user.id
        }])
        .select(MINUTE_SELECT)
        .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ minute: data }, { status: 201 })
}
