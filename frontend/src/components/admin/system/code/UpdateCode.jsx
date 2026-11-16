import { useState } from "react";
import { formatDate, readInput, toOrder } from "./CodeFormUtil";
import { modifyCode } from "../../../../api/admin/system/code/codeApi";
import { IconButton } from "../../../common/input/IconButton";
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
/**
 * code          : 선택된 코드 (없으면 추가 버튼만 표시)
 * parentOptions : P-ID 드롭다운 목록 (대분류는 넘기지 않음)
 * onSaved       : 수정 성공 후 호출, 저장된 코드를 넘김
 * onAddClick    : 추가 버튼 (부모가 AddCode로 바꿔서 보여줌)
 */
export default function UpdateCode({
  code,
  parentOptions,
  onSaved,
  onAddClick,
}) {
  const [modifying, setModifying] = useState(false);
  const [form, setForm] = useState(toForm(code));

  let crtDt = "";
  let mdfyDt = "";
  if (code) {
    crtDt = formatDate(code.crtDt);
    mdfyDt = formatDate(code.mdfyDt);
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

  const onClickSaveButtonHandler = async () => {
    try {
      const saved = await modifyCode(code.id, {
        name: form.name,
        parentId: form.parentId,
        order: toOrder(form.order),
        useYn: form.useYn,
      });
      setModifying(false);
      onSaved(saved);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div>
      <CodeForm
        form={form}
        onChange={onChangeInputHandler}
        idEditable={false}
        editable={modifying}
        parentOptions={parentOptions}
        crtDt={crtDt}
        mdfyDt={mdfyDt}
      />
      <div className={style.codeButtons}>
        {!modifying && (
          <>
            {code && (
              <IconButton
                icon={icons.edit}
                onClick={onClickModifyButtonHandler}
              >
                수정
              </IconButton>
            )}
            <IconButton icon={icons.add} onClick={onAddClick}>
              추가
            </IconButton>
          </>
        )}
        {modifying && (
          <>
            <IconButton icon={icons.close} onClick={onClickCancelButtonHandler}>
              취소
            </IconButton>
            <IconButton icon={icons.ok} onClick={onClickSaveButtonHandler}>
              저장
            </IconButton>
          </>
        )}
      </div>
    </div>
  );
}
