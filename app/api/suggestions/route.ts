import { requireUser, studentIdFromEmail, ADMIN_ROLES } from '@/lib/auth'
import { NextResponse } from 'next/server'

const MAX_CONTENT = 2000
const RATE_LIMIT = 5            // 시간당 최대 건의 수
const RATE_WINDOW_MS = 60 * 60 * 1000

const COLUMNS = 'id, content, status, reply, student_id, author_id, created_at, updated_at, replied_at'

// 목록 조회 (로그인 필요)
// - admin+ : 전체 건의 (?mine=true 를 주면 본인 건의만)
// - 일반 사용자 : 본인이 작성한 건의만
export async function GET(req: Request) {
    const auth = await requireUser()
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(req.url)
    const onlyMine = searchParams.get('mine') === 'true' || !ADMIN_ROLES.includes(auth.role)

    let query = auth.supabase
        .from('suggestions')
        .select(COLUMNS)
        .order('created_at', { ascending: false })

    if (onlyMine) query = query.eq('author_id', auth.user.id)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ suggestions: data })
}

// 생성 (로그인 필요) — 익명 제출은 지원하지 않는다. 학번은 서버가 이메일에서 추출해 저장한다.
export async function POST(req: Request) {
    const auth = await requireUser()
    if (!auth.ok) return auth.response

    const { content } = await req.json().catch(() => ({}))
    if (typeof content !== 'string' || !content.trim()) {
        return NextResponse.json({ error: '내용은 필수입니다.' }, { status: 400 })
    }
    if (content.length > MAX_CONTENT) {
        return NextResponse.json({ error: `내용은 ${MAX_CONTENT}자 이하로 입력해주세요.` }, { status: 400 })
    }

    // 간단한 도배 방지: 최근 1시간 내 작성 수 제한
    const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
    const { count } = await auth.supabase
        .from('suggestions')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', auth.user.id)
        .gte('created_at', since)
    if ((count ?? 0) >= RATE_LIMIT) {
        return NextResponse.json(
            { error: `건의는 1시간에 ${RATE_LIMIT}건까지 등록할 수 있습니다. 잠시 후 다시 시도해주세요.` },
            { status: 429 },
        )
    }

    const { data, error } = await auth.supabase
        .from('suggestions')
        .insert({
            content: content.trim(),
            author_id: auth.user.id,
            student_id: studentIdFromEmail(auth.user.email),
        })
        .select(COLUMNS)
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ suggestion: data }, { status: 201 })
}
