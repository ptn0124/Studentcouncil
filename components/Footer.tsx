import Link from "next/link";

export interface FooterProps {
  // 정의된 props가 있다면 여기에 작성합니다. (현재는 없음)
}

export default function Footer() {
  return (
    <footer className="w-full bg-[#2c3e50] text-[#faf8f5] py-12 border-t border-[#2c3e50]/20 mt-auto">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 학생회 정보 */}
          <div className="space-y-4">
            <span className="text-[20px] font-bold tracking-tight">
              🏫 제32대 학생회
            </span>
            <p className="text-[14px] text-[#faf8f5]/70 leading-relaxed">
              학생 여러분의 목소리에 항상 귀 기울이며, <br />
              더 나은 학교 생활을 위해 행동하는 학생회가 되겠습니다.
            </p>
          </div>

          {/* 유용한 링크 */}
          <div className="space-y-4">
            <h3 className="text-[16px] font-semibold text-[#f39733]">바로가기</h3>
            <ul className="space-y-2 text-[14px] text-[#faf8f5]/70">
              <li>
                <Link href="/notices" className="hover:text-[#f39733] transition-colors duration-200">
                  공지사항
                </Link>
              </li>
              <li>
                <Link href="/minutes" className="hover:text-[#f39733] transition-colors duration-200">
                  회의록 공개
                </Link>
              </li>
              <li>
                <Link href="/suggestions" className="hover:text-[#f39733] transition-colors duration-200">
                  학생 건의함
                </Link>
              </li>
            </ul>
          </div>

          {/* 고객 지원 / 연락처 */}
          <div className="space-y-4">
            <h3 className="text-[16px] font-semibold text-[#f39733]">연락처</h3>
            <ul className="space-y-2 text-[14px] text-[#faf8f5]/70">
              <li>📍 위치: 학생회관 2층 201호</li>
              <li>✉️ 이메일: support@studentcouncil.org</li>
              <li>⏰ 운영: 평일 09:00 - 18:00</li>
            </ul>
          </div>
        </div>

        {/* 하단 구분선 & 저작권 */}
        <div className="mt-12 pt-8 border-t border-[#faf8f5]/10 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-[14px] text-[#faf8f5]/50">
            © {new Date().getFullYear()} Student Council. All Rights Reserved.
          </p>
          <div className="flex space-x-6 text-[14px] text-[#faf8f5]/50">
            <a href="#" className="hover:text-[#f39733] transition-colors duration-200">
              개인정보처리방침
            </a>
            <a href="#" className="hover:text-[#f39733] transition-colors duration-200">
              이용약관
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
