import { Children, cloneElement, isValidElement } from "react";

/**
 * 폼 필드 틀: 라벨 + 입력 + (오류 또는 힌트) + (글자 수). 스타일은 styles/form.css.
 * 입력 칸은 children으로 직접 넣는다 (<input className="form-control" />).
 *
 * 접근성: 입력의 id(SelectBox는 inputId)를 htmlFor와 같게 하면, Field가 그 입력에
 * aria-invalid(오류일 때) · aria-describedby(힌트 · 오류 문구) — SelectBox는 aria-errormessage — 를 자동으로 붙인다.
 * 입력이 children 바로 아래에 없으면(input-range · input-group 안 등) 직접 붙인다: aria-describedby={`${htmlFor}-msg`}.
 *
 * @param {object} props
 * @param {string} props.label
 * @param {string} [props.htmlFor]   입력의 id
 * @param {boolean} [props.required] 라벨 뒤 빨간 *
 * @param {string} [props.hint]      도움말 (오류가 있으면 오류만 표시)
 * @param {string} [props.error]
 * @param {{ current: number, max: number }} [props.count]  글자 수 (textarea)
 */
/** children 중 htmlFor와 id(또는 inputId)가 같은 요소에 오류 · 힌트 연결을 붙임 (이미 있는 값은 그대로) */
const wire = (children, htmlFor, messageId, hasMessage, error) =>
  Children.map(children, (child) => {
    if (!htmlFor || !isValidElement(child)) return child;
    const { id, inputId } = child.props;
    if (id !== htmlFor && inputId !== htmlFor) return child;
    const extra = {};
    if (error && child.props["aria-invalid"] === undefined) extra["aria-invalid"] = true;
    if (hasMessage) {
      if (inputId === htmlFor) {
        // react-select는 aria-describedby를 자체 안내에 쓰므로 오류는 aria-errormessage로
        if (error && child.props["aria-errormessage"] === undefined) extra["aria-errormessage"] = messageId;
      } else if (child.props["aria-describedby"] === undefined) {
        extra["aria-describedby"] = messageId;
      }
    }
    return Object.keys(extra).length ? cloneElement(child, extra) : child;
  });

export default function Field({ label, htmlFor, required = false, hint, error, count, className = "", children }) {
  const messageId = htmlFor ? `${htmlFor}-msg` : undefined;

  return (
    <div className={`field ${className}`.trim()}>
      {label && (
        <label className={`field-label ${required ? "field-required" : ""}`.trim()} htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {wire(children, htmlFor, messageId, !!(error || hint), error)}
      {error ? (
        <p id={messageId} className="field-error" role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p id={messageId} className="field-hint">
            {hint}
          </p>
        )
      )}
      {count && (
        <span className="field-counter">
          {count.current} / {count.max}
        </span>
      )}
    </div>
  );
}
