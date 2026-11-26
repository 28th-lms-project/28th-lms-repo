/**
 * 전화번호 하이픈 형식 (서버 PhoneNumberFormat 과 같은 규칙). 입력 중에도 쓸 수 있게 자릿수가 덜 찼으면 앞부분만 나눈다.
 * 02-123-4567 · 02-1234-5678 · 031-123-4567 · 010-1234-5678 · 1588-1234
 */
export function formatPhoneNumber(value) {
  const d = String(value ?? "")
    .replace(/[^0-9]/g, "")
    .slice(0, 11);
  const n = d.length;

  if (d.startsWith("02")) {
    if (n <= 2) return d;
    if (n <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`;
    if (n <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
  }
  // 대표번호 (15xx ~ 19xx) 8자리
  if (/^1[5-9]/.test(d)) {
    if (n <= 4) return d;
    return `${d.slice(0, 4)}-${d.slice(4, 8)}`;
  }
  if (n <= 3) return d;
  if (n <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (n <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

/** 저장할 수 있는 번호인지 (서버 PhoneNumberFormat.isValid 와 같은 기준) */
export function isValidPhoneNumber(value) {
  const d = String(value ?? "").replace(/[^0-9]/g, "");
  const n = d.length;
  if (d.startsWith("02")) return n === 9 || n === 10;
  if (/^1[5-9]/.test(d)) return n === 8;
  return d.startsWith("0") && (n === 10 || n === 11);
}
