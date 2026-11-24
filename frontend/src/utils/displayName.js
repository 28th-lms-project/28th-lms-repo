/**
 * 동명이인 구분 문자를 붙인 화면 표시용 이름 ("홍길동 A").
 * 구분 문자(nameSuffix)는 서버가 등록 순서대로 계산해 내려준다 (Commons.nameSuffix). 회원 데이터의 이름은 바꾸지 않으므로
 * 수정 폼 · 검색 등 실제 이름이 필요한 곳에는 쓰지 않는다.
 */
export function displayName(name, nameSuffix) {
  if (!nameSuffix) {
    return name ?? "";
  }
  return `${name ?? ""} ${nameSuffix}`;
}
