import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('notices')
    .select('*')
    .select('id, title, content, created_at')
    .order('is_pinned', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ notices: data })

}

export async function Post(req: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()
  if (!['admin', 'superadmin'].includes(profile?.role)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const { title, content, is_pinned } = await req.json()
  if (!title || !content) {
    return NextResponse.json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 })
  }

  const { data, error } = await supabase.from('notices')
    .insert([{
      title,
      content,
      is_pinned: is_pinned ?? false,
      author_id: session.user.id
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notice: data }, { status: 201 })
}
