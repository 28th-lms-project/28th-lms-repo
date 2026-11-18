import { useEffect, useId, useState } from "react";
import { getMyInfo, updateInfo } from "../../../api/my/info/myInfoApi";
import Panel from "../../common/ui/Panel";
import Field from "../../common/ui/Field";
import Button from "../../common/ui/Button";
import StatusBox from "../../common/ui/StatusBox";
import { useToast } from "../../common/ui/feedbackContext";

export default function MyInfoForm({ password }) {
  const toast = useToast();
  const nameId = useId();
  const githubId = useId(); // 훅은 모두 early return 위에
  const [loadError, setLoadError] = useState(null); // 불러오기 실패
  const [submitting, setSubmitting] = useState(false);
  const [info, setInfo] = useState(null);
  const [errors, setErrors] = useState({});

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
        setLoadError(error);
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
      toast.success("수정이 완료되었습니다.");
      setErrors({});
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
  if (loadError) {
    return (
      <StatusBox
        type="error"
        title="내 정보를 불러오지 못했습니다."
        detail={loadError.message}
      />
    );
  }

  if (!info) {
    return <StatusBox type="loading" />;
  }

  let formattedDate = "";
  if (info.createDate) {
    formattedDate = info.createDate.slice(0, 10);
  }

  let githubValue = "";
  if (info.githubUrl) {
    githubValue = info.githubUrl;
  }

  let saveLabel = "저장";
  if (submitting) {
    saveLabel = "저장중...";
  }

  return (
    <form onSubmit={onSubmitHandler} noValidate>
      <Panel
        title="기본 정보"
        footer={
          <Button type="submit" variant="primary" loading={submitting}>
            {saveLabel}
          </Button>
        }
      >
        <div className="form-stack">
          <dl className="desc-list">
            <dt>아이디</dt>
            <dd>{info.id}</dd>
            <dt>역할</dt>
            <dd>{info.baseRole}</dd>
            <dt>가입일</dt>
            <dd>{formattedDate}</dd>
          </dl>

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
              defaultValue={info.name}
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
              defaultValue={githubValue}
              placeholder="https://github.com/아이디"
            />
          </Field>
        </div>
      </Panel>
    </form>
  );
}
