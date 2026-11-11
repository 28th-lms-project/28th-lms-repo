import { useEffect, useState } from "react";
import { getMyInfo, updateInfo } from "../../../api/my/info/myInfoApi";
import styles from "./MyInfoForm.module.css";

export default function MyInfoForm({ password }) {
  const [info, setInfo] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadMyInfo = async () => {
      try {
        const data = await getMyInfo({ signal: controller.signal });
        setInfo(data);
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }
        setErrors({ form: [error.message] });
      }
    };

    loadMyInfo();

    return () => {
      controller.abort();
    };
  }, []);

  const validate = (name, githubUrl) => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = ["이름을 입력해주세요."];
    } else if (name.trim().length > 10) {
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
    setSuccessMessage("");

    const formData = new FormData(event.currentTarget);
    const name = (formData.get("name") || "").toString().trim();
    const githubUrl = (formData.get("githubUrl") || "").toString().trim();

    if (!validate(name, githubUrl)) {
      return;
    }

    setSubmitting(true);
    try {
      const updated = await updateInfo({
        name,
        githubUrl,
        password,
      });

      setInfo(updated);
      setSuccessMessage("성공적으로 수정되었습니다.");
      setErrors({});
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

  if (!info) {
    if (errors.form) {
      return (
        <div className={styles.form}>
          <p className={styles.errorMessage}>{errors.form[0]}</p>
        </div>
      );
    }
    return <p className={styles.loadingText}>불러오는 중...</p>;
  }

  let formattedDate = "";
  if (info.createDate) {
    formattedDate = info.createDate.slice(0, 10);
  }

  let githubValue = "";
  if (info.githubUrl) {
    githubValue = info.githubUrl;
  }

  return (
    <form className={styles.form} onSubmit={onSubmitHandler}>
      <h3 className={styles.title}>내 정보 수정</h3>

      <dl className={styles.infoList}>
        <dt>아이디</dt>
        <dd>{info.id}</dd>
        <dt>역할</dt>
        <dd>{info.baseRole}</dd>
        <dt>가입일</dt>
        <dd>{formattedDate}</dd>
      </dl>

      <label className={styles.field}>
        <span>이름</span>
        <input name="name" defaultValue={info.name} maxLength={10} />
        {errors.name && <p className={styles.errorMessage}>{errors.name[0]}</p>}
      </label>

      <label className={styles.field}>
        <span>Github 주소</span>
        <input
          name="githubUrl"
          defaultValue={githubValue}
          placeholder="https://github.com/아이디"
        />
        {errors.githubUrl && (
          <p className={styles.errorMessage}>{errors.githubUrl[0]}</p>
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
