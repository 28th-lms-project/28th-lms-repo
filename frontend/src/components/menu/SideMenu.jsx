import { NavLink, useLocation } from "react-router-dom";

import styles from "./SideMenu.module.css";
import { useState } from "react";
import { MENU } from "./menuData";

// 메뉴 항목이 현재 주소와 일치하는지 확인
function isActiveItem(item, pathname) {
  if (item.to === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(item.to);
}

// 현재 주소에 해당하는 그룹만 처음에 펼침
function getInitialOpenGroups(pathname) {
  return MENU.flatMap((section) => section.groups)
    .filter((group) => group.items.some((item) => isActiveItem(item, pathname)))
    .map((group) => group.title);
}

export default function SideMenu() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState(() =>
    getInitialOpenGroups(pathname),
  );

  function toggleGroup(title) {
    setOpenGroups((prev) => {
      if (prev.includes(title)) {
        return prev.filter((t) => t !== title); // 닫기
      }
      return [...prev, title]; // 열기
    });
  }

  let navClass = styles.sideMenu;
  let toggleLabel = "메뉴 접기";
  if (collapsed) {
    navClass += ` ${styles.collapsed}`;
    toggleLabel = "메뉴 펼치기";
  }

  return (
    <nav className={navClass}>
      <button
        type="button"
        className={styles.collapseBtn}
        onClick={() => setCollapsed((c) => !c)}
        aria-label={toggleLabel}
      >
        {collapsed && "›"}
        {!collapsed && "‹"}
      </button>

      <div className={styles.menuBody}>
        {MENU.map((section) => (
          <div key={section.section}>
            <h4 className={styles.listTitle}>{section.section}</h4>
            {section.groups.map((group) => {
              const isOpen = openGroups.includes(group.title);

              let arrowClass = styles.arrow;
              let submenuClass = styles.submenuWrap;
              if (isOpen) {
                arrowClass += ` ${styles.arrowOpen}`;
                submenuClass += ` ${styles.submenuOpen}`;
              }

              return (
                <div key={group.title}>
                  <button
                    type="button"
                    className={styles.listItemTitle}
                    onClick={() => toggleGroup(group.title)}
                    aria-expanded={isOpen}
                  >
                    <span className={arrowClass}>›</span>
                    {group.title}
                  </button>
                  <div className={submenuClass}>
                    <ul className={styles.listSubmenu}>
                      {group.items.map((item) => (
                        <li key={item.to} className={styles.listItem}>
                          <NavLink to={item.to} end={item.end}>
                            {item.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
