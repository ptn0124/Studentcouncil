import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface Params {
    params: Promise<{ id: string }>
}

// 조회수 증가 — 사용자당 공지 1회만 반영된다.
// 중복 방지는 DB 함수(record_notice_view)가 notice_views 테이블의 PK로 원자적으로 처리하므로
// 새로고침, 개발 모드의 이중 호출, 동시 요청에도 두 번 오르지 않는다.
export async function POST(req: Request, context: Params) {
    const { id } = await context.params
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('record_notice_view', { p_notice_id: id })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ view_count: data })
}
