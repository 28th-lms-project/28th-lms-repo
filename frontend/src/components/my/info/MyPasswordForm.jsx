import { useId, useState } from "react";
import { updatePassword } from "../../../api/my/info/myInfoApi";
import Panel from "../../common/ui/Panel";
import Field from "../../common/ui/Field";
import Button from "../../common/ui/Button";
import { useToast } from "../../common/ui/feedbackContext";

export default function MyPasswordForm({ setVerifiedPassword }) {
  const toast = useToast();
  const currentId = useId();
  const newId = useId();
  const confirmId = useId();
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

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
    setErrors({});

    // await 뒤에는 event.currentTarget 이 null 이 되므로 미리 받아 둔다 (성공 후 form.reset())
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
      toast.success("비밀번호를 변경했습니다.");

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

      toast.error(error.message || "비밀번호 변경에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  let saveLabel = "저장";
  if (submitting) {
    saveLabel = "저장 중...";
  }

  return (
    <form onSubmit={onSubmitHandler} noValidate>
      <Panel
        title="비밀번호 변경"
        footer={
          <Button type="submit" variant="primary" loading={submitting}>
            {saveLabel}
          </Button>
        }
      >
        <div className="form-stack">
          <Field
            label="현재 비밀번호"
            htmlFor={currentId}
            required
            error={errors.currentPassword?.[0]}
          >
            <input
              id={currentId}
              type="password"
              name="currentPassword"
              className="form-control"
              autoComplete="current-password"
            />
          </Field>

          {/* 비밀번호 규칙은 처음부터 hint 로 (오류가 나면 Field 가 hint 대신 오류를 보여 줌) */}
          <Field
            label="새 비밀번호"
            htmlFor={newId}
            required
            hint="8~20자"
            error={errors.newPassword?.[0]}
          >
            <input
              id={newId}
              type="password"
              name="newPassword"
              className="form-control"
              maxLength={20}
              autoComplete="new-password"
            />
          </Field>

          <Field
            label="새 비밀번호 확인"
            htmlFor={confirmId}
            required
            error={errors.newPasswordConfirm?.[0]}
          >
            <input
              id={confirmId}
              type="password"
              name="newPasswordConfirm"
              className="form-control"
              maxLength={20}
              autoComplete="new-password"
            />
          </Field>
        </div>
      </Panel>
    </form>
  );
}
