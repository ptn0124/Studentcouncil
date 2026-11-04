// 학교 이메일에서 학번 추출
//
// 학생 이메일 형식: {영문 접두어}{입학연도 4자리}{학번 5자리}@g.cnees.kr
//   예) bi202621208@g.cnees.kr → "21208"
//       bi202610511@g.cnees.kr → "10511"
// 형식이 다른 이메일(교사·외부/관리자 계정 등)은 null을 돌려준다.

const STUDENT_EMAIL_PATTERN = /^[a-z]+(\d{4})(\d{5})@/i;

export function parseStudentId(email: string | null | undefined): string | null {
  if (!email) return null;
  const match = email.trim().match(STUDENT_EMAIL_PATTERN);
  return match ? match[2] : null;
}

/**
 * 표시용 작성자 이름 정리
 * 학교 구글 계정은 표시 이름에 이메일 아이디가 붙어 있는 경우가 있다.
 *   예) "박태환bi202621208" → "박태환"
 * - 이메일 아이디(@ 앞부분)가 이름 안에 있으면 제거
 * - 그래도 끝에 "영문+숫자 4자리 이상" 꼬리가 남아 있으면 제거
 * 정리 결과가 비면 원래 이름을 그대로 쓴다.
 */
export function cleanAuthorName(
  name: string | null | undefined,
  email: string | null | undefined,
): string | null {
  if (!name) return null;
  let cleaned = name;
  const localPart = email?.split("@")[0];
  if (localPart) {
    cleaned = cleaned.replace(new RegExp(localPart.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig"), "");
  }
  cleaned = cleaned.replace(/[\s_.-]*[a-z]*\d{4,}\s*$/i, "").trim();
  return cleaned || name.trim();
}
