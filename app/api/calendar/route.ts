import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

interface CalendarEvent {
    id: string
    title: string
    start_date: string   // YYYY-MM-DD
    end_date: string     // YYYY-MM-DD
    description: string | null
    source: 'custom' | 'neis'
}

// NEIS 학사일정 조회 (공식 일정, 읽기 전용). 미설정/실패 시 빈 배열로 graceful degrade.
async function fetchNeisEvents(): Promise<CalendarEvent[]> {
    const KEY = process.env.NEIS_API_KEY
    const ATPT = process.env.NEIS_ATPT_CODE
    const SCHOOL = process.env.NEIS_SCHOOL_CODE
    if (!KEY || !ATPT || !SCHOOL) return []

    // 조회 범위: 올해 1/1 ~ 12/31 (추후 쿼리 파라미터로 확장 가능)
    const year = new Date().getFullYear()
    const url = new URL('https://open.neis.go.kr/hub/SchoolSchedule')
    url.searchParams.set('KEY', KEY)
    url.searchParams.set('Type', 'json')
    url.searchParams.set('pSize', '1000')
    url.searchParams.set('ATPT_OFCDC_SC_CODE', ATPT)
    url.searchParams.set('SD_SCHUL_CODE', SCHOOL)
    url.searchParams.set('AA_FROM_YMD', `${year}0101`)
    url.searchParams.set('AA_TO_YMD', `${year}1231`)

    // 학사일정은 자주 안 바뀌므로 1시간 캐시
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []

    const json = await res.json()
    const rows = json?.SchoolSchedule?.[1]?.row
    if (!Array.isArray(rows)) return []   // 데이터 없음(INFO-200) 등

    return rows
        .filter((r: { EVENT_NM?: string }) => r.EVENT_NM && r.EVENT_NM.trim())
        .map((r: { AA_YMD: string; EVENT_NM: string; EVENT_CN?: string }, i: number) => {
            const ymd = String(r.AA_YMD)   // YYYYMMDD
            const date = `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`
            return {
                id: `neis-${ymd}-${i}`,
                title: r.EVENT_NM,
                start_date: date,
                end_date: date,
                description: r.EVENT_CN ?? null,
                source: 'neis' as const,
            }
        })
}

// 학사 일정 목록 조회 (누구나) — Supabase 관리자 일정 + NEIS 공식 일정 통합
export async function GET() {
    const supabase = await createClient()

    const [customResult, neisEvents] = await Promise.all([
        supabase
            .from('calendar_events')
            .select('id, title, start_date, end_date, description')
            .order('start_date', { ascending: true }),
        fetchNeisEvents().catch((err) => {
            console.error('NEIS fetch error:', err)
            return [] as CalendarEvent[]
        }),
    ])

    if (customResult.error) {
        console.error('calendar select error:', customResult.error.message)
    }

    const customEvents: CalendarEvent[] = (customResult.data ?? []).map((e) => ({
        id: String(e.id),
        title: e.title,
        start_date: e.start_date,
        end_date: e.end_date,
        description: e.description ?? null,
        source: 'custom' as const,
    }))

    const events = [...customEvents, ...neisEvents].sort((a, b) =>
        a.start_date.localeCompare(b.start_date)
    )

    return NextResponse.json({ events })
}

// 학사 일정 생성 (admin+) — Supabase 커스텀 일정만 생성 가능
export async function POST(req: Request) {
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
    if (!title || !start_date || !end_date) {
        return NextResponse.json({ error: '제목, 시작일, 종료일을 입력해주세요.' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('calendar_events')
        .insert([{
            title,
            start_date,
            end_date,
            description: description ?? null,
            author_id: session.user.id
        }])
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ event: data }, { status: 201 })
}
