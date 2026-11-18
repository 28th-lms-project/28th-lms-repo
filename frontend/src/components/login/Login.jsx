import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { loginSuccess, selectUser } from "../../store/slices/loginSliceStore";
import { login } from "../../api/login/loginApi";
import { useId, useState } from "react";
import { decodeToken } from "../../utils/tokenStorage";
import Field from "../common/ui/Field.jsx";
import Callout from "../common/ui/Callout.jsx";
import Button from "../common/ui/Button";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const baseId = useId();

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
          // name은 MainLayout이 /members/me로 채운다 (역할 이름은 권한 정보에서)
          user: {
            id: payload.sub,
            name: null,
          },
        }),
      );
      navigate("/", { replace: true });
    } catch (error) {
      setPassword("");
      setErrorMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  let buttonLabel = "로그인";
  if (submitting) {
    buttonLabel = "로그인 중...";
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={onSubmitLoginHandler} noValidate>
        <h2 className="auth-title">로그인</h2>
        {errorMessage && (
          <Callout tone="danger" icon={null}>
            {errorMessage}
          </Callout>
        )}
        <div className="form-stack">
          <Field label="아이디" htmlFor={`${baseId}-id`}>
            <input
              id={`${baseId}-id`}
              className="form-control"
              value={id}
              onChange={(event) => setId(event.target.value)}
              autoComplete="username"
              autoFocus
            />
          </Field>
          <Field label="비밀번호" htmlFor={`${baseId}-pw`}>
            <input
              id={`${baseId}-pw`}
              type="password"
              className="form-control"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </Field>
        </div>
        <Button type="submit" variant="primary" block loading={submitting}>
          {buttonLabel}
        </Button>
        <p className="auth-footer">
          비밀번호 초기화는 관리자를 통해 가능합니다.
        </p>
      </form>
    </div>
  );
}
