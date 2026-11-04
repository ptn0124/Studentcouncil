import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface Params {
    params: Promise<{ id: string }>
}

// 브라우저 세션 동안 이미 조회한 공지 id 목록을 담는 쿠키 (만료 시간 없음 = 브라우저 종료 시 삭제)
const VIEWED_COOKIE = 'viewed_notices'
const MAX_TRACKED = 200

// 조회수 증가 (세션당 공지 1회)
// - 이전에는 GET /api/notices/[id] 가 조회할 때마다 조회수를 올렸기 때문에,
//   개발 모드(StrictMode)의 effect 이중 실행·새로고침·재방문마다 조회수가 중복으로 올라갔다.
// - 조회수 증가는 이 POST 엔드포인트로 분리하고, 쿠키로 같은 브라우저 세션의 중복 증가를 막는다.
export async function POST(req: NextRequest, context: Params) {
    const { id } = await context.params
    const supabase = await createClient()

    const viewed = (req.cookies.get(VIEWED_COOKIE)?.value ?? '')
        .split('.')
        .filter(Boolean)

    let counted = false
    if (!viewed.includes(id)) {
        const { error } = await supabase.rpc('increment_view_count', { notice_id: id })
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        counted = true
        viewed.push(id)
    }

    const { data } = await supabase
        .from('notices')
        .select('view_count')
        .eq('id', id)
        .single()

    const res = NextResponse.json({ counted, view_count: data?.view_count ?? null })
    if (counted) {
        res.cookies.set(VIEWED_COOKIE, viewed.slice(-MAX_TRACKED).join('.'), {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
        })
    }
    return res
}
