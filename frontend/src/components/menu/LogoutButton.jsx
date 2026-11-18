import { useDispatch } from "react-redux";
import { logout } from "../../store/slices/loginSliceStore";
import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onClickLogoutButtonHandler = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };
  return (
    <button type="button" className="sidebar-btn" onClick={onClickLogoutButtonHandler}>
      로그아웃
    </button>
  );
}
