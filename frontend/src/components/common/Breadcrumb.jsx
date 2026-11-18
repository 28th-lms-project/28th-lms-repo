import { Link } from "react-router-dom";
import styles from "./Breadcrumb.module.css";

/**
 * 기록용: 샘플 "표준화 전 (기록)" 탭만 씀. 화면에서는 common/ui/PageHeader + useBreadcrumbs()를 쓴다 (가이드 8장).
 * 브레드크럼. 항목 계산은 useBreadcrumbs (메뉴 화면은 DB 메뉴 이름, 그 외는 라우트 crumb).
 * @param {{ crumbs: { key: string, title: string }[] }} props
 */
export default function Breadcrumb({ crumbs }) {
  return (
    <nav className={styles.breadcrumb}>
      <Link to="/">⌂</Link>
      {crumbs.map((crumb) => (
        <span key={crumb.key}> &gt; {crumb.title}</span>
      ))}
    </nav>
  );
}
