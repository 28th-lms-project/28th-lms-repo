import useBreadcrumbs from "../../hooks/useBreadcrumbs";
import Breadcrumb from "./Breadcrumb";
import styles from "./PageContainer.module.css";

/**
 * 화면 틀: 브레드크럼 + 제목 + 본문.
 * 제목을 넘기지 않으면 브레드크럼의 마지막 항목(메뉴 화면은 DB 메뉴 이름)을 쓴다.
 */
export default function PageContainer({ title, children }) {
  const crumbs = useBreadcrumbs();
  const crumbTitle = crumbs.at(-1)?.title;

  return (
    <>
      <header className={styles.header}>
        <Breadcrumb crumbs={crumbs} />
        <h2 className={styles.title}>{title ?? crumbTitle}</h2>
      </header>
      <div>{children}</div>
    </>
  );
}
