import { useState } from "react";
import { readInput, toOrder } from "./CodeFormUtil";
import { icons } from "../../../common/input/icons";
import { IconButton } from "../../../common/input/IconButton";
import { createCode } from "../../../../api/admin/system/code/codeApi";
import CodeForm from "./CodeForm";

export default function AddCode({
  parentOptions,
  defaultParentId,
  onSaved,
  onCancel,
}) {
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

  const onClickSaveButtonHandler = async () => {
    try {
      const result = await createCode({
        id: form.id,
        name: form.name,
        parentId: form.parentId,
        order: toOrder(form.order),
        useYn: form.useYn,
      });
      onSaved(result);
    } catch (e) {
      alert(e.message);
      return;
    }
  };

  return (
    <div>
      <CodeForm
        form={form}
        onChange={onChangeInputHandler}
        idEditable={true}
        editable={true}
        parentOptions={parentOptions}
        crtDt=""
        mdfyDt=""
      />
      <div className="codeButtons">
        <IconButton
          icon={icons.close}
          onClick={onCancel}
          //   style={"backgroundColor: #F00"}
        >
          취소
        </IconButton>
        <IconButton icon={icons.ok} onClick={onClickSaveButtonHandler}>
          저장
        </IconButton>
      </div>
    </div>
  );
}
