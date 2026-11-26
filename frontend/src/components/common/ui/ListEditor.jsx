import { useEffect, useRef } from "react";
import { icons } from "../input/icons";
import SvgIcon from "./SvgIcon";
import { newListItem } from "./listEditorItem";

/**
 * 반복 입력 행: 설문 보기 · 시험 보기처럼 줄을 더하고 빼는 입력 목록. 스타일은 styles/content.css (.list-editor).
 * 줄에서 Enter를 누르면 바로 아래에 새 줄이 생기고, 빈 줄에서 Backspace를 누르면 그 줄이 지워진다.
 *
 * @param {object} props
 * @param {{ id: string, value: string }[]} props.items
 * @param {(items) => void} props.onChange
 * @param {string} props.label              줄 이름 (스크린 리더: "보기 1", "보기 2" …)
 * @param {string} [props.placeholder]
 * @param {number} [props.min=1]            이보다 적게는 못 지움
 * @param {number} [props.max]              이보다 많이는 못 더함
 * @param {string} [props.addLabel="추가"]
 * @param {boolean} [props.numbered=true]   왼쪽 번호
 * @param {(item, index) => React.ReactNode} [props.renderMarker]  입력 칸 앞에 넣을 것 (시험 보기의 정답 표시 등)
 */
export default function ListEditor({ items, onChange, label, placeholder, min = 1, max, addLabel = "추가", numbered = true, renderMarker }) {
  // 줄을 더하거나 지운 뒤 포커스할 줄. autoFocus는 처음 그릴 때만 동작해서(지운 뒤 앞 줄은 이미 있음) ref로 직접 옮긴다
  const pendingFocus = useRef(null);
  const inputRefs = useRef(new Map());
  useEffect(() => {
    if (pendingFocus.current == null) return;
    inputRefs.current.get(pendingFocus.current)?.focus();
    pendingFocus.current = null;
  });
  const setFocusId = (id) => {
    pendingFocus.current = id;
  };
  const canAdd = max === undefined || items.length < max;
  const canRemove = items.length > min;

  const insertAfter = (index) => {
    if (!canAdd) return;
    const item = newListItem();
    onChange([...items.slice(0, index + 1), item, ...items.slice(index + 1)]);
    setFocusId(item.id);
  };

  const removeAt = (index) => {
    if (!canRemove) return;
    onChange(items.filter((_, i) => i !== index));
    setFocusId(items[index - 1]?.id ?? items[index + 1]?.id ?? null);
  };

  const handleKeyDown = (event, index) => {
    if (event.nativeEvent.isComposing) return; // 한글 입력 중 Enter 무시
    if (event.key === "Enter") {
      event.preventDefault();
      insertAfter(index);
    } else if (event.key === "Backspace" && items[index].value === "" && canRemove) {
      event.preventDefault();
      removeAt(index);
    }
  };

  return (
    <div className="list-editor">
      <ol className="list-editor-rows">
        {items.map((item, index) => (
          <li key={item.id} className="list-editor-row">
            {numbered && (
              <span className="list-editor-no" aria-hidden="true">
                {index + 1}
              </span>
            )}
            {renderMarker?.(item, index)}
            <input
              className="form-control form-control-sm"
              aria-label={`${label} ${index + 1}`}
              placeholder={placeholder}
              value={item.value}
              ref={(el) => {
                if (el) inputRefs.current.set(item.id, el);
                else inputRefs.current.delete(item.id);
              }}
              onChange={(e) => onChange(items.map((it) => (it.id === item.id ? { ...it, value: e.target.value } : it)))}
              onKeyDown={(e) => handleKeyDown(e, index)}
            />
            <button
              type="button"
              className="btn btn-sm btn-icon btn-text"
              aria-label={`${label} ${index + 1} 지우기`}
              disabled={!canRemove}
              onClick={() => removeAt(index)}
            >
              <SvgIcon path={icons.close} size={14} />
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="btn btn-sm btn-text" disabled={!canAdd} onClick={() => insertAfter(items.length - 1)}>
        <SvgIcon path={icons.add} size={14} />
        {addLabel}
        {max !== undefined && ` (${items.length}/${max})`}
      </button>
    </div>
  );
}
