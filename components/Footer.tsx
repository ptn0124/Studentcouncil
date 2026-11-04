import Link from "next/link";
import { getContactInfo, getCouncilTerm } from "@/lib/config";

export type FooterProps = Record<string, never>;

const QUICK_LINKS = [
  { name: "공지사항", href: "/notices" },
  { name: "회의록 공개", href: "/minutes" },
  { name: "학생 건의함", href: "/suggestions" },
  { name: "학사일정", href: "/calendar" },
];

export default async function Footer() {
  const [councilTerm, contact] = await Promise.all([getCouncilTerm(), getContactInfo()]);
  const hasContact = Boolean(contact.email || contact.phone);

  return (
    <footer className="w-full bg-[#2c3e50] text-[#faf8f5] mt-auto">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-10 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr] gap-8 md:gap-12">
          {/* 학생회 정보 */}
          <div className="space-y-3 sm:col-span-2 md:col-span-1">
            <p className="text-[20px] font-bold tracking-tight">
              제{councilTerm}대 학생회
            </p>
            <p className="text-[14px] text-[#faf8f5]/70 leading-relaxed max-w-[360px] break-keep">
              학생 여러분의 목소리에 항상 귀 기울이며, 더 나은 학교 생활을 위해 행동하는 학생회가 되겠습니다.
            </p>
          </div>

          {/* 바로가기 */}
          <nav aria-label="바로가기" className="space-y-3">
            <h3 className="text-[16px] font-semibold text-[#f39733]">바로가기</h3>
            <ul className="grid grid-cols-2 sm:grid-cols-1 gap-x-4 gap-y-2 text-[14px] text-[#faf8f5]/70">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-[#f39733] transition-colors duration-200">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* 연락처 — app_config(contact_email, contact_phone)에 값이 있을 때만 표시 */}
          <div className="space-y-3">
            <h3 className="text-[16px] font-semibold text-[#f39733]">문의</h3>
            <ul className="space-y-2 text-[14px] text-[#faf8f5]/70">
              {contact.email && (
                <li className="flex items-center gap-2 min-w-0">
                  <svg className="w-4 h-4 shrink-0 text-[#faf8f5]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href={`mailto:${contact.email}`} className="hover:text-[#f39733] transition-colors duration-200 break-all">
                    {contact.email}
                  </a>
                </li>
              )}
              {contact.phone && (
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0 text-[#faf8f5]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href={`tel:${contact.phone}`} className="hover:text-[#f39733] transition-colors duration-200">
                    {contact.phone}
                  </a>
                </li>
              )}
              {!hasContact && (
                <li>
                  <Link href="/suggestions" className="hover:text-[#f39733] transition-colors duration-200">
                    학생 건의함으로 문의해 주세요
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* 하단 구분선 & 저작권 */}
        <div className="mt-10 pt-6 border-t border-[#faf8f5]/10 text-center md:text-left">
          <p className="text-[13px] text-[#faf8f5]/50">
            © {new Date().getFullYear()} 제{councilTerm}대 학생회. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
