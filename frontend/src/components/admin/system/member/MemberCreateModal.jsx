import { createPortal } from "react-dom";
import styles from "./MemberModal.module.css";
import { useState } from "react";
import { createMember } from "../../../../api/admin/system/member/memberApi.js";

export default function MemberCreateModal({ roles, onClose, onCompleted }) {
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const assignableRoles = roles.filter(
    (role) => role.roleId !== "ROLE_SUPER_ADMIN",
  );

  const validate = (id, password, name, baseRole, githubUrl) => {
    const newErrors = {};

    if (!id) {
      newErrors.id = ["아이디를 입력해주세요."];
    } else if (id.length > 20) {
      newErrors.id = ["아이디는 20자 이하로 입력해주세요."];
    }

    if (!password) {
      newErrors.password = ["비밀번호를 입력해주세요."];
    } else if (password.length < 8 || password.length > 20) {
      newErrors.password = ["비밀번호는 8~20자로 입력해주세요."];
    }

    if (!name) {
      newErrors.name = ["이름을 입력해주세요."];
    } else if (name.length > 10) {
      newErrors.name = ["이름은 10자 이하로 입력해주세요."];
    }

    if (!baseRole) {
      newErrors.baseRole = ["역할을 선택해주세요."];
    }

    const trimmedGithub = githubUrl.trim();
    const githubRegex = /^$|^https:\/\/github\.com\/[A-Za-z0-9-]{1,39}\/?$/;
    if (trimmedGithub && !githubRegex.test(trimmedGithub)) {
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
    const id = (formData.get("id") || "").toString().trim();
    const password = (formData.get("password") || "").toString();
    const name = (formData.get("name") || "").toString().trim();
    const baseRole = (formData.get("baseRole") || "").toString().trim();
    const githubUrl = (formData.get("githubUrl") || "").toString().trim();

    if (!validate(id, password, name, baseRole, githubUrl)) {
      return;
    }

    setSubmitting(true);
    try {
      let trimmedUrl = null;
      if (githubUrl) {
        trimmedUrl = githubUrl;
      }

      const newId = await createMember({
        id,
        password,
        name,
        baseRole,
        githubUrl: trimmedUrl,
      });

      alert("회원이 성공적으로 등록되었습니다.");
      onCompleted(newId);
    } catch (error) {
      if (error.validations) {
        setErrors(error.validations);
      } else {
        setErrors({ form: [error.message || "회원 등록에 실패했습니다."] });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className={styles.modalOverlay}>
      <form className={styles.modal} onSubmit={onSubmitHandler}>
        <h3 className={styles.modalTitle}>신규 회원 등록</h3>

        <div className={styles.modalContent}>
          <label className={styles.field}>
            <span>아이디 *</span>
            <input name="id" maxLength={20} placeholder="아이디 입력 (최대 20자)" />
            {errors.id && <p className={styles.errorMessage}>{errors.id[0]}</p>}
          </label>

          <label className={styles.field}>
            <span>비밀번호 *</span>
            <input
              name="password"
              type="password"
              placeholder="비밀번호 입력 (8~20자)"
              autoComplete="new-password"
            />
            {errors.password && (
              <p className={styles.errorMessage}>{errors.password[0]}</p>
            )}
          </label>

          <label className={styles.field}>
            <span>이름 *</span>
            <input name="name" maxLength={10} placeholder="이름 입력 (최대 10자)" />
            {errors.name && (
              <p className={styles.errorMessage}>{errors.name[0]}</p>
            )}
          </label>

          <label className={styles.field}>
            <span>역할 *</span>
            <select name="baseRole" defaultValue="">
              <option value="" disabled>
                역할을 선택해주세요
              </option>
              {assignableRoles.map((role) => (
                <option key={role.roleId} value={role.roleId}>
                  {role.roleDisplayName}
                </option>
              ))}
            </select>
            {errors.baseRole && (
              <p className={styles.errorMessage}>{errors.baseRole[0]}</p>
            )}
          </label>

          <label className={styles.field}>
            <span>GitHub 주소</span>
            <input
              name="githubUrl"
              placeholder="https://github.com/아이디 (선택)"
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
            등록
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
