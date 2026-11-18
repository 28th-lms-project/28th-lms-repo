import { useId } from "react";

import Panel from "../../../common/ui/Panel";
import Table from "../../../common/ui/Table";
import Button from "../../../common/ui/Button";
import Badge from "../../../common/ui/Badge";
import Callout from "../../../common/ui/Callout";
import Field from "../../../common/ui/Field";
import StatusBox from "../../../common/ui/StatusBox";
import { icons } from "../../../common/input/icons";

import {
  findMenu,
  formatDateTime,
  getChildMenus,
  getSelfAndAncestors,
  LEVEL_TITLES,
  SUPER_ADMIN_ROLE_ID,
} from "./menuUtils";

import styles from "./Menu.module.css";

// 한글 입력(IME) 조합 중 Enter는 무시
const isEnterKey = (event) => event.key === "Enter" && !event.nativeEvent.isComposing;

const SELF_LOCK_NOTICE =
  "메뉴 관리 화면이 속한 메뉴입니다. 본인 역할 해제 · 미사용 · URL 변경 · 삭제, 본인 역할이 허용되지 않은 곳으로 옮기기는 저장되지 않습니다.";
const ORDER_PENDING_HINT = "순서를 저장하거나 되돌린 뒤 할 수 있습니다.";
const BROKEN_URL_HINT = "화면이 없는 URL입니다. URL을 다시 고르세요.";

/**
 * 메뉴 관리 화면의 열 하나 (대 · 중 · 소메뉴). 위: 목록 패널(작은 Table, 순서 바꾸기), 아래: 선택한 메뉴의 상세 패널(보기 ↔ 수정).
 * 상태는 상위(Menu.jsx)가 갖고, 이 컴포넌트는 그리기와 이벤트 전달만 한다.
 *
 * @param {object} props
 * @param {"top"|"mid"|"btm"} props.level
 * @param {boolean} props.active 상위 메뉴를 골랐는지 (대메뉴 열은 항상 true)
 * @param {string} props.parentTitle 상위 메뉴 이름 (패널 제목용)
 * @param {object[]} props.items 이 열의 메뉴 (저장하지 않은 순서가 있으면 그 순서)
 * @param {object[]} props.menus 전체 메뉴 (하위 수 · 상위 경로 · 저장된 값)
 * @param {string|null} props.selectedId
 * @param {object|null} props.form 상세 입력값. null이면 상세 없음
 * @param {boolean} props.editing 수정 · 등록 중인지 (아니면 보기)
 * @param {{ title: string[], menuUrl: string[], parentId: string[], etc: string[] }} props.errors
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
 * @param {boolean} props.canUpdate
 * @param {boolean} props.canDelete
 * @param {boolean} props.canReorder 손잡이를 보일지 (권한 · 저장 중 · 수정 중)
 * @param {boolean} props.orderPending 저장하지 않은 순서가 있는지 (있으면 추가 · 수정 · 삭제 잠금)
 * @param {boolean} props.saving
 */
export default function MenuColumn({
  level,
  active,
  parentTitle,
  items,
  menus,
  selectedId,
  form,
  editing,
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
  canUpdate,
  canDelete,
  canReorder,
  orderPending,
  saving,
  onSelect,
  onAdd,
  onEdit,
  onChange,
  onSave,
  onCancel,
  onDelete,
  onReorder,
}) {
  const idBase = useId();
  const inputId = (name) => `${idBase}-${name}`;

  const levelTitle = LEVEL_TITLES[level];
  const listTitle = level === "top" ? levelTitle : `${levelTitle} · ${parentTitle}`;
  const isBrokenUrl = (menuUrl) => level === "btm" && menuUrl && !routeUrls.has(menuUrl);

  // ───── 목록 ─────

  const columns = [
    {
      key: "title",
      title: "이름",
      render: (menu) => (
        <>
          {menu.title}
          {menu.useYn === "N" && <span className="field-hint"> (미사용)</span>}
          {isBrokenUrl(menu.menuUrl) && (
            <span title={BROKEN_URL_HINT} aria-label={BROKEN_URL_HINT}>
              {" "}⚠
            </span>
          )}
        </>
      ),
    },
    ...(level !== "btm"
      ? [
          {
            key: "children",
            title: "하위",
            width: "56px",
            align: "num",
            render: (menu) => getChildMenus(menus, menu.id).length,
          },
        ]
      : []),
  ];

  const listPanel = (
    <Panel
      title={listTitle}
      subtitle={active ? `${items.length}개` : undefined}
      flush
      actions={
        active &&
        canCreate && (
          <Button
            size="sm"
            icon={icons.add}
            disabled={saving || orderPending}
            title={orderPending ? ORDER_PENDING_HINT : undefined}
            onClick={() => onAdd(level)}
          >
            추가
          </Button>
        )
      }
    >
      <Table
        ariaLabel={`${listTitle} 목록`}
        columns={columns}
        rows={items}
        size="sm"
        selectedKey={selectedId ?? undefined}
        onRowClick={(menu) => onSelect(level, menu.id)}
        isRowMuted={(menu) => menu.useYn === "N"}
        onReorder={canReorder && items.length > 1 ? (from, to) => onReorder(level, from, to) : undefined}
        emptyText={active ? "메뉴가 없습니다." : "상위 메뉴를 고르세요."}
      />
    </Panel>
  );

  if (!active) {
    return <div className="form-stack">{listPanel}</div>;
  }

  if (!form) {
    return (
      <div className="form-stack">
        {listPanel}
        <Panel title="상세">
          <StatusBox type="empty" size="sm" title="메뉴를 고르세요." />
        </Panel>
      </div>
    );
  }

  // ───── 상세 ─────

  const savedMenu = form.mode === "view" ? findMenu(menus, form.id) : null;
  const isNew = form.mode === "new";
  // 상위 메뉴를 바꾸면 다른 칸은 잠근다 (옮기기는 다른 수정과 따로 저장, 설계 6-6)
  const inputDisabled = !editable || saving || parentChanged;
  const showParentSelect = !isNew && editable && parentOptions.length > 0;

  const roleName = (roleId) => roles.find((role) => role.roleId === roleId)?.roleDisplayName ?? roleId;

  let badge;
  if (editing) badge = <Badge tone="warning">{isNew ? "등록 중" : "수정 중"}</Badge>;
  else if (savedMenu?.useYn === "N") badge = <Badge>미사용</Badge>;

  let footer;
  if (editing) {
    footer = (
      <>
        <Button disabled={saving} onClick={() => onCancel(level)}>
          취소
        </Button>
        <Button
          variant="primary"
          loading={saving}
          disabled={!dirty}
          title={!dirty ? "바뀐 내용이 없습니다." : undefined}
          onClick={() => onSave(level)}
        >
          {saving ? (isNew ? "등록 중..." : "저장 중...") : isNew ? "등록" : "저장"}
        </Button>
      </>
    );
  } else if (canDelete || canUpdate) {
    footer = (
      <>
        {canDelete && (
          <Button
            variant="danger"
            icon={icons.delete}
            className="btn-start"
            disabled={saving || orderPending}
            title={orderPending ? ORDER_PENDING_HINT : undefined}
            onClick={() => onDelete(level)}
          >
            삭제
          </Button>
        )}
        {canUpdate && (
          <Button
            icon={icons.edit}
            disabled={saving || orderPending}
            title={orderPending ? ORDER_PENDING_HINT : undefined}
            onClick={() => onEdit(level)}
          >
            수정
          </Button>
        )}
      </>
    );
  }

  const viewBody = savedMenu && (
    <dl className={`desc-list ${styles.desc}`}>
      <dt>ID</dt>
      <dd className="cell-mono">{savedMenu.id}</dd>

      {level !== "top" && (
        <>
          <dt>상위 메뉴</dt>
          <dd>
            {getSelfAndAncestors(menus, savedMenu.parentId)
              .reverse()
              .map((menu) => menu.title)
              .join(" › ")}
          </dd>
        </>
      )}

      <dt>상태</dt>
      <dd>
        {savedMenu.useYn === "N" ? "미사용" : "사용"}
        {level === "mid" && (savedMenu.spread === "Y" ? " · 펼침" : " · 접힘")}
      </dd>

      <dt>역할</dt>
      <dd>
        {form.roleIds.length === 0 ? (
          <span className="field-hint">없음 (최고 관리자만)</span>
        ) : (
          form.roleIds.map((roleId, index) => (
            <span key={roleId}>
              {index > 0 && " · "}
              {roleName(roleId)}
              {blockedRoleIds.has(roleId) && (
                <span className="field-hint"> (상위 메뉴에서 허용 안 됨)</span>
              )}
            </span>
          ))
        )}
      </dd>

      {level === "btm" && (
        <>
          <dt>URL</dt>
          <dd className="cell-mono">
            {savedMenu.menuUrl}
            {isBrokenUrl(savedMenu.menuUrl) && <span className="field-hint"> ⚠ {BROKEN_URL_HINT}</span>}
          </dd>
        </>
      )}

      <dt>생성</dt>
      <dd>{formatDateTime(savedMenu.crtDt)}</dd>
      <dt>수정</dt>
      <dd>{formatDateTime(savedMenu.mdfyDt)}</dd>
    </dl>
  );

  let parentHint;
  if (fieldsDirty) parentHint = "다른 변경을 저장하거나 취소한 뒤 옮길 수 있습니다.";
  else if (parentChanged) parentHint = "저장하면 메뉴를 옮깁니다. 다른 칸은 옮긴 뒤 수정할 수 있습니다.";

  const toggleRole = (roleId, checked) => {
    const roleIds = form.roleIds.filter((id) => id !== roleId);
    onChange(level, { roleIds: checked ? [...roleIds, roleId] : roleIds });
  };

  const editBody = (
    <div className="form-stack">
      {showParentSelect && (
        <Field
          label="상위 메뉴"
          htmlFor={inputId("parentId")}
          hint={parentHint}
          error={errors.parentId.join("\n")}
        >
          <select
            id={inputId("parentId")}
            className="form-control"
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
        </Field>
      )}

      <Field label="이름" htmlFor={inputId("title")} required error={errors.title.join("\n")}>
        <input
          id={inputId("title")}
          type="text"
          className="form-control"
          value={form.title}
          maxLength={100}
          disabled={inputDisabled}
          autoComplete="off"
          onChange={(e) => onChange(level, { title: e.target.value })}
          onKeyDown={(e) => isEnterKey(e) && dirty && onSave(level)}
        />
      </Field>

      <Field label="상태" group>
        <div className="form-check-group">
          <label className="form-check">
            <input
              type="checkbox"
              checked={form.useYn === "Y"}
              disabled={inputDisabled}
              onChange={(e) => onChange(level, { useYn: e.target.checked ? "Y" : "N" })}
            />{" "}
            사용
          </label>
          {level === "mid" && (
            <label className="form-check">
              <input
                type="checkbox"
                checked={form.spread === "Y"}
                disabled={inputDisabled}
                onChange={(e) => onChange(level, { spread: e.target.checked ? "Y" : "N" })}
              />{" "}
              펼침
            </label>
          )}
        </div>
      </Field>

      <Field label="역할" group hint="체크한 역할만 이 메뉴를 볼 수 있습니다.">
        <div className="form-check-group">
          {roles.map((role) => {
            const isSuperAdmin = role.roleId === SUPER_ADMIN_ROLE_ID;
            const checked = isSuperAdmin || form.roleIds.includes(role.roleId);
            return (
              <label key={role.roleId} className="form-check">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={isSuperAdmin || inputDisabled}
                  onChange={(e) => toggleRole(role.roleId, e.target.checked)}
                />{" "}
                {isSuperAdmin ? `${role.roleDisplayName}(고정)` : role.roleDisplayName}
                {!isSuperAdmin && checked && blockedRoleIds.has(role.roleId) && (
                  <span className="field-hint"> (상위 메뉴에서 허용 안 됨)</span>
                )}
              </label>
            );
          })}
        </div>
      </Field>

      {level === "btm" && (
        <Field label="URL" htmlFor={inputId("menuUrl")} required error={errors.menuUrl.join("\n")}>
          <select
            id={inputId("menuUrl")}
            className="form-control"
            value={form.menuUrl}
            disabled={inputDisabled}
            onChange={(e) => onChange(level, { menuUrl: e.target.value })}
          >
            <option value="">URL을 고르세요.</option>
            {urlOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.text}
              </option>
            ))}
          </select>
        </Field>
      )}

      {errors.etc.map((message) => (
        <p key={message} className="field-error" role="alert">
          {message}
        </p>
      ))}
    </div>
  );

  return (
    <div className="form-stack">
      {listPanel}
      <Panel
        title={isNew ? `새 ${levelTitle}` : (savedMenu?.title ?? levelTitle)}
        badge={badge}
        footer={footer}
      >
        <div className="form-stack">
          {showSelfLockNotice && <Callout tone="warning">{SELF_LOCK_NOTICE}</Callout>}
          {editing ? editBody : viewBody}
        </div>
      </Panel>
    </div>
  );
}
