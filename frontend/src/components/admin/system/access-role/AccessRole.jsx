/** @format */

import {useEffect, useMemo, useState} from "react";
import useBreadcrumbs from "../../../../hooks/useBreadcrumbs";
import usePermission from "../../../../hooks/usePermission";
import Button from "../../../common/ui/Button.jsx";
import Callout from "../../../common/ui/Callout.jsx";
import PageHeader from "../../../common/ui/PageHeader.jsx";
import Panel from "../../../common/ui/Panel.jsx";
import StatusBox from "../../../common/ui/StatusBox.jsx";
import TransferList from "../../../common/ui/TransferList.jsx";
import {useConfirm, useToast} from "../../../common/ui/feedbackContext.js";

import {
    getAllowedPermissionList,
    getDeniedPermissionList,
    saveRolePermission,
} from "../../../../api/admin/system/access-role/accessRoleApi";
import {getRoles} from "../../../../api/admin/system/role/roleApi";
import {SUPER_ADMIN_ROLE_ID} from "../role/roleUtils";

import styles from "./AccessRole.module.css";

// 입력값 검증 실패면 필드별 메시지를, 아니면 서버 에러 메시지를 반환
const getErrorMessage = (error) =>
    error.validations
        ? Object.values(error.validations).flat().join("\n")
        : error.message;

/**
 * 권한별 접근 권한 관리
 * ROLE_SUPER_ADMIN 전용 화면 (D-03). 화면 숨김은 표시용이며 실제 차단은 서버(@RequireSuperAdmin)가 한다.
 * 권한이 있을 때만 AccessRoleManagement를 마운트하므로, 권한 없이 화면의 API를 호출하지 않는다.
 */
export default function AccessRole() {
    const {isSuperAdmin, status} = usePermission();
    const crumbs = useBreadcrumbs();

    // idle: 비로그인(조회하지 않음) → 표시 없음
    let content = null;
    if (status === "loaded" && isSuperAdmin) {
        content = <AccessRoleManagement />;
    } else if (status === "loading") {
        content = <StatusBox type="loading" title="권한 확인 중..." />;
    } else if (status === "failed") {
        content = (
            <StatusBox
                type="error"
                title="권한 정보를 불러오지 못했습니다."
                detail="새로고침한 뒤 다시 시도하세요."
            />
        );
    } else if (status === "loaded") {
        content = <StatusBox type="denied" />;
    }

    return (
        <>
            <PageHeader crumbs={crumbs} title={crumbs.at(-1)?.title} />
            {content}
        </>
    );
}

function AccessRoleManagement() {
    const toast = useToast();
    const confirm = useConfirm();

    const [roleList, setRoleList] = useState([]);
    const [allowedList, setAllowedList] = useState([]);
    const [deniedList, setDeniedList] = useState([]);

    // 기본적으로 아무 역할도 선택하지 않음
    const [selectedRole, setSelectedRole] = useState("");

    // DB 저장 기준 데이터
    const [savedPermissions, setSavedPermissions] = useState([]);

    // 화면에서 수정 중인 데이터
    const [rolePermissions, setRolePermissions] = useState([]);

    const [selectedLvl1, setSelectedLvl1] = useState("");
    const [selectedLvl2, setSelectedLvl2] = useState("");
    const [selectedLvl3, setSelectedLvl3] = useState("");

    // 역할 목록 조회
    const fetchRoleList = async () => {
        try {
            const body = await getRoles();

            // ROLE_SUPER_ADMIN은 항상 모든 권한을 가지므로 권한 설정 대상에서 제외 (D-03)
            setRoleList(
                (body?.roleList ?? []).filter(
                    (role) => role.roleId !== SUPER_ADMIN_ROLE_ID
                )
            );
        } catch (error) {
            console.error("역할 목록 조회 실패", error);
            toast.error(getErrorMessage(error));
        }
    };

    // 역할 선택 시 권한 조회
    const fetchPermissionList = async (roleId) => {
        if (!roleId) return;

        try {
            const params = {roleId};

            const [allowed, denied] = await Promise.all([
                getAllowedPermissionList(params),
                getDeniedPermissionList(params),
            ]);

            const allowedData = allowed ?? [];
            const deniedData = denied ?? [];

            setAllowedList(allowedData);
            setDeniedList(deniedData);

            const permissionIds = allowedData.map(
                (item) => item.actionId
            );

            setSavedPermissions(permissionIds);
            setRolePermissions(permissionIds);
        } catch (error) {
            console.error("권한 목록 조회 실패", error);
            toast.error(getErrorMessage(error));
        }
    };

    const permissionList = useMemo(
        () => [...allowedList, ...deniedList],
        [allowedList, deniedList]
    );

    useEffect(() => {
        fetchRoleList();
    }, []);

    const lvl1Options = useMemo(
        () => [...new Set(permissionList.map((item) => item.lvl1))],
        [permissionList]
    );

    const lvl1ChangeHandler = (value) => {
        setSelectedLvl1(value);
        setSelectedLvl2("");
        setSelectedLvl3("");
    };

    const lvl2Options = useMemo(
        () => [
            ...new Set(
                permissionList
                    .filter(
                        (item) =>
                            !selectedLvl1 || item.lvl1 === selectedLvl1
                    )
                    .map((item) => item.lvl2)
            ),
        ],
        [permissionList, selectedLvl1]
    );

    const lvl2ChangeHandler = (value) => {
        setSelectedLvl2(value);
        setSelectedLvl3("");
    };

    const lvl3Options = useMemo(
        () => [
            ...new Set(
                permissionList
                    .filter(
                        (item) =>
                            (!selectedLvl1 || item.lvl1 === selectedLvl1) &&
                            (!selectedLvl2 || item.lvl2 === selectedLvl2)
                    )
                    .map((item) => item.lvl3)
            ),
        ],
        [permissionList, selectedLvl1, selectedLvl2]
    );

    const clearFilter = () => {
        setSelectedLvl1("");
        setSelectedLvl2("");
        setSelectedLvl3("");
    };

    // 메뉴 필터는 미허용 후보만 좁힌다 (허용 목록은 늘 전부 보임)
    const transferItems = useMemo(
        () =>
            permissionList.filter(
                (item) =>
                    rolePermissions.includes(item.actionId) ||
                    ((!selectedLvl1 || item.lvl1 === selectedLvl1) &&
                        (!selectedLvl2 || item.lvl2 === selectedLvl2) &&
                        (!selectedLvl3 || item.lvl3 === selectedLvl3))
            ),
        [permissionList, rolePermissions, selectedLvl1, selectedLvl2, selectedLvl3]
    );

    // 저장 전 변경 (허용 +n · 해제 -n)
    const addedCount = rolePermissions.filter(
        (id) => !savedPermissions.includes(id)
    ).length;
    const removedCount = savedPermissions.filter(
        (id) => !rolePermissions.includes(id)
    ).length;
    const isDirty = addedCount + removedCount > 0;

    // 역할 선택 (저장하지 않은 변경이 있으면 확인)
    const roleClickHandler = async (roleId) => {
        if (roleId === selectedRole) return;
        if (
            isDirty &&
            !(await confirm({
                message: "저장하지 않은 변경이 있습니다. 버리고 다른 역할로 갈까요?",
                confirmText: "버리고 이동",
                danger: true,
            }))
        )
            return;

        setSelectedRole(roleId);

        clearFilter();

        setAllowedList([]);
        setDeniedList([]);

        setSavedPermissions([]);
        setRolePermissions([]);

        await fetchPermissionList(roleId);
    };

    // 권한 저장
    const saveHandler = async () => {
        if (!selectedRole) return;

        try {
            const params = {
                roleId: selectedRole,
                actionIds: rolePermissions,
            };

            await saveRolePermission(params);

            toast.success("권한을 저장했습니다.");

            await fetchPermissionList(selectedRole);
        } catch (error) {
            console.error("권한 저장 실패", error);
            toast.error(getErrorMessage(error));
        }
    };

    // 저장된 데이터로 롤백
    const rollbackHandler = () => {
        if (!selectedRole) return;

        setRolePermissions([...savedPermissions]);
    };

    const selectedRoleName =
        roleList.find((role) => role.roleId === selectedRole)?.roleDisplayName ??
        "";

    const hasFilter = Boolean(selectedLvl1 || selectedLvl2 || selectedLvl3);

    return (
        <div className={`layout-split layout-split-start ${styles.layout}`}>
            {/* 역할 목록 */}
            <Panel title="역할" flush>
                <ul className="list-group">
                    {roleList.map((role) => (
                        <li key={role.roleId}>
                            <button
                                type="button"
                                className="list-item"
                                aria-current={role.roleId === selectedRole || undefined}
                                onClick={() => roleClickHandler(role.roleId)}
                            >
                                {role.roleDisplayName}
                            </button>
                        </li>
                    ))}
                </ul>
            </Panel>

            {/* 역할을 선택했을 때만 권한 옮기기 표시 */}
            {!selectedRole ? (
                <StatusBox
                    type="empty"
                    title="역할을 고르세요."
                    detail="왼쪽에서 역할을 고르면 허용 · 미허용 권한을 바꿀 수 있습니다."
                />
            ) : (
                <div className="form-stack">
                    {/* 메뉴 필터 (대 › 중 › 소) */}
                    <div className="toolbar">
                        <div className="input-range" role="group" aria-label="메뉴 필터">
                            <select
                                value={selectedLvl1}
                                onChange={(e) => lvl1ChangeHandler(e.target.value)}
                                className="form-control form-control-sm"
                                aria-label="대 메뉴"
                            >
                                <option value="">대 메뉴 전체</option>
                                {lvl1Options.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                            <span className="input-range-sep">›</span>
                            <select
                                value={selectedLvl2}
                                onChange={(e) => lvl2ChangeHandler(e.target.value)}
                                disabled={!selectedLvl1}
                                className="form-control form-control-sm"
                                aria-label="중 메뉴"
                            >
                                <option value="">
                                    {selectedLvl1 ? "중 메뉴 전체" : "대 메뉴를 먼저"}
                                </option>
                                {lvl2Options.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                            <span className="input-range-sep">›</span>
                            <select
                                value={selectedLvl3}
                                onChange={(e) => setSelectedLvl3(e.target.value)}
                                disabled={!selectedLvl2}
                                className="form-control form-control-sm"
                                aria-label="소 메뉴"
                            >
                                <option value="">
                                    {selectedLvl2 ? "소 메뉴 전체" : "중 메뉴를 먼저"}
                                </option>
                                {lvl3Options.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {hasFilter && (
                            <Button size="sm" variant="text" onClick={clearFilter}>
                                필터 지우기
                            </Button>
                        )}
                    </div>

                    {/* 저장 전 변경 안내 */}
                    {isDirty && (
                        <Callout
                            tone="info"
                            actions={
                                <>
                                    <Button size="sm" onClick={rollbackHandler}>
                                        되돌리기
                                    </Button>
                                    <Button size="sm" variant="primary" onClick={saveHandler}>
                                        저장
                                    </Button>
                                </>
                            }
                        >
                            저장하지 않은 변경: 허용 +{addedCount} · 해제 -{removedCount}
                        </Callout>
                    )}

                    {/* 미허용 ↔ 허용 옮기기 (체크 후 버튼, 두 번 누르면 바로) */}
                    <TransferList
                        key={selectedRole}
                        items={transferItems}
                        selectedKeys={rolePermissions}
                        onChange={setRolePermissions}
                        rowKey="actionId"
                        renderItem={(item) => item.actionName}
                        leftTitle="미허용"
                        leftTone="danger"
                        rightTitle={`허용 (${selectedRoleName})`}
                        rightTone="success"
                    />
                </div>
            )}
        </div>
    );
}
