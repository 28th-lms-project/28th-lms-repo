import { useNavigate } from "react-router-dom";
import StatusBox from "../ui/StatusBox";
import Button from "../ui/Button";
import { icons } from "../input/icons";

/**
 * 없는 주소 (404). MainLayout 안의 `path: "*"` 라우트가 그린다 → 사이드바는 그대로 보인다.
 * 라우트에 handle.notFound를 두어 메뉴 가드가 권한 검사 없이 통과시킨다 (MenuGuard).
 * 표준: ui-style-guide.md 8장 "화면 예시" › 오류 화면 (StatusBox size="lg")
 */
export default function NotFound() {
  const navigate = useNavigate();

  return (
    <StatusBox
      type="notFound"
      size="lg"
      detail="주소를 확인하거나 왼쪽 메뉴에서 이동해 주세요."
      actions={
        <>
          <Button onClick={() => navigate(-1)}>뒤로</Button>
          <Button variant="primary" icon={icons.home} onClick={() => navigate("/")}>
            홈으로
          </Button>
        </>
      }
    />
  );
}
