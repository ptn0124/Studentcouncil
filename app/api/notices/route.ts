import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'

const MAX_TITLE = 100
const MAX_CONTENT = 10000

// 목록 조회 — 본문(content)은 내려주지 않는다 (검색은 서버에서 content까지 대상으로 함)
export async function GET(req: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim().replace(/[,()%\\]/g, ' ')

  let query = supabase.from('notices')
    .select('id, title, is_pinned, view_count, author_id, created_at, updated_at')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ notices: data })
}

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { title, content, is_pinned } = await req.json().catch(() => ({}))
  if (typeof title !== 'string' || typeof content !== 'string' || !title.trim() || !content.trim()) {
    return NextResponse.json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 })
  }
  if (title.length > MAX_TITLE || content.length > MAX_CONTENT) {
    return NextResponse.json(
      { error: `제목은 ${MAX_TITLE}자, 내용은 ${MAX_CONTENT}자 이하로 입력해주세요.` },
      { status: 400 },
    )
  }

  const { data, error } = await auth.supabase.from('notices')
    .insert([{
      title: title.trim(),
      content,
      is_pinned: is_pinned === true,
      author_id: auth.user.id
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notice: data }, { status: 201 })
}
