import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// 임원진 목록 조회 (누구나) — order_num 오름차순
export async function GET() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('officers')
        .select('*')
        .order('order_num', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ officers: data })
}