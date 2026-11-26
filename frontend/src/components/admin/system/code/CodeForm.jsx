import { useId } from "react";
import Field from "../../../common/ui/Field";

// 서버 검증 메시지 배열 → Field error 문구 (없으면 undefined)
const toError = (messages) => {
  if (!messages || messages.length === 0) {
    return undefined;
  }
  return messages.join("\n");
};

// 코드(ID) 칸 도움말: 추가할 때와 수정할 때가 다름
const idHintOf = (idEditable) => {
  if (idEditable) {
    return undefined;
  }
  return "추가한 뒤에는 바꿀 수 없습니다.";
};

/**
 * 수정 · 추가할 때의 입력 칸 (보기는 UpdateCode의 desc-list)
 *
 * form          : { id, name, parentId, order, useYn }
 * onChange      : 입력 변경 핸들러
 * idEditable    : 코드(ID) 입력 가능 여부 (추가할 때만 true)
 * disabled      : 저장 중이면 true
 * parentOptions : 상위 코드 드롭다운 목록 (대분류는 넘기지 않음)
 * fieldErrors   : 서버 검증 메시지 { name: ["..."] }
 */
export default function CodeForm({
  form,
  onChange,
  idEditable,
  disabled = false,
  parentOptions,
  fieldErrors = {},
}) {
  // 대 · 중 · 소 분류에서 한 화면에 3번 그려지므로 id를 따로 만듦
  const idBase = useId();
  const inputId = (name) => `${idBase}-${name}`;

  return (
    <div className="form-stack">
      <Field
        label="코드"
        htmlFor={inputId("id")}
        required={idEditable}
        hint={idHintOf(idEditable)}
        error={toError(fieldErrors.id)}
      >
        <input
          id={inputId("id")}
          type="text"
          name="id"
          className="form-control form-control-mono"
          value={form.id}
          readOnly={!idEditable}
          disabled={disabled}
          onChange={onChange}
        />
      </Field>

      {parentOptions && (
        <Field
          label="상위 코드"
          htmlFor={inputId("parentId")}
          error={toError(fieldErrors.parentId)}
        >
          <select
            id={inputId("parentId")}
            name="parentId"
            className="form-control"
            value={form.parentId}
            disabled={disabled}
            onChange={onChange}
          >
            {parentOptions.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field
        label="이름"
        htmlFor={inputId("name")}
        error={toError(fieldErrors.name)}
      >
        <input
          id={inputId("name")}
          type="text"
          name="name"
          className="form-control"
          value={form.name}
          disabled={disabled}
          onChange={onChange}
        />
      </Field>

      <Field
        label="순서"
        htmlFor={inputId("order")}
        error={toError(fieldErrors.order)}
      >
        <input
          id={inputId("order")}
          type="number"
          name="order"
          className="form-control"
          value={form.order}
          disabled={disabled}
          onChange={onChange}
        />
      </Field>

      <Field group label="사용 여부" error={toError(fieldErrors.useYn)}>
        <label className="form-check">
          <input
            type="checkbox"
            name="useYn"
            checked={form.useYn === "Y"}
            disabled={disabled}
            onChange={onChange}
          />{" "}
          사용
        </label>
      </Field>
    </div>
  );
}
