/**
 * 하나 또는 여러 개를 고르는 묶음. 진짜 radio · checkbox를 쓰므로 키보드(방향키 · 스페이스)가 그대로 동작한다.
 * 스타일은 styles/choice.css.
 *
 * @param {object} props
 * @param {string} props.name             input name (화면에서 고유하게)
 * @param {string} [props.legend]         묶음 이름 (화면에는 숨김, 스크린 리더용).
 *                                       <Field group label="…"> 안에서는 생략 (Field 라벨이 묶음 이름이 됨, 두 번 읽히지 않게)
 * @param {{ value: string, label: React.ReactNode, disabled?: boolean }[]} props.options
 * @param {string|string[]} props.value   multiple이면 배열
 * @param {(value: any) => void} props.onChange
 * @param {boolean} [props.multiple]      체크박스 (여러 개)
 * @param {"pill"|"segmented"} [props.variant="pill"]  segmented는 하나만 고르는 2~4개 전환
 */
export default function ChoiceGroup({ name, legend, options, value, onChange, multiple = false, variant = "pill" }) {
  const segmented = variant === "segmented";
  const isChecked = (v) => (multiple ? value.includes(v) : value === v);

  const handleChange = (v) => {
    if (!multiple) return onChange(v);
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  return (
    <fieldset className={segmented ? "segmented" : "choice-group"}>
      {legend && <legend className="visually-hidden">{legend}</legend>}
      {options.map((option) => (
        <label key={option.value} className={segmented ? "segment" : "choice"}>
          <input
            type={multiple && !segmented ? "checkbox" : "radio"}
            name={name}
            value={option.value}
            checked={isChecked(option.value)}
            disabled={option.disabled}
            onChange={() => handleChange(option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
