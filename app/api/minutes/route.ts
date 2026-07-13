import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('minutes')
        .select('id, title, content, created_at')
        .order('created_at', { ascending: false })
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ minutes: data })
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
    if (!title || !content || !meeting_date) {
        return NextResponse.json({ error: '제목, 내용, 회의 날짜를 입력해주세요.' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('minutes')
        .insert([{ 
            title, 
            content, 
            meeting_date,
            author_id: session.user.id
        }])
        .select()
        .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ minute: data }, { status: 201 })
}