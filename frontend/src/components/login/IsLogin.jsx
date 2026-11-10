// src/components/common/auth/IsLogin.jsx
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/loginSliceStore";

/**
 * 로그인 상태일 때만 자식 컴포넌트를 보여줌
 */
export default function IsLogin({ children }) {
  const user = useSelector(selectUser);

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

/**
 * 비로그인 상태일 때 자식 컴포넌트/ 예) 로그인
 */
export function IsNotLogin({ children }) {
  const user = useSelector(selectUser);

  if (user) {
    return null;
  }

  return <>{children}</>;
}
