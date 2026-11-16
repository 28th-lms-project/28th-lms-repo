import { Checkbox } from "../../../common/input/Input";
import { IconButton } from "../../../common/input/IconButton";
import { icons } from "../../../common/input/icons";

import { formatDateTime, LEVEL_TITLES, SUPER_ADMIN_ROLE_ID } from "./menuUtils";

import styles from "./Menu.module.css";

// 한글 입력(IME) 조합 중 Enter는 무시
const isEnterKey = (event) => event.key === "Enter" && !event.nativeEvent.isComposing;

const SELF_LOCK_NOTICE =
  "메뉴 관리 화면이 속한 메뉴입니다. 본인 역할 해제 · 미사용 · URL 변경 · 삭제, 본인 역할이 허용되지 않은 곳으로 옮기기는 저장되지 않습니다.";

/**
 * 메뉴 관리 화면의 열 하나 (대 · 중 · 소메뉴). 위: 목록, 아래: 선택한 메뉴의 상세.
 * 상태는 상위(Menu.jsx)가 갖고, 이 컴포넌트는 그리기와 이벤트 전달만 한다.
 *
 * @param {object} props
 * @param {"top"|"mid"|"btm"} props.level
 * @param {boolean} props.active 상위 메뉴를 골랐는지 (대메뉴 열은 항상 true)
 * @param {object[]} props.items 이 열의 메뉴 (MENU_ORDER 순)
 * @param {string|null} props.selectedId
 * @param {object|null} props.form 상세 입력값. null이면 상세 없음
 * @param {{ title: string[], menuUrl: string[], etc: string[] }} props.errors
 * @param {boolean} props.dirty 저장하지 않은 변경이 있는지
 * @param {boolean} props.fieldsDirty 상위 메뉴 외의 칸을 바꿨는지 (바꿨으면 상위 메뉴 선택 잠금)
 * @param {boolean} props.parentChanged 상위 메뉴를 바꿨는지 (바꿨으면 다른 칸 잠금, 저장 = 옮기기)
 * @param {{ value: string, text: string }[]} props.parentOptions 상위 메뉴 선택지. 비어 있으면 표시하지 않음
 * @param {object[]} props.roles 역할 순위 순서의 전체 역할
 * @param {Set<string>} props.blockedRoleIds 상위 메뉴 때문에 실제로는 안 보이는 역할
 * @param {boolean} props.showSelfLockNotice
 * @param {{ value: string, text: string }[]} props.urlOptions 소메뉴 URL 선택지
 * @param {Set<string>} props.routeUrls 라우트에 있는 메뉴 URL (⚠ 표시용)
 * @param {boolean} props.editable 상세 입력칸을 바꿀 수 있는지
 * @param {boolean} props.canCreate
 * @param {boolean} props.canDelete
 * @param {boolean} props.canDrag
 * @param {boolean} props.saving
 * @param {{ level: string, id: string } | null} props.dragging
 * @param {string|null} props.dropTargetId
 */
export default function MenuColumn({
  level,
  active,
  items,
  selectedId,
  form,
  errors,
  dirty,
  fieldsDirty,
  parentChanged,
  parentOptions,
  roles,
  blockedRoleIds,
  showSelfLockNotice,
  urlOptions,
  routeUrls,
  editable,
  canCreate,
  canDelete,
  canDrag,
  saving,
  dragging,
  dropTargetId,
  onSelect,
  onAdd,
  onChange,
  onSave,
  onCancel,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  // 상위 메뉴를 바꾸면 다른 칸은 잠근다 (옮기기는 다른 수정과 따로 저장, 설계 6-6)
  const inputDisabled = !editable || saving || parentChanged;
  const showParentSelect = form?.mode === "view" && editable && parentOptions.length > 0;
  const isDraggingHere = dragging?.level === level;

  // 놓을 위치 표시: 아래로 끌면 대상 아래, 위로 끌면 대상 위
  const getDropPositionClass = (menu, index) => {
    if (!isDraggingHere || menu.id !== dropTargetId || menu.id === dragging.id) return "";
    const fromIndex = items.findIndex((item) => item.id === dragging.id);
    return fromIndex < index ? styles.dropBelow : styles.dropAbove;
  };

  const toggleRole = (roleId, checked) => {
    const roleIds = form.roleIds.filter((id) => id !== roleId);
    onChange(level, { roleIds: checked ? [...roleIds, roleId] : roleIds });
  };

  return (
    <section className={styles.column}>
      {/* ───── 목록 ───── */}
      <header className={styles.columnHeader}>
        <h3 className={styles.columnTitle}>{LEVEL_TITLES[level]}</h3>
        {active && canCreate && (
          <IconButton
            icon={icons.add}
            iconSize={16}
            disabled={saving}
            onClick={() => onAdd(level)}
          >
            추가
          </IconButton>
        )}
      </header>

      <ul className={styles.list}>
        {!active && <li className={styles.listEmpty}>상위 메뉴를 선택하세요.</li>}
        {active && items.length === 0 && <li className={styles.listEmpty}>메뉴가 없습니다.</li>}

        {active &&
          items.map((menu, index) => {
            const brokenUrl = level === "btm" && menu.menuUrl && !routeUrls.has(menu.menuUrl);
            const className = [
              styles.listItem,
              menu.id === selectedId ? styles.selected : "",
              menu.useYn === "N" ? styles.unused : "",
              canDrag ? styles.draggableItem : "",
              isDraggingHere && menu.id === dragging.id ? styles.dragging : "",
              getDropPositionClass(menu, index),
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <li
                key={menu.id}
                className={className}
                draggable={canDrag}
                onClick={() => onSelect(level, menu.id)}
                onDragStart={(e) => onDragStart(e, level, menu.id)}
                onDragOver={(e) => onDragOver(e, level, menu.id)}
                onDrop={(e) => onDrop(e, level, menu.id)}
                onDragEnd={onDragEnd}
              >
                {canDrag && (
                  <span className={styles.handle} title="끌어서 순서를 변경합니다.">
                    ≡
                  </span>
                )}
                <span className={styles.itemTitle}>
                  {menu.title}
                  {menu.useYn === "N" && " (미사용)"}
                </span>
                {brokenUrl && (
                  <span
                    className={styles.warning}
                    title="화면이 없는 URL입니다. URL을 다시 선택하세요."
                  >
                    ⚠
                  </span>
                )}
                {menu.id === selectedId && <span className={styles.selectedMark}>◀</span>}
              </li>
            );
          })}
      </ul>

      {/* ───── 상세 ───── */}
      <div className={styles.detail}>
        {!form && <p className={styles.detailEmpty}>{active ? "메뉴를 선택하세요." : ""}</p>}

        {form && (
          <>
            {showSelfLockNotice && <p className={styles.selfLockNotice}>{SELF_LOCK_NOTICE}</p>}

            <dl className={styles.fields}>
              <dt>ID</dt>
              <dd className={styles.menuId}>{form.mode === "new" ? "(저장 시 생성)" : form.id}</dd>

              {showParentSelect && (
                <>
                  <dt>
                    <label htmlFor={`menu-${level}-parentId`}>상위 메뉴</label>
                  </dt>
                  <dd>
                    <select
                      id={`menu-${level}-parentId`}
                      className={styles.select}
                      value={form.parentId ?? ""}
                      disabled={saving || fieldsDirty}
                      onChange={(e) => onChange(level, { parentId: e.target.value })}
                    >
                      {parentOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.text}
                        </option>
                      ))}
                    </select>
                    {fieldsDirty && (
                      <p className={styles.fieldHint}>
                        다른 변경을 저장하거나 취소한 뒤 옮길 수 있습니다.
                      </p>
                    )}
                    {parentChanged && (
                      <p className={styles.fieldHint}>
                        저장하면 메뉴를 옮깁니다. 다른 칸은 옮긴 뒤 수정할 수 있습니다.
                      </p>
                    )}
                    {errors.parentId.map((message) => (
                      <p key={message} className={styles.errorMessage}>
                        {message}
                      </p>
                    ))}
                  </dd>
                </>
              )}

              <dt>
                <label htmlFor={`menu-${level}-title`}>이름</label>
              </dt>
              <dd>
                <input
                  id={`menu-${level}-title`}
                  type="text"
                  className={styles.input}
                  value={form.title}
                  maxLength={100}
                  disabled={inputDisabled}
                  autoComplete="off"
                  onChange={(e) => onChange(level, { title: e.target.value })}
                  onKeyDown={(e) => isEnterKey(e) && dirty && onSave(level)}
                />
                {errors.title.map((message) => (
                  <p key={message} className={styles.errorMessage}>
                    {message}
                  </p>
                ))}
              </dd>

              <dt>상태</dt>
              <dd className={styles.checkRow}>
                <span className={inputDisabled ? styles.disabledCheck : ""}>
                  <Checkbox
                    id={`menu-${level}-useYn`}
                    labelText="사용"
                    checked={form.useYn === "Y"}
                    disabled={inputDisabled}
                    onChange={(input) => onChange(level, { useYn: input.checked ? "Y" : "N" })}
                  />
                </span>
                {level === "mid" && (
                  <span className={inputDisabled ? styles.disabledCheck : ""}>
                    <Checkbox
                      id={`menu-${level}-spread`}
                      labelText="펼침"
                      checked={form.spread === "Y"}
                      disabled={inputDisabled}
                      onChange={(input) =>
                        onChange(level, { spread: input.checked ? "Y" : "N" })
                      }
                    />
                  </span>
                )}
              </dd>

              <dt>역할</dt>
              <dd className={styles.roleList}>
                {roles.map((role) => {
                  const isSuperAdmin = role.roleId === SUPER_ADMIN_ROLE_ID;
                  const checked = isSuperAdmin || form.roleIds.includes(role.roleId);
                  const disabled = isSuperAdmin || inputDisabled;
                  return (
                    <span
                      key={role.roleId}
                      className={`${styles.roleItem} ${disabled ? styles.disabledCheck : ""}`}
                    >
                      <Checkbox
                        id={`menu-${level}-role-${role.roleId}`}
                        labelText={
                          isSuperAdmin ? `${role.roleDisplayName}(고정)` : role.roleDisplayName
                        }
                        checked={checked}
                        disabled={disabled}
                        onChange={(input) => toggleRole(role.roleId, input.checked)}
                      />
                      {!isSuperAdmin && checked && blockedRoleIds.has(role.roleId) && (
                        <span className={styles.blockedRole}>(상위 메뉴에서 허용 안 됨)</span>
                      )}
                    </span>
                  );
                })}
              </dd>

              {level === "btm" && (
                <>
                  <dt>
                    <label htmlFor={`menu-${level}-menuUrl`}>URL</label>
                  </dt>
                  <dd>
                    <select
                      id={`menu-${level}-menuUrl`}
                      className={styles.select}
                      value={form.menuUrl}
                      disabled={inputDisabled}
                      onChange={(e) => onChange(level, { menuUrl: e.target.value })}
                    >
                      <option value="">선택하세요.</option>
                      {urlOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.text}
                        </option>
                      ))}
                    </select>
                    {errors.menuUrl.map((message) => (
                      <p key={message} className={styles.errorMessage}>
                        {message}
                      </p>
                    ))}
                  </dd>
                </>
              )}

              {form.mode === "view" && (
                <>
                  <dt>생성</dt>
                  <dd className={styles.date}>{formatDateTime(form.crtDt)}</dd>
                  <dt>수정</dt>
                  <dd className={styles.date}>{formatDateTime(form.mdfyDt)}</dd>
                </>
              )}
            </dl>

            {errors.etc.map((message) => (
              <p key={message} className={styles.errorMessage}>
                {message}
              </p>
            ))}

            {/* 버튼이 바뀌어도 높이가 흔들리지 않도록 줄 높이 고정 */}
            <div className={styles.detailButtons}>
              {dirty ? (
                <>
                  <IconButton
                    icon={icons.ok}
                    iconSize={16}
                    disabled={saving}
                    onClick={() => onSave(level)}
                  >
                    저장
                  </IconButton>
                  <IconButton
                    icon={icons.close}
                    iconSize={16}
                    disabled={saving}
                    onClick={() => onCancel(level)}
                  >
                    취소
                  </IconButton>
                </>
              ) : (
                form.mode === "view" &&
                canDelete && (
                  <IconButton
                    icon={icons.delete}
                    iconSize={16}
                    disabled={saving}
                    onClick={() => onDelete(level)}
                  >
                    삭제
                  </IconButton>
                )
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
