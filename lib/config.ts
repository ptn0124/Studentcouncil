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

// Footer 연락처 (app_config의 contact_email / contact_phone). 설정되지 않은 항목은 null.
export async function getContactInfo(): Promise<{ email: string | null; phone: string | null }> {
    const supabase = await createClient();
    const { data } = await supabase
        .from("app_config")
        .select("key, value")
        .in("key", ["contact_email", "contact_phone"]);
    const find = (key: string) =>
        data?.find((row) => row.key === key)?.value?.trim() || null;
    return { email: find("contact_email"), phone: find("contact_phone") };
}
