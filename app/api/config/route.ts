import { NextResponse } from "next/server";
import { getCouncilTerm } from "@/lib/config";

// 공개 설정 조회 (누구나) — 학생회 기수 등
export async function GET() {
    const council_term = await getCouncilTerm();
    return NextResponse.json({ council_term });
}