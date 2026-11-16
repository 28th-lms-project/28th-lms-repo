import { useNavigate } from "react-router-dom";
import PageContainer from "../PageContainer";
import { IconButton } from "../input/IconButton";
import { icons } from "../input/icons";
import styles from "./RouteError.module.css";

/**
 * 없는 주소 (404). MainLayout 안의 `path: "*"` 라우트가 그린다 → 사이드바는 그대로 보인다.
 * 라우트에 handle.notFound를 두어 메뉴 가드가 권한 검사 없이 통과시킨다 (MenuGuard).
 */
export default function NotFound() {
  const navigate = useNavigate();

  return (
    <PageContainer title="페이지를 찾을 수 없습니다">
      <div className={styles.box}>
        <p className={styles.message}>요청한 페이지를 찾을 수 없습니다.</p>
        <p className={styles.detail}>주소를 확인하거나 왼쪽 메뉴에서 이동해 주세요.</p>
        <IconButton icon={icons.home} iconSize={16} onClick={() => navigate("/")}>
          대시보드로
        </IconButton>
      </div>
    </PageContainer>
  );
}
