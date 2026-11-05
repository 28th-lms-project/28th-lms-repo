import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/loginSliceStore";
import styles from "./UserProfile.module.css";
import LogoutButton from "./LogoutButton";

export default function UserProfile() {
  const user = useSelector(selectUser);

  if (!user) {
    return null;
  }

  return (
    <div className={styles.userProfile}>
      {user.roleName && <span className={styles.role}>{user.roleName}</span>}
      <strong className={styles.name}>{user.name ?? user.id}</strong>
      <LogoutButton />
    </div>
  );
}
