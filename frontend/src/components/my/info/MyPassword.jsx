import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { verifyPassword } from "../../../api/my/info/myInfoApi";
import Field from "../../common/ui/Field.jsx";
import Callout from "../../common/ui/Callout.jsx";
import Button from "../../common/ui/Button.jsx";

export default function MyPassword({ onVerified }) {
  const passwordId = useId();

  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmitPasswordVerifyHandler = async (event) => {
    event.preventDefault(); // form 제출 시 페이지의 새로고침을 방지한다.

    if (!password.trim()) {
      setErrorMessage("비밀번호를 입력해주세요.");
      return;
    }

    setErrorMessage("");
    setSubmitting(true);

    try {
      await verifyPassword(password);
      if (onVerified) {
        onVerified(password);
      }
    } catch (error) {
      setPassword("");
      if (error.errorCode === "GLOBAL_BAD_REQUEST") {
        setErrorMessage("비밀번호가 일치하지 않습니다.");
        return;
      }
      setErrorMessage(error.message || "비밀번호 확인에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  let buttonLabel = "확인";
  if (submitting) {
    buttonLabel = "확인중...";
  }

  return (
    <div className="auth-page">
      <form
        className="auth-card"
        onSubmit={onSubmitPasswordVerifyHandler}
        noValidate
      >
        <h2 className="auth-title">비밀번호 확인</h2>
        {errorMessage && (
          <Callout tone="danger" icon={null}>
            {errorMessage}
          </Callout>
        )}
        <Field label="비밀번호" htmlFor={passwordId}>
          <input
            id={passwordId}
            type="password"
            className="form-control"
            placeholder="현재 비밀번호를 입력해주세요."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password" //브라우저에서 패스워드 입력창을 인식하는 방식.
            autoFocus
          />
        </Field>

        <Button type="submit" variant="primary" block loading={submitting}>
          {buttonLabel}
        </Button>
        <p className="auth-footer">
          <Link to="/">처음화면으로</Link>
        </p>
      </form>
    </div>
  );
}
