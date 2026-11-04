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
