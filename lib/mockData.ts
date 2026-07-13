import { Notice, Officer } from "@/types";

export let mockNotices: Notice[] = [
  {
    id: 1,
    title: "[공지] 2026학년도 1학기 학생회비 납부 및 사용 내역 안내",
    content: `안녕하세요, 제32대 학생회입니다.

2026학년도 1학기 동안 투명하고 공정한 학생회 운영을 위해 학생회비 납부 현황 및 상세 집행 내역을 공개합니다.

■ 학생회비 총 납부 인원: 420명
■ 총 집행 금액: 1,850,000원
■ 주요 사용처:
1. 신입생 오리엔테이션 간식 및 다이어리 배부
2. 우산 및 보조배터리 대여 사업용 비품 구매
3. 정기 학생총회 회의 준비 및 다과

자세한 영수증 및 증빙 서류는 학생회실에 비치되어 있으니 언제든 열람하실 수 있습니다. 앞으로도 신뢰할 수 있는 학생회가 되도록 최선을 다하겠습니다.

감사합니다.`,
    isPinned: true,
    views: 342,
    author: "admin_president",
    category: "공지사항",
    createdAt: "2026-05-15T09:00:00Z",
  },
  {
    id: 2,
    title: "[안내] 우산 및 보조배터리 대여 사업 상시 운영 안내",
    content: `안녕하세요, 복지국입니다!

갑작스러운 비나 배터리 부족으로 곤란했던 경험이 있으신가요?
학생회에서 학생 여러분의 편리한 학교 생활을 위해 우산 및 보조배터리 대여 사업을 상시 운영합니다.

■ 대여 장소: 학생회실 (학생회관 2층 201호)
■ 운영 시간: 평일 오전 9시 ~ 오후 6시 (공휴일 제외)
■ 대여 방법:
1. 학생회실 방문 후 학생증 제시
2. 대여 대장 작성 및 물품 수령
■ 반납 기한: 대여일로부터 3일 이내 (연장 필요 시 학생회실 방문)

※ 원활한 사업 운영을 위해 반납 기한을 꼭 지켜주시기 바랍니다. 감사합니다!`,
    isPinned: false,
    views: 189,
    author: "welfare_head",
    category: "안내",
    createdAt: "2026-05-20T10:30:00Z",
  },
  {
    id: 3,
    title: "[공지] 5월 정기 학생총회 개최 공고",
    content: `학생회칙 제15조에 의거하여, 2026학년도 5월 정기 학생총회를 아래와 같이 개최합니다.

학생 여러분의 소중한 권리이자 의무인 학생총회에 참석하여 자리를 빛내주시기 바랍니다.

■ 일시: 2026년 5월 28일 (목) 오후 6시
■ 장소: 학생회관 대강당
■ 주요 안건:
1. 1학기 중간 활동 보고 및 감사 결과 공유
2. 대동제(축제) 기획안 및 예산 심의
3. 학생회칙 일부 개정안 의결
4. 기타 건의 및 질의응답

■ 참석 대상: 본교 재학생 전원 (의결권은 학생회비 납부자에 한함)

※ 원활한 의사 정족수 충족을 위해 참석이 어려우신 분들은 사전에 대리인 위임장을 작성하여 제출해 주시기 바랍니다.`,
    isPinned: false,
    views: 120,
    author: "admin_secretary",
    category: "공지사항",
    createdAt: "2026-05-22T14:00:00Z",
  },
  {
    id: 4,
    title: "[행사] 기말고사 응원 간식행사 안내 (선착순 200명)",
    content: `기말고사 공부에 지친 학생 여러분을 위해 학생회에서 따뜻한 응원을 담아 간식행사를 준비했습니다!

맛있는 간식 드시고 기말고사 대박 나세요!

■ 일시: 2026년 6월 10일 (수) 오후 1시 ~ 소진 시까지
■ 장소: 학생회관 앞 야외 부스
■ 메뉴: 수제 샌드위치 + 아메리카노 또는 아이스티
■ 대상: 재학생 선착순 200명 (학생증 모바일 또는 실물 확인 필수)

열심히 준비한 만큼 많은 관심과 참여 부탁드립니다. 모두 좋은 결과 있으시길 바랍니다!`,
    isPinned: false,
    views: 295,
    author: "event_head",
    category: "행사",
    createdAt: "2026-06-03T11:15:00Z",
  }
];

// Helper to simulate incrementing views
export function incrementNoticeViews(id: string) {
  const noticeId = Number(id);
  const notice = mockNotices.find(n => n.id === noticeId);
  if (notice) {
    notice.views += 1;
    return notice.views;
  }
  return 0;
}

export const mockOfficers: Officer[] = [
  {
    id: "officer-1",
    name: "박태환",
    position: "학생회장",
    department: "컴퓨터공학과",
    image_url: "", // 빈 값으로 이미지 없음을 표현하고 플레이스홀더를 띄움
    order_num: 1,
    created_at: "2026-03-02T09:00:00Z"
  },
  {
    id: "officer-2",
    name: "이지우",
    position: "부학생회장",
    department: "전자공학과",
    image_url: "",
    order_num: 2,
    created_at: "2026-03-02T09:00:00Z"
  },
  {
    id: "officer-3",
    name: "김동규",
    position: "사무국장",
    department: "경영학과",
    image_url: "",
    order_num: 3,
    created_at: "2026-03-02T09:00:00Z"
  },
  {
    id: "officer-4",
    name: "박건우",
    position: "복지국장",
    department: "기계공학과",
    image_url: "",
    order_num: 4,
    created_at: "2026-03-02T09:00:00Z"
  }
];
