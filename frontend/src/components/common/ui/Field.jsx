/**
 * 폼 필드 틀: 라벨 + 입력 + (오류 또는 힌트) + (글자 수). 스타일은 styles/form.css.
 * 입력 칸은 children으로 직접 넣는다 (<input className="form-control" />).
 *
 * 접근성: 입력의 id를 htmlFor로 넘기고, 입력에는 aria-invalid={!!error} ·
 * aria-describedby={`${htmlFor}-msg`}를 붙인다 (오류 · 힌트 문구의 id).
 *
 * @param {object} props
 * @param {string} props.label
 * @param {string} [props.htmlFor]   입력의 id
 * @param {boolean} [props.required] 라벨 뒤 빨간 *
 * @param {string} [props.hint]      도움말 (오류가 있으면 오류만 표시)
 * @param {string} [props.error]
 * @param {{ current: number, max: number }} [props.count]  글자 수 (textarea)
 */
export default function Field({ label, htmlFor, required = false, hint, error, count, className = "", children }) {
  const messageId = htmlFor ? `${htmlFor}-msg` : undefined;

  return (
    <div className={`field ${className}`.trim()}>
      {label && (
        <label className={`field-label ${required ? "field-required" : ""}`.trim()} htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
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
