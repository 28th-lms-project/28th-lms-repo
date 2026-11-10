/** @format */

import {useEffect, useMemo, useState} from "react";
import PageContainer from "../../../common/PageContainer";
import usePermission from "../../../../hooks/usePermission";

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

    if (status === "loaded" && isSuperAdmin) return <AccessRoleManagement />;

    // idle: 비로그인(조회하지 않음) → 표시 없음
    let content = null;
    if (status === "loading") {
        content = <p className={styles.notice}>권한 확인 중...</p>;
    } else if (status === "failed") {
        content = (
            <p className={styles.notice}>
                권한 정보를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.
            </p>
        );
    } else if (status === "loaded") {
        content = <p className={styles.notice}>권한이 없습니다.</p>;
    }

    return <PageContainer>{content}</PageContainer>;
}

function AccessRoleManagement() {
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

    const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);

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
            alert(getErrorMessage(error));
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
            alert(getErrorMessage(error));
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
        setSelectedPermissionIds([]);
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
        setSelectedPermissionIds([]);
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

    const filteredPermissions = useMemo(
        () =>
            permissionList.filter(
                (item) =>
                    (!selectedLvl1 || item.lvl1 === selectedLvl1) &&
                    (!selectedLvl2 || item.lvl2 === selectedLvl2) &&
                    (!selectedLvl3 || item.lvl3 === selectedLvl3)
            ),
        [permissionList, selectedLvl1, selectedLvl2, selectedLvl3]
    );

    const currentAllowedIds = rolePermissions;

    const allowedPermissions = filteredPermissions.filter((item) =>
        currentAllowedIds.includes(item.actionId)
    );

    const deniedPermissions = filteredPermissions.filter(
        (item) => !currentAllowedIds.includes(item.actionId)
    );

    // 역할 선택
    const roleClickHandler = async (roleId) => {
        setSelectedRole(roleId);

        setSelectedPermissionIds([]);

        setSelectedLvl1("");
        setSelectedLvl2("");
        setSelectedLvl3("");

        setAllowedList([]);
        setDeniedList([]);

        setSavedPermissions([]);
        setRolePermissions([]);

        await fetchPermissionList(roleId);
    };

    // 허용되지 않은 권한 클릭 -> 권한 부여
    const grantPermissionHandler = (permissionId) => {
        setRolePermissions((prev) =>
            [...new Set([...prev, permissionId])]
        );

        setSelectedPermissionIds((prev) =>
            prev.filter((id) => id !== permissionId)
        );
    };

    // 허용된 권한 클릭 -> 권한 해제
    const revokePermissionHandler = (permissionId) => {
        setRolePermissions((prev) =>
            prev.filter((id) => id !== permissionId)
        );
    };

    // 전체 선택 체크
    const isAllSelected =
        deniedPermissions.length > 0 &&
        deniedPermissions.every((item) =>
            selectedPermissionIds.includes(item.actionId)
        );

    // 전체 선택 / 해제
    const checkAllHandler = () => {
        if (isAllSelected) {
            setSelectedPermissionIds([]);
        } else {
            setSelectedPermissionIds(
                deniedPermissions.map((item) => item.actionId)
            );
        }
    };

    // 선택한 권한 일괄 부여
    const grantSelectedHandler = () => {
        if (selectedPermissionIds.length === 0) return;

        setRolePermissions((prev) =>
            [...new Set([...prev, ...selectedPermissionIds])]
        );

        setSelectedPermissionIds([]);
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

            alert("권한이 저장되었습니다.");

            await fetchPermissionList(selectedRole);

            setSelectedPermissionIds([]);
        } catch (error) {
            console.error("권한 저장 실패", error);
            alert(getErrorMessage(error));
        }
    };

    // 저장된 데이터로 롤백
    const rollbackHandler = () => {
        if (!selectedRole) return;

        setRolePermissions([...savedPermissions]);
        setSelectedPermissionIds([]);
    };

    return (
        <PageContainer>
            <div style={{width: "100%"}}>
                <div
                    className="access-role-layout"
                    style={{
                        display: "grid",
                        gridTemplateColumns: selectedRole
                            ? "1fr 1.1fr 1.1fr"
                            : "1fr",
                        gap: "15px",
                        minHeight: "calc(100vh - 135px)",
                    }}
                >
                    {/* 첫 번째 영역: 권한 목록 */}
                    <section className={styles.panel}>
                        <h3 className={styles.panelTitle}>권한 목록</h3>

                        <div className={styles.listHeader}>
                            Role Display Name
                        </div>

                        <div className={styles.roleList}>
                            {roleList.map((role) => (
                                <div
                                    key={role.roleId}
                                    onClick={() => roleClickHandler(role.roleId)}
                                    className={`${styles.listItem} ${
                                        selectedRole === role.roleId ? styles.selected : ""
                                    }`}
                                >
                                    {role.roleDisplayName}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 역할을 선택했을 때만 나머지 영역 표시 */}
                    {selectedRole && (
                        <>
                            {/* 두 번째 영역: 허용된 권한 */}
                            <section className={styles.panel}>
                                <div className={styles.filterArea}>
                                    <select
                                        value={selectedLvl1}
                                        onChange={(e) => lvl1ChangeHandler(e.target.value)}
                                        className={styles.select}
                                    >
                                        <option value="">대 메뉴 선택</option>
                                        {lvl1Options.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={selectedLvl2}
                                        onChange={(e) => lvl2ChangeHandler(e.target.value)}
                                        disabled={!selectedLvl1}
                                        className={styles.select}
                                    >
                                        <option value="">중 메뉴 선택</option>
                                        {lvl2Options.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={selectedLvl3}
                                        onChange={(e) => {
                                            setSelectedLvl3(e.target.value);
                                            setSelectedPermissionIds([]);
                                        }}
                                        disabled={!selectedLvl2}
                                        className={styles.select}
                                    >
                                        <option value="">소 메뉴 선택</option>
                                        {lvl3Options.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.buttonArea}>
                                    <button
                                        type="button"
                                        onClick={saveHandler}
                                        className={styles.button}
                                    >
                                        ✓ 저장
                                    </button>

                                    <button
                                        type="button"
                                        onClick={rollbackHandler}
                                        className={styles.button}
                                    >
                                        ✓ 변경 취소
                                    </button>
                                </div>

                                <div className={styles.listHeader}>
                                    허용된 권한
                                </div>

                                <div className={styles.permissionList}>
                                    {allowedPermissions.length > 0 ? (
                                        allowedPermissions.map((item) => (
                                            <div
                                                key={item.actionId}
                                                onClick={() => revokePermissionHandler(item.actionId)}
                                                className={styles.listItem}
                                                title="클릭하면 권한이 해제됩니다."
                                            >
                                                {item.actionName}
                                            </div>
                                        ))
                                    ) : (
                                        <div className={styles.empty}>
                                            허용된 권한이 없습니다.
                                        </div>
                                    )}
                                </div>

                                <div className={styles.count}>
                                    허용 권한 {allowedPermissions.length}건
                                </div>
                            </section>

                            {/* 세 번째 영역: 허용되지 않은 권한 */}
                            <section className={styles.panel}>
                                <div className={styles.filterArea}>
                                    <select
                                        value={selectedLvl1}
                                        onChange={(e) => lvl1ChangeHandler(e.target.value)}
                                        className={styles.select}
                                    >
                                        <option value="">대 메뉴 선택</option>
                                        {lvl1Options.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={selectedLvl2}
                                        onChange={(e) => lvl2ChangeHandler(e.target.value)}
                                        disabled={!selectedLvl1}
                                        className={styles.select}
                                    >
                                        <option value="">중 메뉴 선택</option>
                                        {lvl2Options.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={selectedLvl3}
                                        onChange={(e) => {
                                            setSelectedLvl3(e.target.value);
                                            setSelectedPermissionIds([]);
                                        }}
                                        disabled={!selectedLvl2}
                                        className={styles.select}
                                    >
                                        <option value="">소 메뉴 선택</option>
                                        {lvl3Options.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.buttonArea}>
                                    <button
                                        type="button"
                                        onClick={checkAllHandler}
                                        className={styles.button}
                                    >
                                        ✓ {isAllSelected ? "선택 해제" : "전체 선택"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={grantSelectedHandler}
                                        disabled={
                                            selectedPermissionIds.length === 0
                                        }
                                        className={styles.button}
                                    >
                                        ✓ 선택 권한 부여
                                    </button>
                                </div>

                                <div className={styles.listHeader}>
                                    접근 권한 명
                                </div>

                                <div className={styles.permissionList}>
                                    {deniedPermissions.length > 0 ? (
                                        deniedPermissions.map((item) => (
                                            <div
                                                key={item.actionId}
                                                onClick={() => grantPermissionHandler(item.actionId)}
                                                className={`${styles.listItem} ${
                                                    selectedPermissionIds.includes(item.actionId)
                                                        ? styles.selected
                                                        : ""
                                                }`}
                                                title="클릭하면 권한이 부여됩니다."
                                            >
                                                {item.actionName}
                                            </div>
                                        ))
                                    ) : (
                                        <div className={styles.empty}>
                                            미허용 권한이 없습니다.
                                        </div>
                                    )}
                                </div>

                                <div className={styles.count}>
                                    미허용 권한 {deniedPermissions.length}건
                                    {selectedPermissionIds.length > 0 &&
                                        ` / ${selectedPermissionIds.length}건 선택`}
                                </div>
                            </section>
                        </>
                    )}
                </div>
            </div>
        </PageContainer>
    );
}