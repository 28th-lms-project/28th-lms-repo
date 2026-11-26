/**
 * icons.js의 path 하나를 그리는 아이콘 (색은 글자색을 따름).
 * IconButton의 Icon과 달리 전역 .icon 여백이 붙지 않는다.
 * @param {{ path: string, size?: number, className?: string }} props
 */
export default function SvgIcon({ path, size = 16, className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d={path} />
    </svg>
  );
}
