import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/loginSliceStore";
import { selectRoleDisplayName } from "../../store/slices/permissionSliceStore";
import styles from "./UserProfile.module.css";
import LogoutButton from "./LogoutButton";

/**
 * 사이드바 프로필: 역할 이름 · 내 이름 · [로그아웃].
 * 역할 이름은 내 권한 정보(permission.roleDisplayName), 이름은 MainLayout이 /members/me로 채운 값.
 * 이름을 아직 못 받았거나 조회에 실패하면 아이디를 대신 보여 준다.
 */
export default function UserProfile() {
  const user = useSelector(selectUser);
  const roleName = useSelector(selectRoleDisplayName);

  if (!user) {
    return null;
  }

  return (
    <div className={styles.userProfile}>
      {roleName && <span className={styles.role}>{roleName}</span>}
      <strong className={styles.name}>{user.name || user.id}</strong>
      <LogoutButton />
    </div>
  );
}
