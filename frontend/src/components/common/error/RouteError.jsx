import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import PageContainer from "../PageContainer";
import { IconButton } from "../input/IconButton";
import { icons } from "../input/icons";
import NotFound from "./NotFound";
import styles from "./RouteError.module.css";

/**
 * 라우트 오류 화면 (errorElement). 화면 코드 오류 · 라우트 loader 오류를 받는다.
 * - MainLayout 아래(경로 없는 라우트)에 두면 사이드바는 그대로 두고 본문만 이 화면으로 바뀐다.
 * - 라우터가 만든 404는 NotFound로 보낸다 (보통은 `path: "*"` 라우트가 먼저 받음).
 * - API 오류(ApiError)는 서버 메시지를 보여 준다. 그 외 오류 내용은 개발 환경에서만 보여 준다.
 */
export default function RouteError() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFound />;
  }

  // 개발 중 원인 확인용 (운영에서는 콘솔에만)
  console.error(error);

  const isApiError = error?.name === "ApiError";
  const showDetail = !isApiError && import.meta.env.DEV;

  return (
    <PageContainer title="오류">
      <div className={styles.box}>
        <p className={styles.message}>화면을 불러오는 중 문제가 생겼습니다.</p>
        {isApiError && <p className={styles.detail}>{error.message}</p>}
        {showDetail && <pre className={styles.devDetail}>{String(error?.stack ?? error)}</pre>}
        <IconButton icon={icons.refresh} iconSize={16} onClick={() => window.location.reload()}>
          다시 시도
        </IconButton>
      </div>
    </PageContainer>
  );
}
