import { useState } from "react";
import { verifyPassword } from "../../../api/my/info/myInfoApi";
import styles from "./MyPassword.module.css";

export default function MyPassword({ onVerified }) {
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

  return (
    <div className={styles.container}>
      <form
        className={styles.formWrapper}
        onSubmit={onSubmitPasswordVerifyHandler}
      >
        <input
          type="password"
          className={styles.passwordInput}
          placeholder="현재 비밀번호를 입력해주세요."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password" //브라우저에서 패스워드 입력창을 인식하는 방식.
          autoFocus
        />

        {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}

        <div className={styles.buttonWrap}>
          <button
            type="submit"
            disabled={submitting}
            style={{ width: "100%", justifyContent: "center" }}
          >
            검증
          </button>
        </div>
      </form>
    </div>
  );
}
