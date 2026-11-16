import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/loginSliceStore";
import styles from "./UserProfile.module.css";
import LogoutButton from "./LogoutButton";
import SwatchPicker from "../common/ui/SwatchPicker";
import { BRANDS, useBrandTheme } from "../../theme/brandTheme";

export default function UserProfile() {
  const user = useSelector(selectUser);
  const [brand, setBrand] = useBrandTheme();

  if (!user) {
    return null;
  }

  return (
    <div className={styles.userProfile}>
      {user.roleName && <span className={styles.role}>{user.roleName}</span>}
      <strong className={styles.name}>{user.name ?? user.id}</strong>
      <LogoutButton />
      {/* 테마: 사이드바 색만 바뀜 (앱 전체 · 이 브라우저에 기억) */}
      <SwatchPicker
        name="sidebar-brand"
        legend="사이드바 테마"
        options={BRANDS}
        value={brand}
        onChange={setBrand}
        className={styles.brandPicker}
      />
    </div>
  );
}
