import { useState } from "react";
import { formatDate, readInput, toOrder } from "./CodeFormUtil";
import { modifyCode } from "../../../../api/admin/system/code/codeApi";
import Panel from "../../../common/ui/Panel";
import Button from "../../../common/ui/Button";
import Badge from "../../../common/ui/Badge";
import StatusBox from "../../../common/ui/StatusBox";
import { useToast } from "../../../common/ui/feedbackContext";
import { icons } from "../../../common/input/icons";
import CodeForm from "./CodeForm";
import style from "./UpdateCode.module.css";

// 선택된 코드 → 폼 초기값 (코드가 없으면 빈 폼)
const toForm = (code, defaultParentId) => {
  if (!code) {
    return {
      id: "",
      name: "",
      parentId: defaultParentId,
      order: "",
      useYn: "Y",
    };
  }
  return {
    id: code.id,
    name: code.name,
    parentId: code.parentId,
    order: code.order,
    useYn: code.useYn,
  };
};

// 상위 코드 id → 이름 (목록에 없으면 id 그대로)
const parentNameOf = (parentOptions, parentId) => {
  const parent = parentOptions.find((option) => option.id === parentId);
  if (!parent) {
    return parentId;
  }
  return parent.name;
};

/**
 * 상세 패널: 보기(desc-list + [수정]) ↔ 수정(입력 + [취소] [저장])
 *
 * code          : 선택된 코드 (없으면 "코드를 고르세요.")
 * parentOptions : 상위 코드 드롭다운 목록 (대분류는 넘기지 않음)
 * onSaved       : 수정 성공 후 호출, 저장된 코드를 넘김
 */
export default function UpdateCode({ code, parentOptions, onSaved }) {
  const toast = useToast();
  const [modifying, setModifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(toForm(code));

  if (!code) {
    return (
      <Panel title="상세">
        <StatusBox type="empty" size="sm" title="코드를 고르세요." />
      </Panel>
    );
  }

  const onChangeInputHandler = (event) => {
    const { name, value } = readInput(event);

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onClickModifyButtonHandler = () => {
    setModifying(true);
  };

  const onClickCancelButtonHandler = () => {
    setForm(toForm(code));
    setModifying(false);
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (saving) {
      return;
    }
    setSaving(true);
    try {
      const saved = await modifyCode(code.id, {
        name: form.name,
        parentId: form.parentId,
        order: toOrder(form.order),
        useYn: form.useYn,
      });
      setModifying(false);
      toast.success("저장했습니다.");
      onSaved(saved);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  let badge;
  let footer;
  let body;
  if (modifying) {
    badge = <Badge tone="warning">수정 중</Badge>;
    let saveText = "저장";
    if (saving) {
      saveText = "저장 중...";
    }
    footer = (
      <>
        <Button disabled={saving} onClick={onClickCancelButtonHandler}>
          취소
        </Button>
        <Button type="submit" variant="primary" loading={saving}>
          {saveText}
        </Button>
      </>
    );
    body = (
      <CodeForm
        form={form}
        onChange={onChangeInputHandler}
        idEditable={false}
        disabled={saving}
        parentOptions={parentOptions}
      />
    );
  } else {
    if (code.useYn === "N") {
      badge = <Badge>미사용</Badge>;
    } else {
      badge = <Badge tone="success">사용</Badge>;
    }
    footer = (
      <Button icon={icons.edit} onClick={onClickModifyButtonHandler}>
        수정
      </Button>
    );
    body = (
      <dl className={`desc-list ${style.desc}`}>
        <dt>코드</dt>
        <dd className="cell-mono">{code.id}</dd>

        {parentOptions && (
          <>
            <dt>상위</dt>
            <dd>{parentNameOf(parentOptions, code.parentId)}</dd>
          </>
        )}

        <dt>순서</dt>
        <dd>{code.order}</dd>
        <dt>생성</dt>
        <dd>{formatDate(code.crtDt)}</dd>
        <dt>수정</dt>
        <dd>{formatDate(code.mdfyDt)}</dd>
      </dl>
    );
  }

  return (
    <form onSubmit={onSubmitHandler}>
      <Panel title={code.name} badge={badge} footer={footer}>
        {body}
      </Panel>
    </form>
  );
}
