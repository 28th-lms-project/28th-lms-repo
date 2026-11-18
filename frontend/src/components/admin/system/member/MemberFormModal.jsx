import { useId, useState } from "react";
import Modal from "../../../common/ui/Modal.jsx";
import Field from "../../../common/ui/Field.jsx";
import Button from "../../../common/ui/Button.jsx";
import { useToast } from "../../../common/ui/feedbackContext.js";
import { modifyMember } from "../../../../api/admin/system/member/memberApi.js";

export default function MemberFormModal({ member, onClose, onCompleted }) {
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const nameId = useId();
  const githubId = useId();

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

      toast.success("회원 정보를 수정했습니다."); // ← 추가
      onCompleted(updated);
    } catch (error) {
      if (error.validations) {
        setErrors(error.validations);
      } else {
        toast.error(error.message || "수정에 실패했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  let submitLabel = "저장";
  if (submitting) {
    submitLabel = "저장 중...";
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="회원 정보 수정"
      description={`${member.name}(${member.id})`}
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
      <div className="form-stack">
        <Field
          label="이름"
          htmlFor={nameId}
          required
          hint="10자 이하"
          error={errors.name?.[0]}
        >
          <input
            id={nameId}
            name="name"
            className="form-control"
            defaultValue={member.name}
            maxLength={10}
          />
        </Field>
        <Field
          label="GitHub 주소"
          htmlFor={githubId}
          error={errors.githubUrl?.[0]}
        >
          <input
            id={githubId}
            name="githubUrl"
            className="form-control"
            defaultValue={member.githubUrl ?? ""}
            placeholder="https://github.com/아이디"
          />
        </Field>
      </div>
    </Modal>
  );
}
