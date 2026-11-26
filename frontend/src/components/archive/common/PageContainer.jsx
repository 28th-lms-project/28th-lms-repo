/* 기록용 (archive): 표준화 전 모습을 남긴 코드. 새 코드에서 import 금지(lint로 막음) · 고치지 않음. 대체: common/ui/PageHeader + useBreadcrumbs(). 안내: components/archive/README.md */
import useBreadcrumbs from "../../../hooks/useBreadcrumbs";
import PageHeader from "../../common/ui/PageHeader";

/**
 * 화면 틀: 표준 화면 머리(PageHeader: 브레드크럼 + 제목) + 본문.
 * 제목을 넘기지 않으면 브레드크럼의 마지막 항목(메뉴 화면은 DB 메뉴 이름)을 쓴다.
 *
 * 아직 PageHeader로 옮기지 않은 화면을 위한 호환용이다 (2026-11-17부터 안쪽 머리가 표준 PageHeader).
 * 새 화면 · 옮기는 화면은 PageHeader를 직접 쓴다: <PageHeader crumbs={useBreadcrumbs()} title=... description=... actions=... />
 * (ui-style-guide.md 6장 "기존 컴포넌트 → 표준 대응" › 틀 · 표)
 */
export default function PageContainer({ title, children }) {
  const crumbs = useBreadcrumbs();

  return (
    <>
      <PageHeader crumbs={crumbs} title={title ?? crumbs.at(-1)?.title} />
      <div>{children}</div>
    </>
  );
}
