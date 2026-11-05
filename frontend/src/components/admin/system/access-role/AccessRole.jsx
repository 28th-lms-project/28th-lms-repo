/** @format */

import {useMemo, useState} from "react";
import PageContainer from "../../../common/PageContainer";

import {
    getRoleList,
    getAllowedPermissionList,
    getDeniedPermissionList,
    saveRolePermission,
} from "../../../../api/admin/system/access-role/accessRoleApi";


const roleList = [
    {id: "SUPER", name: "슈퍼관리자"},
    {id: "ADMIN", name: "관리자"},
    {id: "LECTURER", name: "강사"},
    {id: "STUDENT", name: "수강생"},
    {id: "TEST", name: "테스트 역할"},
];

const permissionList = [
    {id: 1, name: "강사 내용 조회", lvl1: "System Management", lvl2: "강사 관리", lvl3: "강사 관리"},
    {id: 2, name: "강사 목록 조회", lvl1: "System Management", lvl2: "강사 관리", lvl3: "강사 관리"},
    {id: 3, name: "강사 삭제", lvl1: "System Management", lvl2: "강사 관리", lvl3: "강사 관리"},
    {id: 4, name: "과제 내용 수정", lvl1: "My Page", lvl2: "수강 과정", lvl3: "수강 과정"},
    {id: 5, name: "과제 내용 조회", lvl1: "My Page", lvl2: "수강 과정", lvl3: "수강 과정"},
    {id: 6, name: "과제 댓글 삭제", lvl1: "My Page", lvl2: "수강 과정", lvl3: "수강 과정"},
    {id: 7, name: "과제 댓글 수정", lvl1: "My Page", lvl2: "수강 과정", lvl3: "수강 과정"},
    {id: 8, name: "과제 댓글 새로고침", lvl1: "My Page", lvl2: "수강 과정", lvl3: "수강 과정"},
    {id: 9, name: "수강생 본인 시험 성적 보기", lvl1: "My Page", lvl2: "수강 과정", lvl3: "수강 과정"},
    {id: 10, name: "수강생 본인 차트 보기", lvl1: "My Page", lvl2: "수강 과정", lvl3: "수강 과정"},
    {id: 11, name: "수강생 본인 출결 조회", lvl1: "My Page", lvl2: "수강 과정", lvl3: "수강 과정"},
    {id: 12, name: "시험 응시", lvl1: "My Page", lvl2: "시험 관리", lvl3: "시험 응시"},
    {id: 13, name: "설문 응답", lvl1: "My Page", lvl2: "설문 관리", lvl3: "설문 응답"},
    {id: 14, name: "관리자 삭제", lvl1: "System Management", lvl2: "관리자 관리", lvl3: "관리자 관리"},
    {id: 15, name: "로그인 초기화", lvl1: "System Management", lvl2: "관리자 관리", lvl3: "관리자 관리"},
    {id: 16, name: "비밀번호 초기화", lvl1: "System Management", lvl2: "관리자 관리", lvl3: "관리자 관리"},
    {id: 17, name: "새 관리자 추가", lvl1: "System Management", lvl2: "관리자 관리", lvl3: "관리자 관리"},
    {id: 18, name: "메뉴 관리", lvl1: "System Management", lvl2: "메뉴 관리", lvl3: "메뉴 관리"},
    {id: 19, name: "권한 관리", lvl1: "System Management", lvl2: "시스템 관리", lvl3: "권한 관리"},
    {id: 20, name: "접근 권한 조회", lvl1: "System Management", lvl2: "시스템 관리", lvl3: "접근 권한 조회"},
];

const initialRolePermissions = {
    SUPER: permissionList.map((item) => item.id),
    ADMIN: [1, 2, 3, 4, 5, 6, 7, 8, 14, 15, 16, 17, 18, 19, 20],
    LECTURER: [1, 2, 3, 4, 5, 6, 7, 8],
    STUDENT: [9, 10, 11, 12, 13],
    TEST: [4, 5],
};

const selectStyle = {
    width: "100%",
    height: "37px",
    padding: "0 10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    backgroundColor: "#fff",
    fontSize: "13px",
};

const buttonStyle = {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    height: "29px",
    padding: "0 9px",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "#eee",
    color: "#666",
    fontSize: "12px",
    cursor: "pointer",
    whiteSpace: "nowrap",
};

export default function AccessRole() {
    // const [roleList, setRoleList] = useState([]);
    // const [allowedList, setAllowedList] = useState([]);
    // const [deniedList, setDeniedList] = useState([]);

    // 기본적으로 아무 역할도 선택하지 않음
    const [selectedRole, setSelectedRole] = useState("");

    // DB 저장 기준 데이터
    const [savedPermissions, setSavedPermissions] = useState(() =>
        Object.fromEntries(
            Object.entries(initialRolePermissions).map(([key, value]) => [
                key,
                [...value],
            ]),
        ),
    );

    // 화면에서 수정 중인 데이터
    const [rolePermissions, setRolePermissions] = useState(() =>
        Object.fromEntries(
            Object.entries(initialRolePermissions).map(([key, value]) => [
                key,
                [...value],
            ]),
        ),
    );

    const [selectedLvl1, setSelectedLvl1] = useState("");
    const [selectedLvl2, setSelectedLvl2] = useState("");
    const [selectedLvl3, setSelectedLvl3] = useState("");

    const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);

    // // 역할 목록 조회
    // const fetchRoleList = async () => {
    //     try {
    //         const response = await getRoleList();
    //
    //         if (response.responseCode === "SUCCESS") {
    //             setRoleList(response.data || []);
    //         }
    //     } catch (error) {
    //         console.error("역할 목록 조회 실패", error);
    //     }
    // };
    //
    // // 역할 선택 시 권한 조회
    // const fetchPermissionList = async (roleId) => {
    //     if (!roleId) return;
    //
    //     try {
    //         const params = { roleId };
    //
    //         const [allowed, denied] = await Promise.all([
    //             getAllowedPermissionList(params),
    //             getDeniedPermissionList(params),
    //         ]);
    //
    //         if (
    //             allowed.responseCode === "SUCCESS" &&
    //             denied.responseCode === "SUCCESS"
    //         ) {
    //             setAllowedList(allowed.data || []);
    //             setDeniedList(denied.data || []);
    //         }
    //     } catch (error) {
    //         console.error("권한 목록 조회 실패", error);
    //     }
    // };
    //
    // // 권한 저장
    // const handleSave = async (params) => {
    //     try {
    //         const response = await saveRolePermission(params);
    //
    //         if (response.responseCode === "SUCCESS") {
    //             alert("저장되었습니다.");
    //             fetchPermissionList(selectedRole);
    //         }
    //     } catch (error) {
    //         console.error("권한 저장 실패", error);
    //     }
    // };
    //
    // useEffect(() => {
    //     fetchRoleList();
    // }, []);

    const lvl1Options = useMemo(
        () => [...new Set(permissionList.map((item) => item.lvl1))],
        [],
    );

    const lvl2Options = useMemo(
        () => [
            ...new Set(
                permissionList
                    .filter(
                        (item) =>
                            !selectedLvl1 || item.lvl1 === selectedLvl1,
                    )
                    .map((item) => item.lvl2),
            ),
        ],
        [selectedLvl1],
    );

    const lvl3Options = useMemo(
        () => [
            ...new Set(
                permissionList
                    .filter(
                        (item) =>
                            (!selectedLvl1 || item.lvl1 === selectedLvl1) &&
                            (!selectedLvl2 || item.lvl2 === selectedLvl2),
                    )
                    .map((item) => item.lvl3),
            ),
        ],
        [selectedLvl1, selectedLvl2],
    );

    const filteredPermissions = useMemo(
        () =>
            permissionList.filter(
                (item) =>
                    (!selectedLvl1 || item.lvl1 === selectedLvl1) &&
                    (!selectedLvl2 || item.lvl2 === selectedLvl2) &&
                    (!selectedLvl3 || item.lvl3 === selectedLvl3),
            ),
        [selectedLvl1, selectedLvl2, selectedLvl3],
    );

    const currentAllowedIds = selectedRole
        ? rolePermissions[selectedRole] || []
        : [];

    const allowedPermissions = filteredPermissions.filter((item) =>
        currentAllowedIds.includes(item.id),
    );

    const deniedPermissions = filteredPermissions.filter(
        (item) => !currentAllowedIds.includes(item.id),
    );

    // 역할 선택
    const roleClickHandler = (roleId) => {
        setSelectedRole(roleId);
        setSelectedPermissionIds([]);
        setSelectedLvl1("");
        setSelectedLvl2("");
        setSelectedLvl3("");
    };

    // 허용되지 않은 권한 클릭 -> 권한 부여
    const grantPermissionHandler = (permissionId) => {
        setRolePermissions((prev) => ({
            ...prev,
            [selectedRole]: [
                ...new Set([
                    ...(prev[selectedRole] || []),
                    permissionId,
                ]),
            ],
        }));

        setSelectedPermissionIds((prev) =>
            prev.filter((id) => id !== permissionId),
        );
    };

    // 허용된 권한 클릭 -> 권한 해제
    const revokePermissionHandler = (permissionId) => {
        setRolePermissions((prev) => ({
            ...prev,
            [selectedRole]: (prev[selectedRole] || []).filter(
                (id) => id !== permissionId,
            ),
        }));
    };

    // 전체 선택 체크
    const isAllSelected =
        deniedPermissions.length > 0 &&
        deniedPermissions.every((item) =>
            selectedPermissionIds.includes(item.id),
        );

    const checkAllHandler = () => {
        if (isAllSelected) {
            setSelectedPermissionIds([]);
        } else {
            setSelectedPermissionIds(
                deniedPermissions.map((item) => item.id),
            );
        }
    };

    // 선택한 권한 일괄 부여
    const grantSelectedHandler = () => {
        if (selectedPermissionIds.length === 0) return;

        setRolePermissions((prev) => ({
            ...prev,
            [selectedRole]: [
                ...new Set([
                    ...(prev[selectedRole] || []),
                    ...selectedPermissionIds,
                ]),
            ],
        }));

        setSelectedPermissionIds([]);
    };

    // 저장
    const saveHandler = () => {
        if (!selectedRole) return;

        const currentIds = rolePermissions[selectedRole] || [];

        // TODO: 실제 권한 저장 API 연결
        setSavedPermissions((prev) => ({
            ...prev,
            [selectedRole]: [...currentIds],
        }));

        alert("권한이 저장되었습니다.");
    };

    // 전체 삭제: 저장된 데이터로 롤백
    const rollbackHandler = () => {
        if (!selectedRole) return;

        setRolePermissions((prev) => ({
            ...prev,
            [selectedRole]: [...(savedPermissions[selectedRole] || [])],
        }));

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
                    <section style={panelStyle}>
                        <h3 style={panelTitleStyle}>권한 목록</h3>

                        <div style={listHeaderStyle}>
                            Role Display Name
                        </div>

                        <div style={roleListStyle}>
                            {roleList.map((role) => (
                                <div
                                    key={role.id}
                                    onClick={() => roleClickHandler(role.id)}
                                    style={{
                                        ...listItemStyle,
                                        cursor: "pointer",
                                        backgroundColor:
                                            selectedRole === role.id
                                                ? "#ddd"
                                                : undefined,
                                    }}
                                >
                                    {role.name}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 역할을 선택했을 때만 나머지 영역 표시 */}
                    {selectedRole && (
                        <>
                            {/* 두 번째 영역: 허용된 권한 */}
                            <section style={panelStyle}>
                                <div style={filterAreaStyle}>
                                    <select
                                        value={selectedLvl1}
                                        onChange={(e) => {
                                            setSelectedLvl1(e.target.value);
                                            setSelectedLvl2("");
                                            setSelectedLvl3("");
                                            setSelectedPermissionIds([]);
                                        }}
                                        style={selectStyle}
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
                                        onChange={(e) => {
                                            setSelectedLvl2(e.target.value);
                                            setSelectedLvl3("");
                                            setSelectedPermissionIds([]);
                                        }}
                                        style={selectStyle}
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
                                        style={selectStyle}
                                    >
                                        <option value="">소 메뉴 선택</option>
                                        {lvl3Options.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={buttonAreaStyle}>
                                    <button
                                        type="button"
                                        onClick={saveHandler}
                                        style={buttonStyle}
                                    >
                                        ✓ 저장
                                    </button>

                                    <button
                                        type="button"
                                        onClick={rollbackHandler}
                                        style={buttonStyle}
                                    >
                                        ✓ 전체 삭제
                                    </button>
                                </div>

                                <div style={listHeaderStyle}>
                                    허용된 권한
                                </div>

                                <div style={permissionListStyle}>
                                    {allowedPermissions.length > 0 ? (
                                        allowedPermissions.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() =>
                                                    revokePermissionHandler(
                                                        item.id,
                                                    )
                                                }
                                                style={{
                                                    ...listItemStyle,
                                                    cursor: "pointer",
                                                }}
                                                title="클릭하면 권한이 해제됩니다."
                                            >
                                                {item.name}
                                            </div>
                                        ))
                                    ) : (
                                        <div style={emptyStyle}>
                                            허용된 권한이 없습니다.
                                        </div>
                                    )}
                                </div>

                                <div style={countStyle}>
                                    허용 권한 {allowedPermissions.length}건
                                </div>
                            </section>

                            {/* 세 번째 영역: 허용되지 않은 권한 */}
                            <section style={panelStyle}>
                                <div style={filterAreaStyle}>
                                    <select
                                        value={selectedLvl1}
                                        onChange={(e) => {
                                            setSelectedLvl1(e.target.value);
                                            setSelectedLvl2("");
                                            setSelectedLvl3("");
                                            setSelectedPermissionIds([]);
                                        }}
                                        style={selectStyle}
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
                                        onChange={(e) => {
                                            setSelectedLvl2(e.target.value);
                                            setSelectedLvl3("");
                                            setSelectedPermissionIds([]);
                                        }}
                                        style={selectStyle}
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
                                        style={selectStyle}
                                    >
                                        <option value="">소 메뉴 선택</option>
                                        {lvl3Options.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={buttonAreaStyle}>
                                    <button
                                        type="button"
                                        onClick={checkAllHandler}
                                        style={buttonStyle}
                                    >
                                        ✓ {isAllSelected ? "선택 해제" : "전체 선택"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={grantSelectedHandler}
                                        disabled={
                                            selectedPermissionIds.length === 0
                                        }
                                        style={{
                                            ...buttonStyle,
                                            opacity:
                                                selectedPermissionIds.length ===
                                                0
                                                    ? 0.5
                                                    : 1,
                                        }}
                                    >
                                        ✓ 선택 권한 부여
                                    </button>
                                </div>

                                <div style={listHeaderStyle}>
                                    접근 권한 명
                                </div>

                                <div style={permissionListStyle}>
                                    {deniedPermissions.length > 0 ? (
                                        deniedPermissions.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() =>
                                                    grantPermissionHandler(
                                                        item.id,
                                                    )
                                                }
                                                style={{
                                                    ...listItemStyle,
                                                    backgroundColor:
                                                        selectedPermissionIds.includes(
                                                            item.id,
                                                        )
                                                            ? "#ddd"
                                                            : undefined,
                                                    cursor: "pointer",
                                                }}
                                                title="클릭하면 권한이 부여됩니다."
                                            >
                                                {item.name}
                                            </div>
                                        ))
                                    ) : (
                                        <div style={emptyStyle}>
                                            미허용 권한이 없습니다.
                                        </div>
                                    )}
                                </div>

                                <div style={countStyle}>
                                    미허용 권한 {deniedPermissions.length}건
                                    {selectedPermissionIds.length > 0 &&
                                        ` / ${selectedPermissionIds.length}건 선택`}
                                </div>
                            </section>
                        </>
                    )}
                </div>
            </div>

            <style jsx>{`
                @media (max-width: 1000px) {
                    .access-role-layout {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </PageContainer>
    );
}

const panelStyle = {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    minHeight: "700px",
    padding: "30px",
    backgroundColor: "#fff",
};

const panelTitleStyle = {
    fontSize: "17px",
    fontWeight: "bold",
    paddingBottom: "25px",
    margin: 0,
    borderBottom: "1px solid #ccc",
};

const filterAreaStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
    marginBottom: "10px",
};

const buttonAreaStyle = {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
    minHeight: "37px",
    paddingBottom: "9px",
    borderBottom: "1px solid #ccc",
};

const listHeaderStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "40px",
    fontSize: "14px",
    fontWeight: "bold",
    borderBottom: "1px solid #ddd",
};

const roleListStyle = {
    overflowY: "auto",
    maxHeight: "calc(100vh - 330px)",
};

const permissionListStyle = {
    flex: 1,
    minHeight: "300px",
    maxHeight: "calc(100vh - 390px)",
    overflowY: "auto",
};

const listItemStyle = {
    display: "flex",
    alignItems: "center",
    minHeight: "42px",
    padding: "0 10px",
    fontSize: "14px",
    borderBottom: "1px dashed #ddd",
    color: "#333",
    transition: "background-color 0.15s",
};

const emptyStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100px",
    color: "#999",
    fontSize: "13px",
};

const countStyle = {
    paddingTop: "10px",
    marginTop: "auto",
    borderTop: "1px solid #ccc",
    fontSize: "12px",
    color: "#888",
};
