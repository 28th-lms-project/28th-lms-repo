import { createPortal } from "react-dom";
import styles from "./MemberModal.module.css";
import { useState } from "react";
import { resetPassword } from "../../../../api/admin/system/member/memberApi.js";

export default function MemberPasswordResetModal({
  member,
  onClose,
  onCompleted,
}) {
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (!password) {
      setErrorMessage("새 비밀번호를 입력해주세요.");
      return;
    }
    if (password.length < 8 || password.length > 20) {
      setErrorMessage("비밀번호는 8~20자로 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    try {
      await resetPassword(member.id, password);
      alert(`${member.name}(${member.id}) 회원의 비밀번호가 초기화되었습니다.`);
      onCompleted();
    } catch (error) {
      if (error.validations?.password?.[0]) {
        setErrorMessage(error.validations.password[0]);
      } else {
        setErrorMessage(error.message || "비밀번호 초기화에 실패했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className={styles.modalOverlay}>
      <form className={styles.modal} onSubmit={onSubmitHandler}>
        <h3 className={styles.modalTitle}>비밀번호 초기화</h3>

        <div className={styles.modalContent}>
          <p className={styles.modalDescription}>
            <strong>
              {member.name} ({member.id})
            </strong>{" "}
            회원의 새 비밀번호를 입력해주세요.
          </p>

          <label className={styles.field}>
            <span>새 비밀번호 *</span>
            <input
              type="password"
              placeholder="새 비밀번호 입력 (8~20자)"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
            />
            {errorMessage && (
              <p className={styles.errorMessage}>{errorMessage}</p>
            )}
          </label>
        </div>

        <div className={styles.modalButtons}>
          <button type="button" onClick={onClose}>
            취소
          </button>
          <button type="submit" disabled={submitting}>
            초기화
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
