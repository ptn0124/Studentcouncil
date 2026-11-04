import { createClient } from '@/lib/supabase/server'
import { getVerifiedSession } from '@/lib/server/auth'
import { NextResponse } from 'next/server'
import { cleanAuthorName } from '@/lib/studentId'

// author_* 컬럼이 아직 없을 때(마이그레이션 미적용) 나는 오류인지 판별
// PGRST204: 스키마 캐시에 없는 컬럼, 42703: undefined_column
function isMissingAuthorColumn(error: { code?: string; message?: string } | null) {
    if (!error) return false
    return (
        error.code === 'PGRST204' ||
        error.code === '42703' ||
        /author_(id|name|email)/.test(error.message ?? '')
    )
}

// 목록 조회 (로그인한 사용자 누구나 — 읽기 전용, 상태 변경은 [id] PATCH에서 관리자만)
export async function GET() {
    const supabase = await createClient()

    const { data: { session } } = await getVerifiedSession(supabase)
    if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    // select('*'): author_* 컬럼이 아직 없는 DB(마이그레이션 전)에서도 오류 없이 조회되도록
    // 컬럼을 직접 나열하지 않는다. (없으면 화면에 '작성자 정보 없음'으로 표시)
    const result = await supabase
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false })

    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 })

    return NextResponse.json({ suggestions: result.data })
}

// 생성 (로그인 사용자) — 작성자 정보를 함께 저장 (익명 작성 불가)
export async function POST(req: Request) {
    const supabase = await createClient()

    const { data: { session } } = await getVerifiedSession(supabase)
    if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { content } = await req.json()

    if (!content || !String(content).trim()) {
        return NextResponse.json({ error: '내용은 필수입니다.' }, { status: 400 })
    }

    const meta = session.user.user_metadata ?? {}
    const author = {
        author_id: session.user.id,
        // 학교 계정 표시 이름에 붙은 이메일 아이디(예: 박태환bi202621208)는 떼고 저장
        author_name: cleanAuthorName(meta.full_name ?? meta.name ?? null, session.user.email),
        author_email: session.user.email ?? null,
    }

    // insert 결과를 다시 select 하지 않는다(.select() 생략):
    // RLS에서 작성자에게 SELECT 권한이 없으면 "insert 후 반환"이 실패해 등록 자체가 실패로 처리되기 때문
    let { error } = await supabase.from('suggestions').insert({ content, ...author })

    if (isMissingAuthorColumn(error)) {
        // 마이그레이션 전이라도 건의 등록은 되도록 (작성자 정보 없이 저장)
        console.error('suggestions author_* 컬럼 없음 — 20261104_02_suggestions_author.sql 적용 필요:', error?.message)
        ;({ error } = await supabase.from('suggestions').insert({ content, is_anonymous: false }))
    }

    if (error) {
        console.error('suggestion insert error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 201 })
}
