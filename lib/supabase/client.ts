// 컴포넌트나 클라이언트 코드에서 Supabase 쓸때 불러와서 사용

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
    return createBrowserClient( // 브라우저에서 Supabase 접속할때
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

