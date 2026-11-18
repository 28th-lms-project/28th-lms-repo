import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/loginSliceStore";
import { selectRoleDisplayName } from "../../store/slices/permissionSliceStore";
import styles from "./UserProfile.module.css";
import LogoutButton from "./LogoutButton";

/**
 * 사이드바 프로필: 역할 이름 · 내 이름 · [로그아웃].
 * 역할 이름은 내 권한 정보(permission.roleDisplayName), 이름은 MainLayout이 /members/me로 채운 값.
 * 역할 · 이름을 받기 전에는 빈칸으로 자리를 잡아 두어(줄 높이 유지) 값이 들어올 때 [로그아웃]이 밀리지 않게 한다.
 * 이름 조회에 실패했을 때만 이름 대신 아이디를 보여 준다.
 */
export default function UserProfile() {
  const user = useSelector(selectUser);
  const roleName = useSelector(selectRoleDisplayName);

  if (!user) {
    return null;
  }

  return (
    <div className={styles.userProfile}>
      <span className={styles.role}>{roleName || "\u00a0"}</span>
      <strong className={styles.name}>
        {user.name || (user.nameFailed ? user.id : "\u00a0")}
      </strong>
      <LogoutButton />
    </div>
  );
}
