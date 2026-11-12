// 입력칸 아래 검증 메시지 (메시지가 없으면 아무것도 표시하지 않음)
const ErrorField = ({ messages }) => {
  if (!messages) {
    return null;
  }
  return messages.map((message) => (
    <p key={message} className="fieldError">
      {message}
    </p>
  ));
};

/**
 * form          : { id, name, parentId, order, useYn }
 * onChange      : 입력 변경 핸들러
 * idEditable    : ID 입력 가능 여부 (추가할 때만 true)
 * editable      : 나머지 입력 가능 여부
 * parentOptions : P-ID 드롭다운 목록 (대분류는 넘기지 않음)
 * crtDt, mdfyDt : 생성일 · 수정일 (표시용)
 * fieldErrors   : 서버 검증 메시지 { name: ["..."] }
 */
export default function CodeForm({
  form,
  onChange,
  idEditable,
  editable,
  parentOptions,
  crtDt,
  mdfyDt,
  fieldErrors = {},
}) {
  return (
    <div className="inputForm">
      <div className="codeInput">
        <label>
          ID{" "}
          <input
            type="text"
            name="id"
            value={form.id}
            disabled={!idEditable}
            onChange={onChange}
          />
        </label>
        <ErrorField messages={fieldErrors.id} />
      </div>

      {parentOptions && (
        <div className="codeInput">
          <label>
            P-ID{" "}
            <select
              name="parentId"
              value={form.parentId}
              disabled={!editable}
              onChange={onChange}
            >
              {parentOptions.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name}
                </option>
              ))}
            </select>
          </label>
          <ErrorField messages={fieldErrors.parentId} />
        </div>
      )}

      <div className="codeInput">
        <label>
          NAME{" "}
          <input
            type="text"
            name="name"
            value={form.name}
            disabled={!editable}
            onChange={onChange}
          />
        </label>
        <ErrorField messages={fieldErrors.name} />
      </div>

      <div className="codeInput">
        <label>
          ORDER{" "}
          <input
            type="number"
            name="order"
            value={form.order}
            disabled={!editable}
            onChange={onChange}
          />
        </label>
        <ErrorField messages={fieldErrors.order} />
      </div>

      <div className="codeInput">
        <label>
          사용여부{" "}
          <input
            type="checkbox"
            name="useYn"
            checked={form.useYn === "Y"}
            disabled={!editable}
            onChange={onChange}
          />
        </label>
        <ErrorField messages={fieldErrors.useYn} />
      </div>

      <div className="codeInput">
        <label>
          생성일 <input type="text" value={crtDt} disabled />
        </label>
      </div>

      <div className="codeInput">
        <label>
          수정일 <input type="text" value={mdfyDt} disabled />
        </label>
      </div>
    </div>
  );
}
