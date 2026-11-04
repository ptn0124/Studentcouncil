import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const BASE_COLUMNS = 'id, title, content, meeting_date, author_id, created_at, updated_at'
const WITH_ATTACHMENTS = `${BASE_COLUMNS}, minute_attachments(id, minute_id, file_name, file_path, file_size, mime_type, created_at)`

export async function GET() {
    const supabase = await createClient()

    const query = (columns: string) =>
        supabase
            .from('meeting_minutes')
            .select(columns)
            .order('meeting_date', { ascending: false })
            .order('created_at', { ascending: false })

    let result = await query(WITH_ATTACHMENTS)

    // 첨부파일 테이블 마이그레이션 전이라도 회의록 목록은 보이도록 폴백
    if (result.error && result.error.message.includes('minute_attachments')) {
        console.error('minute_attachments 조회 실패 (마이그레이션 적용 여부 확인):', result.error.message)
        result = await query(BASE_COLUMNS)
    }

    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 })
    return NextResponse.json({ minutes: result.data })
}

export async function POST(req: Request) {
    const supabase = await createClient()
    const { data: { session }} = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: '로그인이 필요합니다.'}, {status: 401})

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
    if (!['admin', 'superadmin'].includes(profile?.role)) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { title, content, meeting_date} = await req.json()
    // 내용은 비워 둘 수 있다 (첨부파일만 올리는 회의록 허용) — 폼도 제목만 필수
    if (!title || !meeting_date) {
        return NextResponse.json({ error: '제목과 회의 날짜를 입력해주세요.' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('meeting_minutes')
        .insert([{ 
            title, 
            content: content ?? '', 
            meeting_date,
            author_id: session.user.id
        }])
        .select()
        .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ minute: { ...data, minute_attachments: [] } }, { status: 201 })
}
