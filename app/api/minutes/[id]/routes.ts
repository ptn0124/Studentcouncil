import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

interface Params {
    params: Promise<{ id: string }>
}

export async function GET(req: Request, context: Params) {
    const { id } = await context.params
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { data, error } = await supabase
        .from('minutes')
        .select('*')
        .eq('id', id)
        .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json({ minute: data })
}

export async function PATCH(req: Request, context: Params) {
    const { id } = await context.params
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

    const { title, content, meeting_date } = await req.json()
    const { data, error } = await supabase
        .from('meeting_minutes')
        .update({
            ...(title && { title }),
            ...(content && { content }),
            ...(meeting_date && { meeting_date }),
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ minute: data })
}  


export async function DELETE(req: Request, context: Params) {
    const { id } = await context.params
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

    const { error } = await supabase
        .from('minutes')
        .delete()
        .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: '회의록이 삭제되었습니다.' }, { status: 200 })

}