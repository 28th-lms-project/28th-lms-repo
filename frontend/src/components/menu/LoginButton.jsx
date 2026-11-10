import { useNavigate } from "react-router-dom";
import { IconButton } from "../sample/input/IconButton";
import { icons } from "../sample/input/icons";
import styles from "./SideMenu.module.css";

export default function LoginButton() {
  const navigate = useNavigate();

  const onClickLoginHandler = () => {
    navigate("/login");
  };

  return (
    <div className={styles.guestSection}>
      <IconButton icon={icons.login} onClick={onClickLoginHandler}>
        로그인
      </IconButton>
    </div>
  );
}
