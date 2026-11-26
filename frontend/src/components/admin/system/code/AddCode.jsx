import { useState } from "react";
import { readInput, toOrder } from "./CodeFormUtil";
import { createCode } from "../../../../api/admin/system/code/codeApi";
import Panel from "../../../common/ui/Panel";
import Button from "../../../common/ui/Button";
import Badge from "../../../common/ui/Badge";
import { useToast } from "../../../common/ui/feedbackContext";
import CodeForm from "./CodeForm";

/**
 * 상세 패널의 추가 상태: 빈 입력 + [취소] [등록]
 *
 * parentOptions   : 상위 코드 드롭다운 목록 (대분류는 넘기지 않음)
 * defaultParentId : 처음 고를 상위 코드
 * onSaved         : 등록 성공 후 호출, 저장된 코드를 넘김
 * onCancel        : [취소]
 */
export default function AddCode({
  parentOptions,
  defaultParentId,
  onSaved,
  onCancel,
}) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    id: "",
    name: "",
    parentId: defaultParentId,
    order: "",
    useYn: "Y",
  });

  const onChangeInputHandler = (event) => {
    const { name, value } = readInput(event);
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (saving) {
      return;
    }
    setSaving(true);
    try {
      const result = await createCode({
        id: form.id,
        name: form.name,
        parentId: form.parentId,
        order: toOrder(form.order),
        useYn: form.useYn,
      });
      toast.success("등록했습니다.");
      onSaved(result);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  let saveText = "등록";
  if (saving) {
    saveText = "등록 중...";
  }

  return (
    <form onSubmit={onSubmitHandler}>
      <Panel
        title="새 코드"
        badge={<Badge tone="warning">등록 중</Badge>}
        footer={
          <>
            <Button disabled={saving} onClick={onCancel}>
              취소
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {saveText}
            </Button>
          </>
        }
      >
        <CodeForm
          form={form}
          onChange={onChangeInputHandler}
          idEditable={true}
          disabled={saving}
          parentOptions={parentOptions}
        />
      </Panel>
    </form>
  );
}
