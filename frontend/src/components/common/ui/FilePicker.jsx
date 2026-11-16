import { useId } from "react";
import { icons } from "../input/icons";
import SvgIcon from "./SvgIcon";

/** 1536 → "1.5 KB" */
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

/**
 * 파일 선택: 숨긴 input + 버튼 모양 label + 고른 파일 이름. 스타일은 styles/choice.css.
 * 고른 파일 목록은 쓰는 쪽이 들고 있다가 FileList로 보여 준다.
 *
 * @param {object} props
 * @param {(files: File[]) => void} props.onSelect
 * @param {string} [props.label="파일 선택"]
 * @param {string} [props.accept]
 * @param {boolean} [props.multiple]
 * @param {string} [props.fileName]  하나만 고르는 경우 옆에 보일 이름 (없으면 "선택한 파일 없음")
 * @param {boolean} [props.disabled]
 */
export default function FilePicker({ onSelect, label = "파일 선택", accept, multiple = false, fileName, disabled = false, id }) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className="file-picker">
      <input
        id={inputId}
        type="file"
        className="visually-hidden"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          onSelect([...e.target.files]);
          e.target.value = ""; // 같은 파일을 다시 골라도 onChange가 오게
        }}
      />
      <label htmlFor={inputId} className="btn" aria-disabled={disabled || undefined}>
        <SvgIcon path={icons.add} />
        {label}
      </label>
      {!multiple && <span className="file-picker-name">{fileName}</span>}
    </div>
  );
}

/**
 * 첨부 파일 칩 목록.
 * @param {{ files: { key: string, name: string, size?: number, href?: string }[], onRemove?: (file) => void }} props
 *  - href가 있으면 이름이 내려받기 링크, onRemove가 있으면 지우기 버튼
 */
export function FileList({ files, onRemove }) {
  if (files.length === 0) return null;
  return (
    <ul className="file-list">
      {files.map((file) => (
        <li key={file.key} className="file-chip">
          {file.href ? (
            <a href={file.href} download>
              {file.name}
            </a>
          ) : (
            <span>{file.name}</span>
          )}
          {file.size != null && <span className="file-chip-size">{formatFileSize(file.size)}</span>}
          {onRemove && (
            <button type="button" aria-label={`${file.name} 지우기`} onClick={() => onRemove(file)}>
              <SvgIcon path={icons.close} size={14} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
