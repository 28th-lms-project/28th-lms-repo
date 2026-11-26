/* 기록용 (archive): 표준화 전 모습을 남긴 코드. 새 코드에서 import 금지(lint로 막음) · 고치지 않음. 대체: common/ui/PageHeader + useBreadcrumbs(). 안내: components/archive/README.md */
import { Link } from "react-router-dom";
import styles from "./Breadcrumb.module.css";

/**
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
