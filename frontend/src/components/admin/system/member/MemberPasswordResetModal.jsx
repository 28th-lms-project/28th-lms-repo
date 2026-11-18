import { useId, useState } from "react";
import { resetPassword } from "../../../../api/admin/system/member/memberApi.js";
import Field from "../../../common/ui/Field.jsx";
import Modal from "../../../common/ui/Modal.jsx";
import Button from "../../../common/ui/Button.jsx";
import { useToast } from "../../../common/ui/feedbackContext.js";

export default function MemberPasswordResetModal({
  member,
  onClose,
  onCompleted,
}) {
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const passwordId = useId();

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
      toast.success(
        `${member.name}(${member.id}) 회원의 비밀번호를 초기화했습니다.`,
      );
      onCompleted();
    } catch (error) {
      if (error.validations?.password?.[0]) {
        setErrorMessage(error.validations.password[0]);
      } else {
        toast.error(error.message || "비밀번호 초기화에 실패했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  let submitLabel = "초기화";
  if (submitting) {
    submitLabel = "초기화 중...";
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="비밀번호 초기화"
      description={`${member.name}(${member.id}) 회원의 새 비밀번호를 입력하세요. 초기화하면 로그인 잠금도 풀립니다.`}
      onSubmit={onSubmitHandler}
      dismissible={!submitting}
      footer={
        <>
          <Button onClick={onClose} disabled={submitting}>
            취소
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <Field
        label="새 비밀번호"
        htmlFor={passwordId}
        required
        hint="8~20자"
        error={errorMessage}
      >
        <input
          id={passwordId}
          type="password"
          className="form-control"
          maxLength={20}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
        />
      </Field>
    </Modal>
  );
}
