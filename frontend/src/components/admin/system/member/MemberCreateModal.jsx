import { useId, useState } from "react";
import { createMember } from "../../../../api/admin/system/member/memberApi.js";
import Field from "../../../common/ui/Field.jsx";
import { useToast } from "../../../common/ui/feedbackContext.js";
import Modal from "../../../common/ui/Modal.jsx";
import Button from "../../../common/ui/Button.jsx";

export default function MemberCreateModal({ roles, onClose, onCompleted }) {
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const baseId = useId();

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

      toast.success("회원이 등록되었습니다.");
      onCompleted(newId);
    } catch (error) {
      if (error.validations) {
        setErrors(error.validations);
      } else {
        toast.error(error.message || "회원 등록에 실패했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  let submitLabel = "등록";
  if (submitting) {
    submitLabel = "등록 중...";
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="신규 회원 등록"
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
          label="아이디"
          htmlFor={`${baseId}-id`}
          required
          hint="20자 이하"
          error={errors.id?.[0]}
        >
          <input
            id={`${baseId}-id`}
            name="id"
            className="form-control"
            maxLength={20}
            autoComplete="off"
          />
        </Field>
        <Field
          label="비밀번호"
          htmlFor={`${baseId}-pw`}
          required
          hint="8~20자"
          error={errors.password?.[0]}
        >
          <input
            id={`${baseId}-pw`}
            name="password"
            type="password"
            className="form-control"
            maxLength={20}
            autoComplete="new-password"
          />
        </Field>
        <Field
          label="이름"
          htmlFor={`${baseId}-name`}
          required
          hint="10자 이하"
          error={errors.name?.[0]}
        >
          <input
            id={`${baseId}-name`}
            name="name"
            className="form-control"
            maxLength={10}
          />
        </Field>
        <Field
          label="역할"
          htmlFor={`${baseId}-role`}
          required
          error={errors.baseRole?.[0]}
        >
          <select
            id={`${baseId}-role`}
            name="baseRole"
            className="form-control"
            defaultValue=""
          >
            <option value="" disabled>
              역할을 고르세요
            </option>
            {roles.map((role) => (
              <option key={role.roleId} value={role.roleId}>
                {role.roleDisplayName}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="GitHub 주소"
          htmlFor={`${baseId}-github`}
          hint="선택"
          error={errors.githubUrl?.[0]}
        >
          <input
            id={`${baseId}-github`}
            name="githubUrl"
            className="form-control"
            placeholder="https://github.com/아이디"
          />
        </Field>
      </div>
    </Modal>
  );
}
