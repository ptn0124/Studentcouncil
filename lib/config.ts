import { createClient } from "@/lib/supabase/server";

// app_config 테이블에서 학생회 기수(예: "32")를 읽어온다. 없으면 기본값 "32".
export async function getCouncilTerm(): Promise<string> {
    const supabase = await createClient();
    const { data } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", "council_term")
        .single();
    return data?.value ?? "32";
}