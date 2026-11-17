/**
 * 색 견본 고르기 (테마 · 강조색 후보). 스타일은 styles/choice.css (.swatch-group · .swatch).
 * 진짜 radio라서 방향키로 이동하고, 마우스를 올리면 이름이 보인다(title).
 *
 * @param {object} props
 * @param {string} props.name     radio name (화면에서 고유하게)
 * @param {string} props.legend   묶음 이름 (스크린 리더)
 * @param {{ id: string, label: string, swatch: string, accent?: string }[]} props.options
 *   swatch: 견본 색 · accent: 가운데 점 색 (선택)
 * @param {string} props.value
 * @param {(id: string) => void} props.onChange
 * @param {string} [props.className]  어두운 배경 위(사이드바)에서는 --swatch-gap · --swatch-ring을 덮어쓴다
 */
export default function SwatchPicker({ name, legend, options, value, onChange, className = "" }) {
  return (
    <fieldset className={`swatch-group ${className}`.trim()}>
      <legend className="visually-hidden">{legend}</legend>
      {options.map((option) => (
        <label
          key={option.id}
          className="swatch"
          title={option.label}
          style={{ "--swatch": option.swatch, ...(option.accent ? { "--swatch-dot": option.accent } : {}) }}
        >
          <input type="radio" name={name} value={option.id} checked={value === option.id} onChange={() => onChange(option.id)} />
          <span className="visually-hidden">{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
