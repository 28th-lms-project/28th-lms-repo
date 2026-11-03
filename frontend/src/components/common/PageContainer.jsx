import { useMatches } from "react-router-dom";
import Breadcrumb from "./Breadcrumb";
import styles from "./PageContainer.module.css";

export default function PageContainer({ title, children }) {
  const matches = useMatches();
  // 가장 안쪽(현재 페이지) 라우트부터 찾아서 crumb을 제목으로 사용
  const routeTitle = [...matches]
    .reverse()
    .find((m) => m.handle?.crumb)?.handle.crumb;

  return (
    <>
      <header className={styles.header}>
        <Breadcrumb />
        <h2 className={styles.title}>{title ?? routeTitle}</h2>
      </header>
      <div>{children}</div>
    </>
  );
}
