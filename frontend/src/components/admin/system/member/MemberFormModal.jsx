import { createPortal } from "react-dom";
import styles from "./MemberModal.module.css";
import { useState } from "react";
import { modifyMember } from "../../../../api/admin/system/member/memberApi.js";

export default function MemberFormModal({ member, onClose, onCompleted }) {
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (name, githubUrl) => {
    const newErrors = {};

    if (!name) {
      newErrors.name = ["이름을 입력해주세요."];
    } else if (name.length > 10) {
      newErrors.name = ["이름은 10자 이하로 입력해주세요."];
    }

    const githubRegex = /^$|^https:\/\/github\.com\/[A-Za-z0-9-]{1,39}\/?$/;
    if (githubUrl.trim() && !githubRegex.test(githubUrl.trim())) {
      newErrors.githubUrl = [
        "GitHub 주소는 https://github.com/아이디 형식으로 입력해주세요.",
      ];
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = (formData.get("name") || "").toString().trim();
    const githubUrl = (formData.get("githubUrl") || "").toString().trim();

    if (!validate(name, githubUrl)) {
      return;
    }

    setSubmitting(true);
    try {
      const updated = await modifyMember(member.id, {
        name,
        githubUrl,
      });

      onCompleted(updated);
    } catch (error) {
      if (error.validations) {
        setErrors(error.validations);
      } else {
        setErrors({ form: [error.message || "수정에 실패했습니다."] });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className={styles.modalOverlay}>
      <form className={styles.modal} onSubmit={onSubmitHandler}>
        <h3 className={styles.modalTitle}>회원 정보 수정</h3>

        <div className={styles.modalContent}>
          <label className={styles.field}>
            <span>이름</span>
            <input name="name" defaultValue={member.name} maxLength={10} />
            {errors.name && (
              <p className={styles.errorMessage}>{errors.name[0]}</p>
            )}
          </label>
          <label className={styles.field}>
            <span>Github 주소</span>
            <input
              name="githubUrl"
              defaultValue={member.githubUrl ?? ""}
              placeholder="https://github.com/아이디"
            />
            {errors.githubUrl && (
              <p className={styles.errorMessage}>{errors.githubUrl[0]}</p>
            )}
          </label>
          {errors.form && (
            <p className={styles.errorMessage}>{errors.form[0]}</p>
          )}
        </div>
        <div className={styles.modalButtons}>
          <button type="button" onClick={onClose}>
            취소
          </button>
          <button type="submit" disabled={submitting}>
            저장
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
