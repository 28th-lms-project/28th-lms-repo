import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import StatusBox from "../ui/StatusBox";
import NotFound from "./NotFound";

/**
 * 오류에 맞는 큰 숫자. 원인과 다른 숫자를 보이지 않게 고른다.
 * - 라우터 오류: 그 상태 코드 / API 오류: 서버가 준 상태 코드 (네트워크 오류는 응답이 없어 숫자 없이 오류 아이콘)
 * - 화면 코드 오류(렌더링 · loader 안의 버그): "500" (샘플 예시와 같음)
 */
const statusCodeOf = (error) => {
  if (isRouteErrorResponse(error)) return String(error.status);
  if (error?.name === "ApiError") return error.httpStatusCode ? String(error.httpStatusCode) : undefined;
  return "500";
};

/**
 * 라우트 오류 화면 (errorElement). 화면 코드 오류 · 라우트 loader 오류를 받는다.
 * - MainLayout 아래(경로 없는 라우트)에 두면 사이드바는 그대로 두고 본문만 이 화면으로 바뀐다.
 * - 라우터가 만든 404는 NotFound로 보낸다 (보통은 `path: "*"` 라우트가 먼저 받음).
 * - API 오류(ApiError)는 서버 메시지를 보여 준다. 그 외 오류는 개발 환경에서만 "이름: 메시지" 한 줄 (스택은 콘솔).
 * 표준: ui-style-guide.md 8장 "화면 예시" › 오류 화면 (StatusBox size="lg")
 */
export default function RouteError() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFound />;
  }

  // 개발 중 원인 확인용 (운영에서는 콘솔에만)
  console.error(error);

  let detail;
  if (error?.name === "ApiError") {
    detail = error.message;
  } else if (import.meta.env.DEV) {
    detail = isRouteErrorResponse(error)
      ? `${error.status} ${error.statusText}`
      : `${error?.name ?? "Error"}: ${error?.message ?? String(error)}`;
  }

  return (
    <StatusBox
      type="error"
      size="lg"
      code={statusCodeOf(error)}
      title="화면을 불러오지 못했습니다."
      detail={detail}
      onRetry={() => window.location.reload()}
    />
  );
}
