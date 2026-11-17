import SvgIcon from "./SvgIcon";

/**
 * 사이드 메뉴: 그룹(접기 · 펴기) + 항목. 스타일은 styles/nav.css.
 * 항목 클릭은 onSelect로 받는다 (라우터 이동은 쓰는 쪽에서 navigate).
 *
 * @param {object} props
 * @param {{ key: string, title: string, items: { key: string, title: string, icon?: string }[] }[]} props.groups
 * @param {string} [props.currentKey]  현재 화면 항목 (aria-current="page")
 * @param {(item: object) => void} [props.onSelect]
 * @param {string} [props.ariaLabel="메뉴"]
 */
export default function SideNav({ groups, currentKey, onSelect, ariaLabel = "메뉴", className = "" }) {
  return (
    <nav className={`side-nav ${className}`.trim()} aria-label={ariaLabel}>
      {groups.map((group) => (
        <details key={group.key} className="side-nav-group" open>
          <summary className="side-nav-group-title">{group.title}</summary>
          <ul className="side-nav-list">
            {group.items.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  className="side-nav-item"
                  aria-current={item.key === currentKey ? "page" : undefined}
                  onClick={() => onSelect?.(item)}
                >
                  {item.icon && <SvgIcon path={item.icon} size={18} />}
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </nav>
  );
}
