import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";

import styles from "./Editor.module.css";
import "./editor/editorContent.css";
import {
  ZWSP,
  applyInlineStyle,
  closestIn,
  createParagraph,
  deserializeRange,
  getCodeText,
  hasTextAfter,
  insertBlock,
  insertParagraphAfter,
  insertTextAtRange,
  normalizeHttpUrl,
  placeCaret,
  serializeRange,
  toElement,
  unwrap,
} from "./editor/editorDom";
import {
  createTable,
  deleteColumn,
  deleteRow,
  getCellsInRange,
  insertColumn,
  insertRow,
  mergeCells,
  splitCell,
} from "./editor/editorTable";

/** 기본 허용 확장자 · 최대 크기 (서버 검증 기준과 맞춰서 props 로 변경 가능) */
const DEFAULT_ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "pdf",
  "zip",
  "docx",
  "xlsx",
  "pptx",
  "hwpx",
  "doc",
  "xls",
  "ppt",
  "hwp",
  "txt",
  "csv",
];
const DEFAULT_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

/** 본문에 삽입되는 첨부 파일 링크 class (서버 Sanitizer 허용 class 와 같아야 함) */
const FILE_LINK_CLASS = "editor-file";

const HISTORY_LIMIT = 100;
const TYPING_SNAPSHOT_DELAY = 500;
const TABLE_PICKER_SIZE = 8;

const BLOCK_TYPES = [
  { value: "p", label: "본문" },
  { value: "h1", label: "제목 1" },
  { value: "h2", label: "제목 2" },
  { value: "h3", label: "제목 3" },
  { value: "h4", label: "제목 4" },
  { value: "h5", label: "제목 5" },
  { value: "h6", label: "제목 6" },
];

const FONT_FAMILIES = [
  { value: "", label: "기본 글꼴" },
  { value: "'Malgun Gothic', sans-serif", label: "맑은 고딕" },
  { value: "Dotum, sans-serif", label: "돋움" },
  { value: "Gulim, sans-serif", label: "굴림" },
  { value: "Batang, serif", label: "바탕" },
  { value: "Gungsuh, serif", label: "궁서" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'Times New Roman', serif", label: "Times New Roman" },
  { value: "'Courier New', monospace", label: "Courier New" },
];

const FONT_SIZES = [
  "",
  "10px",
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "28px",
  "32px",
  "36px",
  "48px",
];

const TEXT_COLORS = [
  "#000000",
  "#434343",
  "#666666",
  "#999999",
  "#cccccc",
  "#ffffff",
  "#c62828",
  "#e65100",
  "#f9a825",
  "#2e7d32",
  "#00838f",
  "#1565c0",
  "#6a1b9a",
  "#ad1457",
  "#ef9a9a",
  "#ffcc80",
  "#fff59d",
  "#a5d6a7",
  "#80deea",
  "#90caf9",
  "#ce93d8",
];

const HIGHLIGHT_COLORS = [
  "#fff59d",
  "#ffe082",
  "#ffcc80",
  "#ef9a9a",
  "#f8bbd0",
  "#ce93d8",
  "#90caf9",
  "#80deea",
  "#a5d6a7",
  "#e0e0e0",
];

const BOX_COLORS = [
  { value: "", label: "기본" },
  { value: "#fff8e1", label: "노랑" },
  { value: "#e3f2fd", label: "파랑" },
  { value: "#e8f5e9", label: "초록" },
  { value: "#fce4ec", label: "분홍" },
  { value: "#f3e5f5", label: "보라" },
];

const CODE_LANGUAGES = [
  "plaintext",
  "javascript",
  "typescript",
  "java",
  "python",
  "html",
  "css",
  "sql",
  "json",
  "xml",
  "yaml",
  "bash",
  "c",
  "cpp",
  "csharp",
];

const IMAGE_WIDTHS = [
  { value: "", label: "원본 크기" },
  { value: "25%", label: "25%" },
  { value: "50%", label: "50%" },
  { value: "75%", label: "75%" },
  { value: "100%", label: "100%" },
];

const FLEX_GAPS = ["0px", "8px", "16px", "24px", "32px"];
const FLOAT_WIDTHS = ["30%", "40%", "50%"];

const ALIGN_COMMANDS = {
  left: "justifyLeft",
  center: "justifyCenter",
  right: "justifyRight",
  justify: "justifyFull",
};

const INITIAL_FORMATS = {
  block: "p",
  fontFamily: "",
  fontSize: "",
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  align: "left",
  color: "",
  backColor: "",
  ul: false,
  ol: false,
  quote: false,
};

const EMPTY_CONTEXT = {
  table: null,
  cell: null,
  cellCount: 0,
  flex: null,
  flexItem: null,
  box: null,
  details: null,
  code: null,
  link: null,
  list: null,
};

const getExtension = (fileName) => {
  const index = fileName.lastIndexOf(".");
  return index < 0 ? "" : fileName.slice(index + 1).toLowerCase();
};

const formatFileSize = (size) => {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)}MB`;
  if (size >= 1024) return `${Math.ceil(size / 1024)}KB`;
  return `${size}B`;
};

const normalizeFontFamily = (value) =>
  (value ?? "")
    .replace(/["']/g, "")
    .replace(/\s*,\s*/g, ",")
    .trim()
    .toLowerCase();

/** 두 CSS 색상 값이 같은 색인지 (#hex ↔ rgb() 비교) */
const isSameColor = (a, b) => {
  if (!a || !b) return false;
  const probe = document.createElement("span");
  probe.style.color = a;
  const first = probe.style.color;
  probe.style.color = b;
  return first === probe.style.color;
};

const queryState = (command) => {
  try {
    return document.queryCommandState(command);
  } catch {
    return false;
  }
};

/** 가장 가까운 조상의 인라인 스타일 값 (레거시 <font> 속성 포함) */
const getInlineValue = (node, root, property) => {
  const fontAttribute = { "font-family": "face", color: "color" }[property];
  let element = toElement(node);
  while (element && element !== root) {
    const value = element.style?.getPropertyValue(property);
    if (value) return value;
    if (element.tagName === "FONT" && fontAttribute && element.getAttribute(fontAttribute)) {
      return element.getAttribute(fontAttribute);
    }
    element = element.parentElement;
  }
  return "";
};

/** 외부 이미지 URL 을 실제로 불러올 수 있는지 확인 */
const preloadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const timer = setTimeout(() => reject(new Error("timeout")), 8000);
    image.onload = () => {
      clearTimeout(timer);
      resolve();
    };
    image.onerror = () => {
      clearTimeout(timer);
      reject(new Error("load error"));
    };
    image.src = src;
  });

// ======================================================================
// 툴바 아이콘 (24x24, currentColor)
// ======================================================================
function SvgIcon({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const ICONS = {
  alignLeft: <path d="M4 6h16M4 10h10M4 14h16M4 18h10" />,
  alignCenter: <path d="M4 6h16M7 10h10M4 14h16M7 18h10" />,
  alignRight: <path d="M4 6h16M10 10h10M4 14h16M10 18h10" />,
  alignJustify: <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
  textColor: <path d="M6 15L12 3l6 12M8.2 11h7.6" />,
  highlight: (
    <>
      <path d="M15 4l5 5-8 8H7v-5z" />
      <path d="M4 20h7" />
    </>
  ),
  bulletList: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <circle cx="4.5" cy="6" r="1" />
      <circle cx="4.5" cy="12" r="1" />
      <circle cx="4.5" cy="18" r="1" />
    </>
  ),
  numberList: <path d="M10 6h10M10 12h10M10 18h10M4 5h1v4M4 9h2M6 19H4c0-1 2-1.6 2-2.6S5.2 15 4 15.5" />,
  indent: <path d="M3 8l4 4-4 4M11 6h10M11 12h10M11 18h10" />,
  outdent: <path d="M7 8l-4 4 4 4M11 6h10M11 12h10M11 18h10" />,
  quote: <path d="M5 8h5v5c0 2.5-1.6 4-4 5M14 8h5v5c0 2.5-1.6 4-4 5" />,
  divider: <path d="M3 12h18M7 7h10M7 17h10" />,
  table: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M3 10h18M3 15h18M9 4v16M15 4v16" />
    </>
  ),
  flex: (
    <>
      <rect x="3" y="5" width="8" height="14" rx="1" />
      <rect x="13" y="5" width="8" height="14" rx="1" />
    </>
  ),
  textBox: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 10h10M7 14h6" />
    </>
  ),
  floatLeft: (
    <>
      <rect x="3" y="4" width="8" height="8" rx="1" />
      <path d="M14 5h7M14 9h7M3 16h18M3 20h14" />
    </>
  ),
  floatRight: (
    <>
      <rect x="13" y="4" width="8" height="8" rx="1" />
      <path d="M3 5h7M3 9h7M3 16h18M3 20h14" />
    </>
  ),
  details: <path d="M4 5l4 3-4 3zM12 8h8M4 15h16M4 19h12" />,
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </>
  ),
  imageUrl: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  attach: (
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
    </>
  ),
  code: <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" />,
  undo: (
    <>
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </>
  ),
  redo: (
    <>
      <path d="M15 14l5-5-5-5" />
      <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
    </>
  ),
};

// ======================================================================
// 툴바 구성 요소
// ======================================================================

/** 마우스를 올리거나 키보드로 포커스하면 표시되는 설명 */
function Tooltip({ label, description }) {
  return (
    <span className={styles.tooltip} role="tooltip">
      <strong>{label}</strong>
      {description && <span>{description}</span>}
    </span>
  );
}

/** 툴바 버튼. mousedown 기본 동작을 막아 에디터의 선택 영역이 사라지지 않게 한다 */
function ToolbarButton({
  label,
  description,
  active = false,
  disabled,
  onClick,
  children,
  ...rest
}) {
  return (
    <span className={styles.tooltipHost}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        className={`${styles.toolbarButton} ${active ? styles.active : ""}`}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onClick}
        disabled={disabled}
        {...rest}
      >
        {children}
      </button>
      <Tooltip label={label} description={description} />
    </span>
  );
}

function ToolbarSelect({ label, description, value, disabled, onChange, options, width }) {
  return (
    <span className={styles.tooltipHost}>
      <select
        aria-label={label}
        className={styles.select}
        style={{ width }}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Tooltip label={label} description={description} />
    </span>
  );
}

/** 컨텍스트 바(표 · 블록 · 이미지 편집) 버튼 */
function ContextButton({ label, description, danger = false, active = false, disabled, onClick }) {
  return (
    <span className={styles.tooltipHost}>
      <button
        type="button"
        className={`${styles.contextButton} ${danger ? styles.danger : ""} ${active ? styles.active : ""}`}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onClick}
        disabled={disabled}
        aria-pressed={active}
      >
        {label}
      </button>
      {description && <Tooltip label={label} description={description} />}
    </span>
  );
}

function ColorPalette({ colors, value, clearLabel, onSelect }) {
  const [customColor, setCustomColor] = useState(value?.startsWith("#") ? value : "#c62828");

  return (
    <div className={styles.palette}>
      <div className={styles.swatches}>
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            className={styles.swatch}
            style={{ backgroundColor: color }}
            aria-label={color}
            title={color}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(color)}
          />
        ))}
      </div>
      <div className={styles.paletteRow}>
        <button
          type="button"
          className={styles.contextButton}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onSelect("")}
        >
          {clearLabel}
        </button>
        <label className={styles.customColor}>
          사용자 지정
          <input
            type="color"
            value={customColor}
            onChange={(event) => setCustomColor(event.target.value)}
          />
        </label>
        <button
          type="button"
          className={styles.contextButton}
          onClick={() => onSelect(customColor)}
        >
          적용
        </button>
      </div>
      <p className={styles.paletteCurrent}>
        현재 색상
        <span
          className={styles.currentSwatch}
          style={{ backgroundColor: value || "transparent" }}
        />
        {value || "없음"}
      </p>
    </div>
  );
}

function TablePicker({ onSelect }) {
  const [hover, setHover] = useState({ rows: 0, cols: 0 });
  const [size, setSize] = useState({ rows: 3, cols: 3 });

  const indexes = Array.from({ length: TABLE_PICKER_SIZE }, (_, index) => index + 1);
  const cells = indexes.flatMap((r) =>
    indexes.map((c) => (
      <button
        key={`${r}-${c}`}
        type="button"
        tabIndex={-1}
        className={`${styles.pickerCell} ${r <= hover.rows && c <= hover.cols ? styles.pickerCellActive : ""}`}
        aria-label={`${r}행 ${c}열`}
        onMouseEnter={() => setHover({ rows: r, cols: c })}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onSelect(r, c)}
      />
    )),
  );

  const clamp = (value) => Math.min(Math.max(Number(value) || 1, 1), 20);

  return (
    <div className={styles.tablePicker}>
      <div
        className={styles.pickerGrid}
        style={{ gridTemplateColumns: `repeat(${TABLE_PICKER_SIZE}, 18px)` }}
        onMouseLeave={() => setHover({ rows: 0, cols: 0 })}
      >
        {cells}
      </div>
      <p className={styles.pickerLabel}>
        {hover.rows > 0 ? `${hover.rows} x ${hover.cols} 표` : "행과 열을 선택하세요"}
      </p>
      <div className={styles.paletteRow}>
        <label className={styles.numberField}>
          행
          <input
            type="number"
            min="1"
            max="20"
            value={size.rows}
            onChange={(event) => setSize((prev) => ({ ...prev, rows: clamp(event.target.value) }))}
          />
        </label>
        <label className={styles.numberField}>
          열
          <input
            type="number"
            min="1"
            max="20"
            value={size.cols}
            onChange={(event) => setSize((prev) => ({ ...prev, cols: clamp(event.target.value) }))}
          />
        </label>
        <button
          type="button"
          className={styles.contextButton}
          onClick={() => onSelect(size.rows, size.cols)}
        >
          삽입
        </button>
      </div>
    </div>
  );
}

// ======================================================================
// 에디터
// ======================================================================

/**
 * 공통 에디터 (contentEditable, 외부 에디터 라이브러리 없이 구현)
 *
 * - 서식: 글 유형(본문 · 제목 1~6) · 글꼴 · 글자 크기 · 굵게 · 기울임 · 밑줄 · 취소선 · 정렬 · 글자 색 · 배경 색
 * - 문단: 글머리 기호 · 번호 목록(Tab 으로 중첩) · 인용구 · 구분선
 * - 블록: 표(행 · 열 추가 · 삭제, 셀 병합 · 분할) · Flex 박스 · 텍스트 박스 · 좌/우 띄우기 박스 · 접기/펼치기 · 코드 블록
 * - 이미지 / 파일: 업로드(툴바 · Drag & Drop · 붙여넣기) · 이미지 URL · 크기 · 정렬 · 대체 텍스트
 *   - 이미지: <img data-file-id data-file-name>       (저장 HTML 에서는 src 제거)
 *   - 파일:   <a class="editor-file" data-file-id data-file-name data-file-size>
 * - 링크: 일반 링크 · 미리보기 카드 (onLinkPreview 가 있을 때)
 * - 실행 취소 / 다시 실행 (Ctrl+Z / Ctrl+Y, Mac: ⌘Z / ⌘⇧Z): 에디터 자체 편집 이력
 *
 * @param initialContent   처음 표시할 HTML (수정 화면). 마운트 시 한 번만 반영 (다시 불러오려면 key 변경)
 * @param onLoadFile       (fileId) => Promise<Blob>  첨부 이미지(data-file-id) 표시용
 * @param onLinkPreview    (url) => Promise<{ url, title, description, image, siteName }>
 * @param onReady          초기 내용 반영 완료 시 () => void
 * @param onUploadFile     (file) => Promise<{ fileId, originalFileName, fileSize, image }>
 * @param onUploadDiscard  에디터가 사라진 뒤 업로드가 끝난 파일 정리 (fileInfo) => void
 * @param onFileUploaded   업로드 성공 시 (fileInfo) => void
 * @param onUploadingChange 업로드 진행 여부 (boolean) => void
 * @param onChange         본문 변경 시 (html) => void
 *
 * ref 메서드
 * - getContentHtml(): 저장용 HTML (업로드 중 표시 · 편집용 속성 제거, 첨부 이미지 src 제거, 코드 블록 텍스트화)
 * - isEmpty(): 텍스트 · 이미지 · 첨부 파일 · 표 · 구분선이 모두 없으면 true
 * - focus()
 */
export default function Editor({
  ref,
  disabled = false,
  placeholder = "",
  ariaLabel = "에디터",
  initialContent = "",
  allowedExtensions = DEFAULT_ALLOWED_EXTENSIONS,
  imageExtensions = DEFAULT_IMAGE_EXTENSIONS,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  onChange = () => {},
  onReady = () => {},
  onLoadFile,
  onLinkPreview,
  onUploadFile,
  onUploadDiscard = () => {},
  onFileUploaded = () => {},
  onUploadingChange = () => {},
}) {
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const popoverRef = useRef(null);
  const objectUrlsRef = useRef([]);
  const imageCacheRef = useRef(new Map());
  const loadingImagesRef = useRef(new Set());
  const mountedRef = useRef(true);
  const uploadingCountRef = useRef(0);
  const pendingUploadsRef = useRef(new Set());
  const uploadSeqRef = useRef(0);
  const historyRef = useRef({ stack: [], index: -1 });
  const typingTimerRef = useRef(null);
  const refreshFrameRef = useRef(0);
  const contextRef = useRef(EMPTY_CONTEXT);
  const cellRangeRef = useRef(null);
  const selectedNodeRef = useRef(null);
  const propsRef = useRef({ onChange, onLoadFile, onReady, disabled });
  // 이벤트 · 비동기 콜백에서 최신 props 를 쓰기 위해 렌더 후 갱신
  useLayoutEffect(() => {
    propsRef.current = { onChange, onLoadFile, onReady, disabled };
  });

  const [notice, setNotice] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEmptyContent, setIsEmptyContent] = useState(!initialContent);
  const [formats, setFormats] = useState(INITIAL_FORMATS);
  const [context, setContext] = useState(EMPTY_CONTEXT);
  const [selectedNode, setSelectedNode] = useState(null);
  const [popover, setPopover] = useState(null);
  const [linkForm, setLinkForm] = useState(null);
  const [imageUrlForm, setImageUrlForm] = useState(null);
  const [imageAlt, setImageAlt] = useState("");
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });

  const canUpload = typeof onUploadFile === "function";
  const canPreviewLink = typeof onLinkPreview === "function";

  const showError = (text) => setNotice(text ? { type: "error", text } : null);
  const showInfo = (text) => setNotice(text ? { type: "info", text } : null);

  // ------------------------------------------------------------------
  // 저장용 HTML
  // ------------------------------------------------------------------
  const buildContentClone = () => {
    const clone = editorRef.current.cloneNode(true);
    clone.querySelectorAll("[data-uploading]").forEach((node) => node.remove());
    clone
      .querySelectorAll("[data-cell-selected], [data-node-selected]")
      .forEach((node) => {
        node.removeAttribute("data-cell-selected");
        node.removeAttribute("data-node-selected");
      });
    clone.querySelectorAll("[contenteditable]").forEach((node) => node.removeAttribute("contenteditable"));
    clone.querySelectorAll("img[data-file-id]").forEach((image) => image.removeAttribute("src"));

    // 코드 블록은 텍스트만 저장 (편집용 마지막 줄바꿈 제거)
    clone.querySelectorAll("pre.editor-code").forEach((pre) => {
      let text = getCodeText(pre);
      if (text.endsWith("\n")) text = text.slice(0, -1);
      const code = document.createElement("code");
      code.textContent = text;
      pre.replaceChildren(code);
    });

    // 커서 위치 서식용 공백 문자(ZWSP) · 빈 span 제거
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
    const emptyTexts = [];
    let textNode = walker.nextNode();
    while (textNode) {
      if (textNode.data.includes(ZWSP)) textNode.data = textNode.data.replaceAll(ZWSP, "");
      if (textNode.data === "") emptyTexts.push(textNode);
      textNode = walker.nextNode();
    }
    emptyTexts.forEach((node) => node.remove());
    clone.querySelectorAll("span:empty, b:empty, i:empty, u:empty, s:empty, strike:empty").forEach((node) => node.remove());
    return clone;
  };

  const isCloneEmpty = (clone) =>
    clone.textContent.trim() === "" &&
    !clone.querySelector("img, a[data-file-id], hr, table");

  useImperativeHandle(ref, () => ({
    getContentHtml: () => buildContentClone().innerHTML,
    isEmpty: () => isCloneEmpty(buildContentClone()),
    focus: () => editorRef.current?.focus(),
  }));

  // ------------------------------------------------------------------
  // 변경 알림 · 편집 이력 (Undo / Redo)
  // ------------------------------------------------------------------
  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) return;
    setIsEmptyContent(
      editor.textContent.replaceAll(ZWSP, "").trim() === "" &&
        !editor.querySelector("img, a[data-file-id], [data-uploading], hr, table"),
    );
    propsRef.current.onChange(editor.innerHTML);
  };

  const getSelectionRange = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    return editorRef.current?.contains(range.commonAncestorContainer) ? range : null;
  };

  const takeSnapshot = () => {
    const editor = editorRef.current;
    const clone = editor.cloneNode(true);
    clone
      .querySelectorAll("[data-cell-selected], [data-node-selected]")
      .forEach((node) => {
        node.removeAttribute("data-cell-selected");
        node.removeAttribute("data-node-selected");
      });
    // 첨부 이미지 src(Blob URL)는 이력에 넣지 않고 복원 시 캐시에서 다시 채운다
    clone.querySelectorAll("img[data-file-id]").forEach((image) => image.removeAttribute("src"));
    return {
      html: clone.innerHTML,
      selection: serializeRange(editor, getSelectionRange() ?? savedRangeRef.current),
    };
  };

  const updateHistoryState = () => {
    const { stack, index } = historyRef.current;
    setHistoryState({ canUndo: index > 0, canRedo: index < stack.length - 1 });
  };

  const recordHistory = () => {
    if (!editorRef.current) return;
    const history = historyRef.current;
    const snapshot = takeSnapshot();
    const top = history.stack[history.index];
    if (top && top.html === snapshot.html) {
      top.selection = snapshot.selection;
      return;
    }
    history.stack = history.stack.slice(0, history.index + 1);
    history.stack.push(snapshot);
    if (history.stack.length > HISTORY_LIMIT) history.stack.shift();
    history.index = history.stack.length - 1;
    updateHistoryState();
  };

  const flushTyping = () => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
      recordHistory();
    }
  };

  const scheduleTypingSnapshot = () => {
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      typingTimerRef.current = null;
      recordHistory();
    }, TYPING_SNAPSHOT_DELAY);
  };

  // 첨부 이미지(data-file-id)를 Blob URL 로 표시 (캐시 우선)
  const hydrateImages = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.querySelectorAll("img[data-file-id]").forEach((image) => {
      const { fileId } = image.dataset;
      const cached = imageCacheRef.current.get(fileId);
      if (cached) {
        if (image.getAttribute("src") !== cached) image.src = cached;
        return;
      }
      const loadFile = propsRef.current.onLoadFile;
      if (!loadFile || loadingImagesRef.current.has(fileId)) return;

      loadingImagesRef.current.add(fileId);
      loadFile(fileId)
        .then((blob) => {
          if (!mountedRef.current) return;
          const url = URL.createObjectURL(blob);
          objectUrlsRef.current.push(url);
          imageCacheRef.current.set(fileId, url);
          editorRef.current
            ?.querySelectorAll(`img[data-file-id="${CSS.escape(fileId)}"]`)
            .forEach((target) => {
              target.src = url;
            });
        })
        .catch(() => {
          image.alt = `${image.dataset.fileName ?? "이미지"} (불러오기 실패)`;
        })
        .finally(() => loadingImagesRef.current.delete(fileId));
    });
  };

  const clearNodeSelection = () => {
    selectedNodeRef.current?.removeAttribute("data-node-selected");
    selectedNodeRef.current = null;
    setSelectedNode(null);
  };

  const applySnapshot = (snapshot) => {
    const editor = editorRef.current;
    clearNodeSelection();
    editor.innerHTML = snapshot.html;
    // 이미 끝난 업로드의 "업로드 중" 표시는 되살리지 않는다
    editor.querySelectorAll("[data-uploading]").forEach((node) => {
      if (!pendingUploadsRef.current.has(node.dataset.uploading)) node.remove();
    });
    hydrateImages();

    editor.focus({ preventScroll: true });
    const range = deserializeRange(editor, snapshot.selection);
    if (range) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      savedRangeRef.current = range.cloneRange();
    }
    emitChange();
    refreshState();
    updateHistoryState();
  };

  const undo = () => {
    if (propsRef.current.disabled) return;
    flushTyping();
    const history = historyRef.current;
    if (history.index <= 0) return;
    history.index -= 1;
    applySnapshot(history.stack[history.index]);
  };

  const redo = () => {
    if (propsRef.current.disabled) return;
    flushTyping();
    const history = historyRef.current;
    if (history.index >= history.stack.length - 1) return;
    history.index += 1;
    applySnapshot(history.stack[history.index]);
  };

  // ------------------------------------------------------------------
  // 툴바 상태 (현재 서식 · 커서 위치의 블록)
  // ------------------------------------------------------------------
  const clearCellMarks = () => {
    editorRef.current
      ?.querySelectorAll("[data-cell-selected]")
      .forEach((cell) => cell.removeAttribute("data-cell-selected"));
  };

  const refreshState = () => {
    const editor = editorRef.current;
    const range = savedRangeRef.current;
    if (!editor || !range || !editor.contains(range.commonAncestorContainer)) return;

    const anchor = toElement(range.startContainer);
    const block = closestIn(range.startContainer, "p,h1,h2,h3,h4,h5,h6,li,td,th,pre,summary,div", editor);
    const heading = closestIn(range.startContainer, "h1,h2,h3,h4,h5,h6", editor);
    const alignValue = block ? getComputedStyle(block).textAlign : "left";

    setFormats({
      block: heading ? heading.tagName.toLowerCase() : "p",
      fontFamily: getInlineValue(anchor, editor, "font-family"),
      fontSize: getInlineValue(anchor, editor, "font-size"),
      bold: queryState("bold"),
      italic: queryState("italic"),
      underline: queryState("underline"),
      strikeThrough: queryState("strikeThrough"),
      align: { start: "left", end: "right" }[alignValue] ?? alignValue,
      color: getInlineValue(anchor, editor, "color"),
      backColor: getInlineValue(anchor, editor, "background-color"),
      ul: queryState("insertUnorderedList"),
      ol: queryState("insertOrderedList"),
      quote: Boolean(closestIn(range.startContainer, "blockquote", editor)),
    });

    // 표: 시작 셀 ~ 끝 셀이 같은 표에 있으면 범위 표시 (셀 병합 대상)
    clearCellMarks();
    const cell = closestIn(range.startContainer, "td,th", editor);
    const endCell = closestIn(range.endContainer, "td,th", editor);
    const table = cell?.closest("table") ?? null;
    let cellCount = cell ? 1 : 0;
    cellRangeRef.current = null;
    if (cell && endCell && endCell !== cell && endCell.closest("table") === table) {
      const cells = getCellsInRange(table, cell, endCell);
      cells.forEach((item) => item.setAttribute("data-cell-selected", "true"));
      cellCount = cells.length;
      cellRangeRef.current = { start: cell, end: endCell };
    }

    const flexItem = closestIn(range.startContainer, ".editor-flex-item", editor);
    const link = closestIn(range.startContainer, "a", editor);

    const nextContext = {
      table,
      cell,
      cellCount,
      flex: flexItem?.closest(".editor-flex") ?? null,
      flexItem,
      box: closestIn(range.startContainer, ".editor-textbox,.editor-float-left,.editor-float-right", editor),
      details: closestIn(range.startContainer, "details.editor-details", editor),
      code: closestIn(range.startContainer, "pre.editor-code", editor),
      link:
        link && !link.classList.contains(FILE_LINK_CLASS) && !link.closest(".editor-link-card")
          ? link
          : null,
      list: closestIn(range.startContainer, "li", editor),
    };
    contextRef.current = nextContext;
    setContext(nextContext);
  };

  const scheduleRefresh = () => {
    cancelAnimationFrame(refreshFrameRef.current);
    refreshFrameRef.current = requestAnimationFrame(refreshState);
  };

  // ------------------------------------------------------------------
  // 선택 영역 저장 · 복원 (툴바 클릭 · 팝업 입력 · 파일 선택창으로 포커스가 이동해도 커서 위치 유지)
  // ------------------------------------------------------------------
  const setSelectionRange = (range) => {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    savedRangeRef.current = range.cloneRange();
  };

  const saveSelection = () => {
    const range = getSelectionRange();
    if (range) {
      savedRangeRef.current = range.cloneRange();
      scheduleRefresh();
    }
  };

  const restoreSelection = () => {
    const editor = editorRef.current;
    editor.focus({ preventScroll: true });

    let range = savedRangeRef.current;
    if (!range || !editor.contains(range.commonAncestorContainer)) {
      // 저장된 커서가 없으면 본문 끝
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }
    setSelectionRange(range);
    return range;
  };

  const afterChange = () => {
    recordHistory();
    emitChange();
    refreshState();
  };

  /**
   * 편집 명령 실행: 이력 저장 → 선택 영역 복원 → action → 변경 알림
   * action 이 Range 를 반환하면 그 위치를 선택한다.
   */
  const runCommand = (action) => {
    if (disabled || !editorRef.current) return;
    flushTyping();
    const range = restoreSelection();
    const result = action(range, editorRef.current);
    if (result instanceof Range) {
      setSelectionRange(result);
    } else {
      const current = getSelectionRange();
      if (current) savedRangeRef.current = current.cloneRange();
    }
    afterChange();
  };

  /** 선택 영역과 무관한 DOM 변경 (이미지 크기 · 블록 속성 등) */
  const mutate = (action) => {
    if (disabled || !editorRef.current) return;
    flushTyping();
    action(editorRef.current);
    afterChange();
  };

  const execute = (command, value = null) =>
    runCommand(() => {
      document.execCommand(command, false, value);
    });

  const caretIn = (node, atEnd = false) => placeCaret(document.createRange(), node, atEnd);

  // ------------------------------------------------------------------
  // 초기화 · 정리
  // ------------------------------------------------------------------
  useEffect(() => {
    mountedRef.current = true;
    const editor = editorRef.current;
    const objectUrls = objectUrlsRef.current;

    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch {
      // 지원하지 않는 브라우저는 기본 동작 사용
    }

    // 수정 화면: 기존 HTML 복원 (편집용 속성 · 코드 블록 · 첨부 이미지 표시)
    editor.innerHTML = initialContent || "";
    editor
      .querySelectorAll(".editor-link-card")
      .forEach((card) => card.setAttribute("contenteditable", "false"));
    editor.querySelectorAll("pre.editor-code").forEach((pre) => {
      const code = document.createElement("code");
      code.textContent = `${getCodeText(pre)}\n`;
      pre.replaceChildren(code);
    });
    if (!editor.firstChild) editor.appendChild(createParagraph());
    hydrateImages();

    historyRef.current = { stack: [], index: -1 };
    recordHistory();
    emitChange();
    propsRef.current.onReady();

    const handleSelectionChange = () => {
      const range = getSelectionRange();
      if (!range) return;
      savedRangeRef.current = range.cloneRange();
      scheduleRefresh();
    };
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      mountedRef.current = false;
      document.removeEventListener("selectionchange", handleSelectionChange);
      clearTimeout(typingTimerRef.current);
      cancelAnimationFrame(refreshFrameRef.current);
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
    // initialContent 는 마운트 시 한 번만 반영 (다시 불러올 때는 key 를 바꿔 다시 마운트)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 팝업: 바깥 클릭 · Esc 로 닫기
  useEffect(() => {
    if (!popover) return undefined;

    const handleMouseDown = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setPopover(null);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setPopover(null);
        editorRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [popover]);

  const togglePopover = (name) => {
    saveSelection();
    setPopover((current) => (current === name ? null : name));
  };

  // ------------------------------------------------------------------
  // 글 유형 · 글꼴 · 색상 · 인용구
  // ------------------------------------------------------------------
  const handleBlockType = (tag) => execute("formatBlock", `<${tag}>`);

  const applyStyle = (property, value) =>
    runCommand((range, editor) => applyInlineStyle(editor, range, property, value));

  const handleColor = (property, value) => {
    setPopover(null);
    applyStyle(property, value);
  };

  const toggleQuote = () =>
    runCommand((range, editor) => {
      const quote = closestIn(range.startContainer, "blockquote", editor);
      if (!quote) {
        document.execCommand("formatBlock", false, "<blockquote>");
        return undefined;
      }

      const { startContainer, startOffset } = range;
      const hasBlockChild = Array.from(quote.children).some((child) =>
        /^(P|H[1-6]|UL|OL|DIV|TABLE|PRE)$/.test(child.tagName),
      );
      if (hasBlockChild) {
        unwrap(quote);
      } else {
        const paragraph = document.createElement("p");
        while (quote.firstChild) paragraph.appendChild(quote.firstChild);
        quote.replaceWith(paragraph);
      }
      if (!editor.contains(startContainer)) return undefined;
      const next = document.createRange();
      next.setStart(startContainer, startOffset);
      next.collapse(true);
      return next;
    });

  // ------------------------------------------------------------------
  // 블록 삽입 · 공통 블록 편집
  // ------------------------------------------------------------------
  const insertBlockElement = (node, getCaretTarget) =>
    runCommand((range, editor) => {
      insertBlock(editor, range, node);
      return caretIn(getCaretTarget(node));
    });

  const deleteBlock = (element) =>
    runCommand((_range, editor) => {
      if (!element || !editor.contains(element)) return undefined;
      const next = element.nextElementSibling ?? element.previousElementSibling;
      const parent = element.parentNode;
      element.remove();
      if (selectedNodeRef.current === element) clearNodeSelection();
      if (next) return caretIn(next);
      const paragraph = createParagraph();
      parent.appendChild(paragraph);
      return caretIn(paragraph);
    });

  const addParagraphAfter = (element) =>
    runCommand((_range, editor) => {
      if (!element || !editor.contains(element)) return undefined;
      return caretIn(insertParagraphAfter(element));
    });

  const createDiv = (className, children = [createParagraph()]) => {
    const div = document.createElement("div");
    div.className = className;
    children.forEach((child) => div.appendChild(child));
    return div;
  };

  // 표
  const handleInsertTable = (rows, cols) => {
    setPopover(null);
    insertBlockElement(createTable(rows, cols), (table) => table.rows[0].cells[0]);
  };

  const runTableAction = (action) =>
    runCommand(() => {
      const { table, cell } = contextRef.current;
      if (!table || !cell) {
        showError("표 안에 커서를 두고 실행하세요.");
        return undefined;
      }
      const next = table.nextElementSibling;
      const result = action(table, cell);
      if (!result.ok) {
        showError(result.message);
        return undefined;
      }
      showError("");
      if (result.focus) return caretIn(result.focus);
      if (result.removed && next) return caretIn(next);
      return undefined;
    });

  const handleMergeCells = () =>
    runTableAction((table) =>
      mergeCells(table, cellRangeRef.current?.start, cellRangeRef.current?.end),
    );

  // Flex 박스
  const handleInsertFlex = () => {
    const flex = createDiv("editor-flex", [
      createDiv("editor-flex-item"),
      createDiv("editor-flex-item"),
    ]);
    flex.style.gap = "16px";
    insertBlockElement(flex, (node) => node.querySelector("p"));
  };

  const handleAddFlexItem = () =>
    runCommand(() => {
      const { flexItem } = contextRef.current;
      if (!flexItem) return undefined;
      const item = createDiv("editor-flex-item");
      flexItem.after(item);
      return caretIn(item.firstChild);
    });

  const handleRemoveFlexItem = () => {
    const { flex, flexItem } = contextRef.current;
    if (!flex || !flexItem) return;
    if (flex.querySelectorAll(":scope > .editor-flex-item").length <= 1) {
      deleteBlock(flex);
      return;
    }
    runCommand(() => {
      const sibling = flexItem.nextElementSibling ?? flexItem.previousElementSibling;
      flexItem.remove();
      return sibling ? caretIn(sibling, true) : undefined;
    });
  };

  // 텍스트 박스 · 띄우기 박스 · 접기/펼치기 · 코드 블록
  const handleInsertBox = (className) =>
    insertBlockElement(createDiv(className), (node) => node.firstChild);

  const handleInsertDetails = () => {
    const details = document.createElement("details");
    details.className = "editor-details";
    details.open = true;
    const summary = document.createElement("summary");
    summary.textContent = "제목";
    details.appendChild(summary);
    details.appendChild(createDiv("editor-details-body"));
    runCommand((range, editor) => {
      insertBlock(editor, range, details);
      const next = document.createRange();
      next.selectNodeContents(summary);
      return next;
    });
  };

  const handleInsertCode = () =>
    runCommand((range, editor) => {
      const selectedText = range.collapsed ? "" : range.toString();
      if (!range.collapsed) range.deleteContents();
      const pre = document.createElement("pre");
      pre.className = "editor-code";
      pre.dataset.language = "plaintext";
      const code = document.createElement("code");
      code.textContent = `${selectedText}\n`;
      pre.appendChild(code);
      insertBlock(editor, range, pre);
      const next = document.createRange();
      next.setStart(code.firstChild, selectedText.length);
      next.collapse(true);
      return next;
    });

  // ------------------------------------------------------------------
  // 링크
  // ------------------------------------------------------------------
  const openLinkForm = () => {
    if (disabled) return;
    saveSelection();
    const range = savedRangeRef.current;
    const { link } = contextRef.current;
    setLinkForm(
      link
        ? { url: link.getAttribute("href") ?? "", text: link.textContent, card: false, editing: link, error: "", loading: false }
        : { url: "https://", text: range && !range.collapsed ? range.toString() : "", card: false, editing: null, error: "", loading: false },
    );
    setPopover("link");
  };

  const createLinkCard = (preview) => {
    const card = document.createElement("div");
    card.className = "editor-link-card";
    card.setAttribute("contenteditable", "false");

    const anchor = document.createElement("a");
    anchor.href = preview.url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";

    const image = normalizeHttpUrl(preview.image, { httpsOnly: true });
    if (image) {
      const thumbnail = document.createElement("img");
      thumbnail.className = "editor-link-card-thumb";
      thumbnail.src = image;
      thumbnail.alt = "";
      anchor.appendChild(thumbnail);
    }

    const body = document.createElement("span");
    body.className = "editor-link-card-body";
    const addText = (className, text) => {
      if (!text) return;
      const span = document.createElement("span");
      span.className = className;
      span.textContent = text;
      body.appendChild(span);
    };
    addText("editor-link-card-title", preview.title || preview.url);
    addText("editor-link-card-desc", preview.description);
    addText("editor-link-card-url", preview.siteName ? `${preview.siteName} · ${preview.url}` : preview.url);
    anchor.appendChild(body);
    card.appendChild(anchor);
    return card;
  };

  const insertPlainLink = (url, text) =>
    runCommand((range, editor) => {
      if (!range.collapsed && text === range.toString()) {
        document.execCommand("createLink", false, url);
        editor.querySelectorAll("a[href]").forEach((anchor) => {
          if (anchor.getAttribute("href") === url) {
            anchor.target = "_blank";
            anchor.rel = "noopener noreferrer";
          }
        });
        return undefined;
      }
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = text;
      range.deleteContents();
      range.insertNode(anchor);
      const next = document.createRange();
      next.setStartAfter(anchor);
      next.collapse(true);
      return next;
    });

  const handleSubmitLink = async (event) => {
    event.preventDefault();
    if (!linkForm || linkForm.loading) return;

    const url = normalizeHttpUrl(linkForm.url);
    if (!url) {
      setLinkForm((prev) => ({ ...prev, error: "http:// 또는 https:// 로 시작하는 올바른 주소를 입력하세요." }));
      return;
    }
    const text = linkForm.text.trim() || url;

    // 기존 링크 수정 (주소 · 표시 텍스트)
    if (linkForm.editing) {
      const anchor = linkForm.editing;
      setPopover(null);
      runCommand((_range, editor) => {
        if (!editor.contains(anchor)) return undefined;
        anchor.href = url;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        if (anchor.textContent !== text) anchor.textContent = text;
        const next = document.createRange();
        next.setStartAfter(anchor);
        next.collapse(true);
        return next;
      });
      return;
    }

    if (!linkForm.card) {
      setPopover(null);
      insertPlainLink(url, text);
      return;
    }

    // 미리보기 카드: 서버에서 안전하게 조회, 실패하면 일반 링크로 대체
    setLinkForm((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const preview = await onLinkPreview(url);
      if (!mountedRef.current) return;
      setPopover(null);
      runCommand((range, editor) => {
        const card = createLinkCard({ ...preview, url });
        insertBlock(editor, range, card);
        return caretIn(card.nextElementSibling ?? card);
      });
      showError("");
    } catch (error) {
      if (!mountedRef.current) return;
      setPopover(null);
      insertPlainLink(url, text);
      showInfo(`미리보기를 가져올 수 없어 일반 링크로 삽입했습니다. (${error.message})`);
    }
  };

  const handleUnlink = () =>
    runCommand(() => {
      const { link } = contextRef.current;
      if (!link) return undefined;
      const first = link.firstChild;
      const last = link.lastChild;
      unwrap(link);
      if (!first) return undefined;
      const next = document.createRange();
      next.setStartBefore(first);
      next.setEndAfter(last);
      return next;
    });

  // ------------------------------------------------------------------
  // 이미지 (URL 삽입 · 선택 · 크기 · 정렬 · 대체 텍스트)
  // ------------------------------------------------------------------
  const openImageUrlForm = () => {
    if (disabled) return;
    saveSelection();
    setImageUrlForm({ url: "https://", alt: "", error: "", loading: false });
    setPopover("imageUrl");
  };

  const handleSubmitImageUrl = async (event) => {
    event.preventDefault();
    if (!imageUrlForm || imageUrlForm.loading) return;

    const url = normalizeHttpUrl(imageUrlForm.url, { httpsOnly: true });
    if (!url) {
      setImageUrlForm((prev) => ({ ...prev, error: "https:// 로 시작하는 이미지 주소만 삽입할 수 있습니다." }));
      return;
    }

    setImageUrlForm((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      await preloadImage(url);
    } catch {
      if (mountedRef.current) {
        setImageUrlForm((prev) => ({ ...prev, loading: false, error: "이미지를 불러올 수 없는 주소입니다." }));
      }
      return;
    }
    if (!mountedRef.current) return;

    setPopover(null);
    runCommand((range) => {
      const image = document.createElement("img");
      image.src = url;
      image.alt = imageUrlForm.alt.trim();
      range.deleteContents();
      range.insertNode(image);
      const next = document.createRange();
      next.setStartAfter(image);
      next.collapse(true);
      return next;
    });
  };

  const selectNode = (node) => {
    if (selectedNodeRef.current === node) return;
    selectedNodeRef.current?.removeAttribute("data-node-selected");
    selectedNodeRef.current = node;
    node.setAttribute("data-node-selected", "true");
    setSelectedNode(node);
    if (node.tagName === "IMG") setImageAlt(node.getAttribute("alt") ?? "");
  };

  const updateSelectedImage = (action) =>
    mutate((editor) => {
      const image = selectedNodeRef.current;
      if (image && editor.contains(image)) action(image);
    });

  const handleImageWidth = (width) =>
    updateSelectedImage((image) => {
      if (width) image.style.width = width;
      else image.style.removeProperty("width");
      if (image.getAttribute("style") === "") image.removeAttribute("style");
    });

  const handleImageAlign = (align) =>
    updateSelectedImage((image) => {
      image.classList.remove("editor-img-left", "editor-img-center", "editor-img-right");
      if (align) image.classList.add(`editor-img-${align}`);
      if (image.classList.length === 0) image.removeAttribute("class");
    });

  const handleDeleteSelectedNode = () => {
    const node = selectedNodeRef.current;
    if (!node) return;
    mutate((editor) => {
      if (editor.contains(node)) node.remove();
      clearNodeSelection();
    });
  };

  // ------------------------------------------------------------------
  // 파일 업로드
  // ------------------------------------------------------------------
  const validateFile = (file) => {
    if (!allowedExtensions.includes(getExtension(file.name))) {
      return `업로드할 수 없는 파일 형식입니다. (${file.name})`;
    }
    if (file.size > maxFileSize) {
      return `파일 크기는 ${formatFileSize(maxFileSize)} 이하만 업로드할 수 있습니다. (${file.name})`;
    }
    if (file.size === 0) {
      return `빈 파일은 업로드할 수 없습니다. (${file.name})`;
    }
    return null;
  };

  const createFileLink = (fileInfo) => {
    const link = document.createElement("a");
    link.className = FILE_LINK_CLASS;
    link.dataset.fileId = fileInfo.fileId;
    link.dataset.fileName = fileInfo.originalFileName;
    link.dataset.fileSize = String(fileInfo.fileSize);
    link.textContent = `📎 ${fileInfo.originalFileName} (${formatFileSize(fileInfo.fileSize)})`;
    return link;
  };

  const createImage = (fileInfo, file) => {
    const image = document.createElement("img");
    image.dataset.fileId = fileInfo.fileId;
    image.dataset.fileName = fileInfo.originalFileName;
    image.alt = fileInfo.originalFileName;
    // 에디터에서는 로컬 파일로 미리보기 (저장 시 src 는 제거하고 data-file-id 만 저장)
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.push(url);
    imageCacheRef.current.set(fileInfo.fileId, url);
    image.src = url;
    return image;
  };

  const changeUploadingCount = (delta) => {
    uploadingCountRef.current += delta;
    onUploadingChange(uploadingCountRef.current > 0);
  };

  const insertNodeAtCaret = (node) => {
    const range = restoreSelection();
    range.deleteContents();
    range.insertNode(node);

    const after = document.createRange();
    after.setStartAfter(node);
    after.collapse(true);
    setSelectionRange(after);
  };

  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList ?? []);
    if (!canUpload || files.length === 0 || disabled) return;

    const errors = [];

    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
        continue;
      }

      // 업로드 중 표시를 커서 위치에 먼저 넣고, 완료되면 실제 이미지 / 링크로 교체
      uploadSeqRef.current += 1;
      const uploadId = `u${uploadSeqRef.current}`;
      pendingUploadsRef.current.add(uploadId);

      const uploading = document.createElement("span");
      uploading.dataset.uploading = uploadId;
      uploading.contentEditable = "false";
      uploading.className = styles.uploading;
      uploading.textContent = `⏳ ${file.name}`;
      flushTyping();
      insertNodeAtCaret(uploading);
      emitChange();

      changeUploadingCount(1);
      try {
        const fileInfo = await onUploadFile(file);

        if (!mountedRef.current) {
          // 업로드 중 에디터가 사라진 경우 (등록 · 수정 취소 등): 고아 파일 정리
          onUploadDiscard(fileInfo);
          continue;
        }

        onFileUploaded(fileInfo);

        const node = fileInfo.image ? createImage(fileInfo, file) : createFileLink(fileInfo);
        // Undo 등으로 표시가 다시 그려졌을 수 있으므로 현재 DOM 에서 찾는다
        const placeholder = editorRef.current.querySelector(
          `[data-uploading="${uploadId}"]`,
        );
        placeholder?.replaceWith(node);
      } catch (failure) {
        editorRef.current?.querySelector(`[data-uploading="${uploadId}"]`)?.remove();
        errors.push(`${file.name}: ${failure.message}`);
      } finally {
        pendingUploadsRef.current.delete(uploadId);
        changeUploadingCount(-1);
        if (mountedRef.current) afterChange();
      }
    }

    if (mountedRef.current) {
      setNotice(errors.length > 0 ? { type: "error", text: errors.join("\n") } : null);
    }
  };

  const handleOpenImagePicker = () => {
    saveSelection();
    imageInputRef.current?.click();
  };

  const handleOpenFilePicker = () => {
    saveSelection();
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (event) => {
    const { files } = event.target;
    uploadFiles(files);
    event.target.value = "";
  };

  const handleDrop = (event) => {
    if (!canUpload || !event.dataTransfer?.files?.length) return;

    event.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    // 드롭한 위치에 커서를 두고 업로드
    const range = document.caretRangeFromPoint?.(event.clientX, event.clientY);
    if (range && editorRef.current.contains(range.startContainer)) {
      savedRangeRef.current = range;
    }
    uploadFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event) => {
    if (canUpload && event.dataTransfer?.types?.includes("Files")) {
      event.preventDefault();
      setIsDragOver(true);
    }
  };

  const handlePaste = (event) => {
    const files = event.clipboardData?.files;
    if (canUpload && files && files.length > 0) {
      event.preventDefault();
      saveSelection();
      uploadFiles(files);
      return;
    }

    // 코드 블록에는 서식 없이 텍스트만 붙여넣기
    const range = getSelectionRange();
    if (range && closestIn(range.startContainer, "pre.editor-code", editorRef.current)) {
      event.preventDefault();
      const text = event.clipboardData?.getData("text/plain") ?? "";
      runCommand((current) => insertTextAtRange(current, text).range);
    }
  };

  // ------------------------------------------------------------------
  // 키보드 · 마우스
  // ------------------------------------------------------------------
  const moveToCell = (cell, forward) => {
    const table = cell.closest("table");
    const cells = Array.from(table.querySelectorAll("td, th")).filter(
      (item) => item.closest("table") === table,
    );
    const index = cells.indexOf(cell);
    const target = cells[index + (forward ? 1 : -1)];
    if (target) {
      setSelectionRange(caretIn(target, true));
      return;
    }
    if (forward) runTableAction((tableElement) => insertRow(tableElement, cell, "below"));
  };

  const handleKeyDown = (event) => {
    if (disabled) return;
    const modifier = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();

    // 실행 취소 / 다시 실행 (Windows: Ctrl+Z / Ctrl+Y, Mac: ⌘Z / ⌘⇧Z)
    if (modifier && key === "z" && !event.altKey) {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
      return;
    }
    if (modifier && key === "y") {
      event.preventDefault();
      redo();
      return;
    }

    const editor = editorRef.current;

    // 선택한 이미지 · 링크 카드 삭제
    if ((event.key === "Backspace" || event.key === "Delete") && selectedNodeRef.current) {
      event.preventDefault();
      handleDeleteSelectedNode();
      return;
    }

    const range = getSelectionRange();
    if (!range) return;

    const code = closestIn(range.startContainer, "pre.editor-code", editor);
    if (code) {
      if (event.key === "Enter") {
        // 코드 블록 안에서는 문단을 나누지 않고 줄바꿈 문자 입력
        event.preventDefault();
        runCommand((current) => {
          const { range: next, node } = insertTextAtRange(current, "\n");
          // 마지막 줄에서 줄바꿈하면 빈 줄이 보이도록 끝에 줄바꿈 하나를 유지
          if (!hasTextAfter(next, code)) node.after(document.createTextNode("\n"));
          return next;
        });
        return;
      }
      if (event.key === "Tab" && !event.shiftKey) {
        event.preventDefault();
        runCommand((current) => insertTextAtRange(current, "  ").range);
        return;
      }
    }

    const summary = closestIn(range.startContainer, "summary", editor);
    if (summary) {
      if (event.key === "Enter") {
        // 제목에서 Enter → 내용 영역으로 이동
        event.preventDefault();
        const details = summary.parentElement;
        details.open = true;
        let body = details.querySelector(":scope > .editor-details-body");
        if (!body) {
          body = createDiv("editor-details-body");
          details.appendChild(body);
        }
        setSelectionRange(caretIn(body.firstElementChild ?? body));
        return;
      }
      if (event.key === " ") {
        // summary 에서 Space 는 접기/펼치기가 아니라 공백 입력
        event.preventDefault();
        runCommand((current) => insertTextAtRange(current, " ").range);
        return;
      }
    }

    if (event.key === "Tab") {
      if (closestIn(range.startContainer, "li", editor)) {
        // 목록 중첩 (Tab: 들여쓰기, Shift+Tab: 내어쓰기)
        event.preventDefault();
        execute(event.shiftKey ? "outdent" : "indent");
        return;
      }
      const cell = closestIn(range.startContainer, "td,th", editor);
      if (cell) {
        event.preventDefault();
        moveToCell(cell, !event.shiftKey);
      }
    }
  };

  const handleEditorClick = (event) => {
    const editor = editorRef.current;
    const target = event.target;

    // 편집 중에는 링크로 이동하지 않고, summary 클릭으로 접히지 않게 한다
    if (target.closest("a")) event.preventDefault();
    if (target.closest("summary")) event.preventDefault();

    const card = closestIn(target, ".editor-link-card", editor);
    if (card) {
      selectNode(card);
      return;
    }
    if (target.tagName === "IMG" && !target.closest("[data-uploading]")) {
      selectNode(target);
      return;
    }
    if (selectedNodeRef.current) clearNodeSelection();
  };

  const handleBeforeInput = (event) => {
    // 브라우저 메뉴의 실행 취소 / 다시 실행도 에디터 이력으로 처리
    const inputType = event.nativeEvent?.inputType;
    if (inputType === "historyUndo") {
      event.preventDefault();
      undo();
    } else if (inputType === "historyRedo") {
      event.preventDefault();
      redo();
    }
  };

  const handleInput = () => {
    if (selectedNodeRef.current && !editorRef.current.contains(selectedNodeRef.current)) {
      clearNodeSelection();
    }
    emitChange();
    scheduleTypingSnapshot();
  };

  const toAccept = (extensions) =>
    extensions.map((extension) => `.${extension}`).join(",");

  // ------------------------------------------------------------------
  // 화면
  // ------------------------------------------------------------------
  const fontFamilyValue =
    FONT_FAMILIES.find(
      (font) => font.value && normalizeFontFamily(font.value) === normalizeFontFamily(formats.fontFamily),
    )?.value ?? "";
  const fontSizeValue = FONT_SIZES.includes(formats.fontSize) ? formats.fontSize : "";

  const selectedImage = selectedNode?.tagName === "IMG" ? selectedNode : null;
  const selectedCard = selectedNode?.classList?.contains("editor-link-card") ? selectedNode : null;
  const imageAlign = ["left", "center", "right"].find((align) =>
    selectedImage?.classList.contains(`editor-img-${align}`),
  );

  const { table, cell, cellCount, flex, box, details, code, link, list } = context;
  const boxIsFloat = box && !box.classList.contains("editor-textbox");

  return (
    <div className={`${styles.editor} ${disabled ? styles.disabled : ""}`}>
      <div className={styles.toolbar} role="toolbar" aria-label="에디터 도구">
        {/* 글 유형 · 글꼴 */}
        <div className={styles.group}>
          <ToolbarSelect
            label="글 유형"
            description="본문 또는 제목 1~6 으로 변경"
            value={formats.block}
            disabled={disabled}
            onChange={handleBlockType}
            options={BLOCK_TYPES}
            width="78px"
          />
          <ToolbarSelect
            label="글꼴"
            description="선택한 텍스트의 글꼴 변경"
            value={fontFamilyValue}
            disabled={disabled}
            onChange={(value) => applyStyle("font-family", value)}
            options={FONT_FAMILIES}
            width="104px"
          />
        </div>

        {/* 글자 크기 */}
        <div className={styles.group}>
          <ToolbarSelect
            label="글자 크기"
            description="선택한 텍스트의 크기 변경"
            value={fontSizeValue}
            disabled={disabled}
            onChange={(value) => applyStyle("font-size", value)}
            options={FONT_SIZES.map((size) => ({ value: size, label: size || "기본" }))}
            width="64px"
          />
        </div>

        {/* 굵게 · 기울임 · 밑줄 · 취소선 */}
        <div className={styles.group}>
          <ToolbarButton label="굵게" description="Ctrl+B" active={formats.bold} disabled={disabled} onClick={() => execute("bold")}>
            <span className={styles.letterBold}>B</span>
          </ToolbarButton>
          <ToolbarButton label="기울임" description="Ctrl+I" active={formats.italic} disabled={disabled} onClick={() => execute("italic")}>
            <span className={styles.letterItalic}>I</span>
          </ToolbarButton>
          <ToolbarButton label="밑줄" description="Ctrl+U" active={formats.underline} disabled={disabled} onClick={() => execute("underline")}>
            <span className={styles.letterUnderline}>U</span>
          </ToolbarButton>
          <ToolbarButton label="취소선" description="선택한 텍스트에 가운데 줄 긋기" active={formats.strikeThrough} disabled={disabled} onClick={() => execute("strikeThrough")}>
            <span className={styles.letterStrike}>S</span>
          </ToolbarButton>
        </div>

        {/* 문단 정렬 */}
        <div className={styles.group}>
          {[
            ["left", "왼쪽 정렬", ICONS.alignLeft],
            ["center", "가운데 정렬", ICONS.alignCenter],
            ["right", "오른쪽 정렬", ICONS.alignRight],
            ["justify", "양쪽 정렬", ICONS.alignJustify],
          ].map(([align, label, icon]) => (
            <ToolbarButton
              key={align}
              label={label}
              description="현재 문단 또는 선택한 문단"
              active={formats.align === align}
              disabled={disabled}
              onClick={() => execute(ALIGN_COMMANDS[align])}
            >
              <SvgIcon>{icon}</SvgIcon>
            </ToolbarButton>
          ))}
        </div>

        {/* 글자 색상 · 배경 색상 */}
        <div className={styles.group}>
          <span className={styles.popoverHost} ref={popover === "color" ? popoverRef : undefined}>
            <ToolbarButton
              label="글자 색상"
              description="선택한 텍스트의 색 변경"
              active={popover === "color"}
              disabled={disabled}
              aria-haspopup="dialog"
              aria-expanded={popover === "color"}
              onClick={() => togglePopover("color")}
            >
              <span className={styles.colorIcon}>
                <SvgIcon>{ICONS.textColor}</SvgIcon>
                <span className={styles.colorBar} style={{ backgroundColor: formats.color || "#222" }} />
              </span>
            </ToolbarButton>
            {popover === "color" && (
              <div className={styles.popover} role="dialog" aria-label="글자 색상">
                <ColorPalette
                  colors={TEXT_COLORS}
                  value={formats.color}
                  clearLabel="기본 색"
                  onSelect={(color) => handleColor("color", color)}
                />
              </div>
            )}
          </span>
          <span className={styles.popoverHost} ref={popover === "backColor" ? popoverRef : undefined}>
            <ToolbarButton
              label="글자 배경 색상"
              description="선택한 텍스트에 형광펜 효과"
              active={popover === "backColor"}
              disabled={disabled}
              aria-haspopup="dialog"
              aria-expanded={popover === "backColor"}
              onClick={() => togglePopover("backColor")}
            >
              <span className={styles.colorIcon}>
                <SvgIcon>{ICONS.highlight}</SvgIcon>
                <span className={styles.colorBar} style={{ backgroundColor: formats.backColor || "transparent" }} />
              </span>
            </ToolbarButton>
            {popover === "backColor" && (
              <div className={styles.popover} role="dialog" aria-label="글자 배경 색상">
                <ColorPalette
                  colors={HIGHLIGHT_COLORS}
                  value={formats.backColor}
                  clearLabel="배경 없음"
                  onSelect={(color) => handleColor("background-color", color)}
                />
              </div>
            )}
          </span>
        </div>

        {/* 목록 · 인용구 · 구분선 */}
        <div className={styles.group}>
          <ToolbarButton label="글머리 기호 목록" description="Tab 으로 하위 목록" active={formats.ul} disabled={disabled} onClick={() => execute("insertUnorderedList")}>
            <SvgIcon>{ICONS.bulletList}</SvgIcon>
          </ToolbarButton>
          <ToolbarButton label="번호 매기기 목록" description="Tab 으로 하위 목록" active={formats.ol} disabled={disabled} onClick={() => execute("insertOrderedList")}>
            <SvgIcon>{ICONS.numberList}</SvgIcon>
          </ToolbarButton>
          <ToolbarButton label="목록 들여쓰기" description="하위 목록으로 이동 (Tab)" disabled={disabled || !list} onClick={() => execute("indent")}>
            <SvgIcon>{ICONS.indent}</SvgIcon>
          </ToolbarButton>
          <ToolbarButton label="목록 내어쓰기" description="상위 목록으로 이동 (Shift+Tab)" disabled={disabled || !list} onClick={() => execute("outdent")}>
            <SvgIcon>{ICONS.outdent}</SvgIcon>
          </ToolbarButton>
          <ToolbarButton label="인용구" description="문단을 인용구로 변경 / 해제" active={formats.quote} disabled={disabled} onClick={toggleQuote}>
            <SvgIcon>{ICONS.quote}</SvgIcon>
          </ToolbarButton>
          <ToolbarButton label="구분선" description="가로 구분선 삽입" disabled={disabled} onClick={() => execute("insertHorizontalRule")}>
            <SvgIcon>{ICONS.divider}</SvgIcon>
          </ToolbarButton>
        </div>

        {/* 표 */}
        <div className={styles.group}>
          <span className={styles.popoverHost} ref={popover === "table" ? popoverRef : undefined}>
            <ToolbarButton
              label="표 삽입"
              description="행과 열을 선택하여 표 삽입"
              active={popover === "table"}
              disabled={disabled}
              aria-haspopup="dialog"
              aria-expanded={popover === "table"}
              onClick={() => togglePopover("table")}
            >
              <SvgIcon>{ICONS.table}</SvgIcon>
            </ToolbarButton>
            {popover === "table" && (
              <div className={styles.popover} role="dialog" aria-label="표 삽입">
                <TablePicker onSelect={handleInsertTable} />
              </div>
            )}
          </span>
        </div>

        {/* 레이아웃 · 블록 */}
        <div className={styles.group}>
          <ToolbarButton label="Flex 박스 삽입" description="여러 칸을 가로로 배치 (좁은 화면에서 자동 줄바꿈)" disabled={disabled} onClick={handleInsertFlex}>
            <SvgIcon>{ICONS.flex}</SvgIcon>
          </ToolbarButton>
          <ToolbarButton label="텍스트 박스 삽입" description="본문과 구분되는 상자" disabled={disabled} onClick={() => handleInsertBox("editor-textbox")}>
            <SvgIcon>{ICONS.textBox}</SvgIcon>
          </ToolbarButton>
          <ToolbarButton label="왼쪽 띄우기 박스" description="본문 텍스트가 박스 오른쪽으로 흐름" disabled={disabled} onClick={() => handleInsertBox("editor-float-left")}>
            <SvgIcon>{ICONS.floatLeft}</SvgIcon>
          </ToolbarButton>
          <ToolbarButton label="오른쪽 띄우기 박스" description="본문 텍스트가 박스 왼쪽으로 흐름" disabled={disabled} onClick={() => handleInsertBox("editor-float-right")}>
            <SvgIcon>{ICONS.floatRight}</SvgIcon>
          </ToolbarButton>
          <ToolbarButton label="접기/펼치기 블록" description="제목을 눌러 내용을 접고 펼치는 블록" disabled={disabled} onClick={handleInsertDetails}>
            <SvgIcon>{ICONS.details}</SvgIcon>
          </ToolbarButton>
        </div>

        {/* 이미지 · 파일 */}
        <div className={styles.group}>
          {canUpload && (
            <ToolbarButton label="이미지 업로드" description={`${imageExtensions.join(", ")} / ${formatFileSize(maxFileSize)} 이하`} disabled={disabled} onClick={handleOpenImagePicker}>
              <SvgIcon>{ICONS.image}</SvgIcon>
            </ToolbarButton>
          )}
          <span className={styles.popoverHost} ref={popover === "imageUrl" ? popoverRef : undefined}>
            <ToolbarButton
              label="이미지 URL 삽입"
              description="https 이미지 주소로 삽입"
              active={popover === "imageUrl"}
              disabled={disabled}
              aria-haspopup="dialog"
              aria-expanded={popover === "imageUrl"}
              onClick={openImageUrlForm}
            >
              <SvgIcon>{ICONS.imageUrl}</SvgIcon>
            </ToolbarButton>
            {popover === "imageUrl" && imageUrlForm && (
              <form className={`${styles.popover} ${styles.form}`} aria-label="이미지 URL 삽입" onSubmit={handleSubmitImageUrl}>
                <label>
                  이미지 주소
                  <input
                    type="url"
                    autoFocus
                    value={imageUrlForm.url}
                    onChange={(event) => setImageUrlForm((prev) => ({ ...prev, url: event.target.value, error: "" }))}
                  />
                </label>
                <label>
                  대체 텍스트
                  <input
                    type="text"
                    maxLength={200}
                    placeholder="이미지 설명 (선택)"
                    value={imageUrlForm.alt}
                    onChange={(event) => setImageUrlForm((prev) => ({ ...prev, alt: event.target.value }))}
                  />
                </label>
                {imageUrlForm.error && <p className={styles.formError}>{imageUrlForm.error}</p>}
                <div className={styles.paletteRow}>
                  <button type="submit" className={styles.contextButton} disabled={imageUrlForm.loading}>
                    {imageUrlForm.loading ? "확인 중..." : "삽입"}
                  </button>
                  <button type="button" className={styles.contextButton} onClick={() => setPopover(null)}>
                    취소
                  </button>
                </div>
              </form>
            )}
          </span>
          {canUpload && (
            <ToolbarButton label="파일 첨부" description={`${allowedExtensions.join(", ")} / ${formatFileSize(maxFileSize)} 이하 · 드래그 앤 드롭 · 붙여넣기 가능`} disabled={disabled} onClick={handleOpenFilePicker}>
              <SvgIcon>{ICONS.attach}</SvgIcon>
            </ToolbarButton>
          )}
        </div>

        {/* 링크 · 코드 블록 */}
        <div className={styles.group}>
          <span className={styles.popoverHost} ref={popover === "link" ? popoverRef : undefined}>
            <ToolbarButton
              label="링크 삽입"
              description={link ? "현재 링크 수정" : "선택한 텍스트에 링크 · 미리보기 카드"}
              active={popover === "link" || Boolean(link)}
              disabled={disabled}
              aria-haspopup="dialog"
              aria-expanded={popover === "link"}
              onClick={openLinkForm}
            >
              <SvgIcon>{ICONS.link}</SvgIcon>
            </ToolbarButton>
            {popover === "link" && linkForm && (
              <form className={`${styles.popover} ${styles.form}`} aria-label="링크 삽입" onSubmit={handleSubmitLink}>
                <label>
                  URL
                  <input
                    type="url"
                    autoFocus
                    value={linkForm.url}
                    onChange={(event) => setLinkForm((prev) => ({ ...prev, url: event.target.value, error: "" }))}
                  />
                </label>
                <label>
                  링크에 표시할 텍스트
                  <input
                    type="text"
                    maxLength={500}
                    placeholder="비우면 URL 을 표시"
                    value={linkForm.text}
                    disabled={linkForm.card}
                    onChange={(event) => setLinkForm((prev) => ({ ...prev, text: event.target.value }))}
                  />
                </label>
                {!linkForm.editing && canPreviewLink && (
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={linkForm.card}
                      onChange={(event) => setLinkForm((prev) => ({ ...prev, card: event.target.checked }))}
                    />
                    미리보기 카드(썸네일)로 삽입
                  </label>
                )}
                {linkForm.error && <p className={styles.formError}>{linkForm.error}</p>}
                <div className={styles.paletteRow}>
                  <button type="submit" className={styles.contextButton} disabled={linkForm.loading}>
                    {linkForm.loading ? "미리보기 확인 중..." : linkForm.editing ? "수정" : "삽입"}
                  </button>
                  <button type="button" className={styles.contextButton} onClick={() => setPopover(null)}>
                    취소
                  </button>
                </div>
              </form>
            )}
          </span>
          <ToolbarButton label="코드 블록" description="코드 입력 영역 삽입 (Tab: 들여쓰기)" active={Boolean(code)} disabled={disabled} onClick={handleInsertCode}>
            <SvgIcon>{ICONS.code}</SvgIcon>
          </ToolbarButton>
        </div>

        {/* 실행 취소 · 다시 실행 */}
        <div className={styles.group}>
          <ToolbarButton label="실행 취소" description="Ctrl+Z (Mac ⌘Z)" disabled={disabled || !historyState.canUndo} onClick={undo}>
            <SvgIcon>{ICONS.undo}</SvgIcon>
          </ToolbarButton>
          <ToolbarButton label="다시 실행" description="Ctrl+Y (Mac ⌘⇧Z)" disabled={disabled || !historyState.canRedo} onClick={redo}>
            <SvgIcon>{ICONS.redo}</SvgIcon>
          </ToolbarButton>
        </div>

        {canUpload && (
          <>
            <input ref={imageInputRef} type="file" accept={toAccept(imageExtensions)} multiple hidden onChange={handleFileInputChange} />
            <input ref={fileInputRef} type="file" accept={toAccept(allowedExtensions)} multiple hidden onChange={handleFileInputChange} />
          </>
        )}
      </div>

      {/* 컨텍스트 바: 커서 위치 / 선택한 요소에 따라 편집 기능 표시 */}
      {!disabled && (table || flex || box || details || code || link || selectedNode) && (
        <div className={styles.contextBar} role="toolbar" aria-label="선택한 요소 편집">
          {table && cell && (
            <div className={styles.contextGroup}>
              <span className={styles.contextTitle}>표</span>
              <ContextButton label="왼쪽에 열 추가" onClick={() => runTableAction((t, c) => insertColumn(t, c, "left"))} />
              <ContextButton label="오른쪽에 열 추가" onClick={() => runTableAction((t, c) => insertColumn(t, c, "right"))} />
              <ContextButton label="열 삭제" description="현재 셀의 열 삭제" onClick={() => runTableAction(deleteColumn)} />
              <span className={styles.contextDivider} />
              <ContextButton label="위에 행 추가" onClick={() => runTableAction((t, c) => insertRow(t, c, "above"))} />
              <ContextButton label="아래에 행 추가" onClick={() => runTableAction((t, c) => insertRow(t, c, "below"))} />
              <ContextButton label="행 삭제" description="현재 셀의 행 삭제" onClick={() => runTableAction(deleteRow)} />
              <span className={styles.contextDivider} />
              <ContextButton
                label={cellCount > 1 ? `셀 병합 (${cellCount})` : "셀 병합"}
                description="여러 셀을 드래그로 선택한 뒤 병합"
                onClick={handleMergeCells}
              />
              <ContextButton label="셀 분할" description="병합된 셀을 원래대로 나눔" onClick={() => runTableAction(splitCell)} />
              <span className={styles.contextDivider} />
              <ContextButton label="아래에 문단 추가" onClick={() => addParagraphAfter(table)} />
              <ContextButton label="표 삭제" danger onClick={() => deleteBlock(table)} />
            </div>
          )}

          {flex && (
            <div className={styles.contextGroup}>
              <span className={styles.contextTitle}>Flex 박스</span>
              <ContextButton label="칸 추가" description="현재 칸 오른쪽에 새 칸" onClick={handleAddFlexItem} />
              <ContextButton label="칸 삭제" description="현재 칸 삭제" onClick={handleRemoveFlexItem} />
              <label className={styles.contextField}>
                간격
                <select
                  value={flex.style.gap || "16px"}
                  onChange={(event) => mutate(() => { flex.style.gap = event.target.value; })}
                >
                  {FLEX_GAPS.map((gap) => (
                    <option key={gap} value={gap}>{gap}</option>
                  ))}
                </select>
              </label>
              <ContextButton label="아래에 문단 추가" onClick={() => addParagraphAfter(flex)} />
              <ContextButton label="Flex 박스 삭제" danger onClick={() => deleteBlock(flex)} />
            </div>
          )}

          {box && (
            <div className={styles.contextGroup}>
              <span className={styles.contextTitle}>{boxIsFloat ? "띄우기 박스" : "텍스트 박스"}</span>
              {boxIsFloat ? (
                <label className={styles.contextField}>
                  너비
                  <select
                    value={box.style.width || "40%"}
                    onChange={(event) => mutate(() => { box.style.width = event.target.value; })}
                  >
                    {FLOAT_WIDTHS.map((width) => (
                      <option key={width} value={width}>{width}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className={styles.contextField}>
                  배경
                  <select
                    value={
                      BOX_COLORS.find(
                        (color) => color.value && isSameColor(color.value, box.style.backgroundColor),
                      )?.value ?? ""
                    }
                    onChange={(event) =>
                      mutate(() => {
                        const color = event.target.value;
                        if (color) box.style.backgroundColor = color;
                        else box.style.removeProperty("background-color");
                        if (box.getAttribute("style") === "") box.removeAttribute("style");
                      })
                    }
                  >
                    {BOX_COLORS.map((color) => (
                      <option key={color.value} value={color.value}>{color.label}</option>
                    ))}
                  </select>
                </label>
              )}
              <ContextButton label="아래에 문단 추가" onClick={() => addParagraphAfter(box)} />
              <ContextButton label="박스 삭제" danger onClick={() => deleteBlock(box)} />
            </div>
          )}

          {details && (
            <div className={styles.contextGroup}>
              <span className={styles.contextTitle}>접기/펼치기</span>
              <ContextButton
                label={details.open ? "접기" : "펼치기"}
                description="저장 후 처음 보일 때의 상태도 함께 바뀝니다"
                onClick={() => mutate(() => { details.open = !details.open; })}
              />
              <ContextButton label="아래에 문단 추가" onClick={() => addParagraphAfter(details)} />
              <ContextButton label="블록 삭제" danger onClick={() => deleteBlock(details)} />
            </div>
          )}

          {code && (
            <div className={styles.contextGroup}>
              <span className={styles.contextTitle}>코드 블록</span>
              <label className={styles.contextField}>
                언어
                <select
                  value={code.dataset.language || "plaintext"}
                  onChange={(event) => mutate(() => { code.dataset.language = event.target.value; })}
                >
                  {CODE_LANGUAGES.map((language) => (
                    <option key={language} value={language}>{language}</option>
                  ))}
                </select>
              </label>
              <ContextButton label="아래에 문단 추가" onClick={() => addParagraphAfter(code)} />
              <ContextButton label="코드 블록 삭제" danger onClick={() => deleteBlock(code)} />
            </div>
          )}

          {link && (
            <div className={styles.contextGroup}>
              <span className={styles.contextTitle}>링크</span>
              <span className={styles.contextLink} title={link.href}>{link.href}</span>
              <ContextButton label="링크 수정" description="주소 · 표시 텍스트 변경" onClick={openLinkForm} />
              <ContextButton label="링크 해제" onClick={handleUnlink} />
            </div>
          )}

          {selectedImage && (
            <div className={styles.contextGroup}>
              <span className={styles.contextTitle}>이미지</span>
              <label className={styles.contextField}>
                크기
                <select
                  value={selectedImage.style.width || ""}
                  onChange={(event) => handleImageWidth(event.target.value)}
                >
                  {IMAGE_WIDTHS.map((width) => (
                    <option key={width.value} value={width.value}>{width.label}</option>
                  ))}
                </select>
              </label>
              <ContextButton label="왼쪽" description="이미지 왼쪽 정렬" active={imageAlign === "left"} onClick={() => handleImageAlign(imageAlign === "left" ? "" : "left")} />
              <ContextButton label="가운데" description="이미지 가운데 정렬" active={imageAlign === "center"} onClick={() => handleImageAlign(imageAlign === "center" ? "" : "center")} />
              <ContextButton label="오른쪽" description="이미지 오른쪽 정렬" active={imageAlign === "right"} onClick={() => handleImageAlign(imageAlign === "right" ? "" : "right")} />
              <label className={styles.contextField}>
                대체 텍스트
                <input
                  type="text"
                  maxLength={200}
                  value={imageAlt}
                  onChange={(event) => setImageAlt(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      updateSelectedImage((image) => { image.alt = imageAlt.trim(); });
                    }
                  }}
                />
              </label>
              <ContextButton label="적용" description="대체 텍스트 적용" onClick={() => updateSelectedImage((image) => { image.alt = imageAlt.trim(); })} />
              <ContextButton label="이미지 삭제" danger onClick={handleDeleteSelectedNode} />
            </div>
          )}

          {selectedCard && (
            <div className={styles.contextGroup}>
              <span className={styles.contextTitle}>링크 카드</span>
              <ContextButton label="아래에 문단 추가" onClick={() => { clearNodeSelection(); addParagraphAfter(selectedCard); }} />
              <ContextButton label="카드 삭제" danger onClick={handleDeleteSelectedNode} />
            </div>
          )}
        </div>
      )}

      <div
        ref={editorRef}
        className={`lw-editor-content ${styles.editorArea} ${isDragOver ? styles.dragOver : ""}`}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        data-placeholder={placeholder}
        data-empty={isEmptyContent}
        spellCheck={false}
        onInput={handleInput}
        onBeforeInput={handleBeforeInput}
        onKeyDown={handleKeyDown}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onBlur={saveSelection}
        onClick={handleEditorClick}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragOver(false)}
      />

      {notice && (
        <p className={notice.type === "error" ? styles.error : styles.info} role={notice.type === "error" ? "alert" : "status"}>
          {notice.text}
          <button type="button" className={styles.noticeClose} aria-label="알림 닫기" onClick={() => setNotice(null)}>
            ×
          </button>
        </p>
      )}
    </div>
  );
}
