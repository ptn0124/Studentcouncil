"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface HeaderProps {
  // 정의된 props가 있다면 여기에 작성합니다. (현재는 없음)
}

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "홈", href: "/" },
    { name: "공지사항", href: "/notices" },
    { name: "회의록", href: "/minutes" },
    { name: "건의함", href: "/suggestions" },
    { name: "학사일정", href: "/calendar" },
    { name: "동아리", href: "/clubs" },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#faf8f5]/80 border-b border-[#2c3e50]/10 shadow-sm transition-all duration-300">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="flex items-center space-x-2 group">
          <span className="text-[20px] font-bold text-[#2c3e50] tracking-tight group-hover:text-[#f39733] transition-colors duration-300">
            🏫 학생회 <span className="text-[#f39733]">홈페이지</span>
          </span>
        </Link>

        {/* 데스크톱 네비게이션 */}
        <nav className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-[16px] font-medium transition-colors duration-300 hover:text-[#f39733] relative py-1 ${
                isActive(item.href) ? "text-[#f39733] font-bold" : "text-[#2c3e50]"
              }`}
            >
              {item.name}
              {isActive(item.href) && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#f39733] rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        {/* 데스크톱 우측 버튼 (로그인/로그아웃 예시) */}
        <div className="hidden md:flex items-center space-x-4">
          <Link
            href="/login"
            className="text-[14px] font-semibold px-4 py-2 text-[#2c3e50] border border-[#2c3e50]/20 rounded-full hover:bg-[#2c3e50] hover:text-[#faf8f5] transition-all duration-300"
          >
            로그인
          </Link>
        </div>

        {/* 모바일 햄버거 메뉴 버튼 */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-[#2c3e50] hover:text-[#f39733] focus:outline-none"
          aria-label="메뉴 열기"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* 모바일 메뉴 모달/드로워 */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#2c3e50]/10 bg-[#faf8f5] px-4 py-4 space-y-3 shadow-inner animate-fadeIn">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block text-[16px] font-medium py-2 px-3 rounded-lg transition-all duration-300 ${
                isActive(item.href)
                  ? "bg-[#f39733]/10 text-[#f39733] font-bold"
                  : "text-[#2c3e50] hover:bg-[#2c3e50]/5"
              }`}
            >
              {item.name}
            </Link>
          ))}
          <div className="pt-2 border-t border-[#2c3e50]/10">
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-center text-[14px] font-semibold py-2.5 px-4 bg-[#2c3e50] text-[#faf8f5] rounded-lg hover:bg-[#f39733] transition-all duration-300"
            >
              로그인
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
