import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { loginSuccess, selectUser } from "../../store/slices/loginSliceStore";
import { login } from "../../api/login/loginApi";
import { useState } from "react";
import { decodeToken } from "../../utils/tokenStorage";
import PageContainer from "../common/PageContainer";
import styles from "./Login.module.css";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 이미 로그인한 상태면 메인으로
  if (user) {
    return <Navigate to="/" replace />;
  }

  const onSubmitLoginHandler = async (event) => {
    event.preventDefault();
    if (!id.trim() || !password) {
      setErrorMessage("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    try {
      const token = await login(id.trim(), password);
      const payload = decodeToken(token);
      dispatch(
        loginSuccess({
          token,
          user: {
            id: payload.sub,
            name: null,
            roleName: payload.roles?.[0] ?? null,
          },
        }),
      );
      navigate("/", { replace: true });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <div className={styles.wrapper}>
        <form className={styles.form} onSubmit={onSubmitLoginHandler}>
          <label className={styles.field}>
            <span className={styles.span}>아이디</span>
            <input
              className={styles.input}
              type="text"
              placeholder="아이디"
              value={id}
              onChange={(event) => setId(event.target.value)}
              autoComplete="username"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.span}>비밀번호</span>
            <input
              className={styles.input}
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          {errorMessage && <p role="alert">{errorMessage}</p>}
          <button type="submit" disabled={submitting}>
            로그인
          </button>
        </form>
      </div>
    </PageContainer>
  );
}
