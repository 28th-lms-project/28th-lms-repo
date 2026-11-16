/**
 * 켜짐 / 꺼짐 스위치 (바로 적용되는 설정). 저장 버튼을 눌러야 적용되는 값이면 체크박스(.form-check)를 쓴다.
 * 스타일은 styles/choice.css.
 *
 * @param {object} props
 * @param {boolean} props.checked
 * @param {(checked: boolean) => void} props.onChange
 * @param {React.ReactNode} props.children  글자
 * @param {boolean} [props.disabled]
 */
export default function Switch({ checked, onChange, disabled = false, children }) {
  return (
    <label className="switch">
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch-track" aria-hidden="true" />
      {children}
    </label>
  );
}
