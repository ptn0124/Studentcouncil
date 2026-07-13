"use client";

import { mockOfficers } from "@/lib/mockData";

export interface MainPageProps {
  // 정의된 props가 있다면 여기에 작성합니다. (현재는 없음)
}

export default function Page() {
  const handleScrollToOfficers = () => {
    document.getElementById("officers-section")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section (블러 배경 + 큰 텍스트) */}
      <section className="relative w-full h-[calc(100vh-96px)] min-h-[500px] flex items-center justify-center overflow-hidden">
        {/* 블러 처리된 배경 이미지 영역 */}
        <div className="absolute inset-0 z-0">
          {/* 블러 레이어 (배경 이미지는 /hero-bg.jpg 등을 직접 넣을 수 있도록 인라인 스타일 구성) */}
          <div
            className="w-full h-full bg-cover bg-center filter blur-xl scale-105 opacity-30 transition-all duration-700"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1920')", // Unsplash의 고화질 캠퍼스 이미지 기본 배치
            }}
          />
          {/* 색상 보정용 오버레이 그라데이션 */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#faf8f5]/20 via-[#faf8f5]/60 to-[#faf8f5]" />
        </div>

        {/* 웰컴 대형 슬로건 텍스트 */}
        <div className="relative z-10 text-center max-w-[900px] px-4 space-y-6 animate-fadeIn">
          {/* 메인 슬로건: 사용자 요청에 따라 30px보다 훨씬 큼지막하게 배치 */}
          <h1 className="text-[36px] sm:text-[52px] md:text-[68px] font-black text-[#2c3e50] leading-tight tracking-tight">
            소통으로 하나 되는 우리, <br />
            <span className="bg-gradient-to-r from-[#f39733] to-[#d37d1d] bg-clip-text text-transparent">
              더 나은 학교
            </span>
            를 만들어갑니다.
          </h1>

          {/* 보조 본문 body: 16px */}
          <p className="text-[16px] text-[#2c3e50]/70 max-w-[600px] mx-auto leading-relaxed">
            제32대 학생회 공식 홈페이지에 오신 것을 환영합니다. <br />
            우리는 학생 여러분의 소중한 목소리에 귀 기울입니다.
          </p>
        </div>

        {/* 반복 애니메이션 화살표 (Scroll Indicator) */}
        <button
          onClick={handleScrollToOfficers}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer z-10 animate-bounce group focus:outline-none"
          aria-label="임원진 소개 보기"
        >
          {/* 부연설명 caption: 14px */}
          <span className="text-[14px] text-[#2c3e50]/50 font-bold tracking-wider group-hover:text-[#f39733] transition-colors duration-300">
            임원진 소개 보기
          </span>
          <svg
            className="w-6 h-6 text-[#f39733] group-hover:scale-110 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>
      </section>

      {/* 임원진 소개 섹션 */}
      <section
        id="officers-section"
        className="w-full max-w-[1200px] px-4 py-20 space-y-12 border-t border-[#2c3e50]/5 scroll-mt-16"
      >
        <div className="text-center space-y-2">
          {/* H2: 20px */}
          <h2 className="text-[20px] font-extrabold text-[#2c3e50] tracking-tight">
            제32대 학생회 임원진 소개
          </h2>
          {/* caption: 14px */}
          <p className="text-[14px] text-[#2c3e50]/60">
            학생들의 편의와 발전을 위해 헌신하는 임원진들을 소개합니다.
          </p>
        </div>

        {/* 임원진 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {mockOfficers.map((officer) => (
            <div
              key={officer.id}
              className="group bg-white/70 backdrop-blur-md border border-[#2c3e50]/10 rounded-2xl p-6 text-center transition-all duration-300 hover:shadow-xl hover:shadow-[#f39733]/5 hover:border-[#f39733]/30 hover:-translate-y-1"
            >
              {/* 프로필 이미지 혹은 이니셜 플레이스홀더 */}
              <div className="w-24 h-24 mx-auto mb-5 rounded-full overflow-hidden border-2 border-[#2c3e50]/10 group-hover:border-[#f39733]/40 transition-colors duration-300 bg-gradient-to-br from-[#f39733]/15 to-[#2c3e50]/10 flex items-center justify-center text-[28px] font-bold text-[#2c3e50]/80">
                {officer.image_url ? (
                  <img
                    src={officer.image_url}
                    alt={officer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  officer.name[0] // 성씨 첫 글자를 플레이스홀더 글자로 사용 (예: "박")
                )}
              </div>

              {/* 직책 */}
              <span className="inline-block text-[14px] font-bold text-[#f39733] bg-[#f39733]/10 px-3 py-1 rounded-full mb-2">
                {officer.position}
              </span>

              {/* 이름 */}
              <h3 className="text-[18px] font-bold text-[#2c3e50] mb-1">
                {officer.name}
              </h3>

              {/* 학과 (캡션) caption: 14px */}
              <p className="text-[14px] text-[#2c3e50]/50">
                {officer.department || "학과 정보 없음"}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
