import { useState } from "react";
import { updatePassword } from "../../../api/my/info/myInfoApi";
import styles from "./MyPasswordForm.module.css";

export default function MyPasswordForm({ setVerifiedPassword }) {
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const validate = (currentPassword, newPassword, newPasswordConfirm) => {
    const newErrors = {};

    if (!currentPassword) {
      newErrors.currentPassword = ["현재 비밀번호를 입력해주세요."];
    }

    if (!newPassword) {
      newErrors.newPassword = ["새 비밀번호를 입력해주세요."];
    } else if (newPassword.length < 8 || newPassword.length > 20) {
      newErrors.newPassword = ["비밀번호는 8 ~ 20 자로 입력해주세요."];
    }

    if (!newPasswordConfirm) {
      newErrors.newPasswordConfirm = ["새 비밀번호 확인을 입력해주세요."];
    } else if (newPassword !== newPasswordConfirm) {
      newErrors.newPasswordConfirm = ["새 비밀번호가 일치하지 않습니다."];
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      newErrors.newPassword = ["현재 비밀번호와 다른 비밀번호를 입력해주세요."];
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setSuccessMessage("");
    setErrors({});

    const form = event.currentTarget;
    const formData = new FormData(form);

    const currentPassword = (formData.get("currentPassword") || "").toString();
    const newPassword = (formData.get("newPassword") || "").toString();
    const newPasswordConfirm = (
      formData.get("newPasswordConfirm") || ""
    ).toString();

    if (!validate(currentPassword, newPassword, newPasswordConfirm)) {
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword({
        currentPassword,
        newPassword,
        newPasswordConfirm,
      });

      form.reset();
      setSuccessMessage("비밀번호가 변경되었습니다.");

      if (setVerifiedPassword) {
        setVerifiedPassword(newPassword);
      }
    } catch (error) {
      if (error.validations) {
        setErrors(error.validations);
        return;
      }

      if (error.errorCode === "GLOBAL_BAD_REQUEST") {
        setErrors({ currentPassword: ["현재 비밀번호가 일치하지 않습니다."] });
        return;
      }

      setErrors({ form: [error.message || "비밀번호 변경에 실패했습니다."] });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={onSubmitHandler}>
      <h3 className={styles.title}>비밀번호 수정</h3>

      <label className={styles.field}>
        <span>현재 비밀번호</span>
        <input
          type="password"
          name="currentPassword"
          placeholder="현재 비밀번호"
        />
        {errors.currentPassword && (
          <p className={styles.errorMessage}>{errors.currentPassword[0]}</p>
        )}
      </label>
      <label className={styles.field}>
        <span>새 비밀번호</span>
        <input
          type="password"
          name="newPassword"
          maxLength={20}
          placeholder="새 비밀번호"
        />
        {errors.newPassword && (
          <p className={styles.errorMessage}>{errors.newPassword[0]}</p>
        )}
      </label>
      <label className={styles.field}>
        <span>비밀번호 확인</span>
        <input
          type="password"
          name="newPasswordConfirm"
          maxLength={20}
          placeholder="비밀번호 확인"
        />
        {errors.newPasswordConfirm && (
          <p className={styles.errorMessage}>{errors.newPasswordConfirm[0]}</p>
        )}
      </label>

      {errors.form && <p className={styles.errorMessage}>{errors.form[0]}</p>}
      {successMessage && (
        <p className={styles.successMessage}>{successMessage}</p>
      )}
      <button type="submit" disabled={submitting}>
        저장
      </button>
    </form>
  );
}
