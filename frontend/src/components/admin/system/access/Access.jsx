import {useCallback, useEffect, useMemo, useState} from "react";

import useBreadcrumbs from "../../../../hooks/useBreadcrumbs";
import usePermission from "../../../../hooks/usePermission";
import Badge from "../../../common/ui/Badge.jsx";
import Button from "../../../common/ui/Button.jsx";
import Field from "../../../common/ui/Field.jsx";
import PageHeader from "../../../common/ui/PageHeader.jsx";
import Panel from "../../../common/ui/Panel.jsx";
import StatusBox from "../../../common/ui/StatusBox.jsx";
import Table from "../../../common/ui/Table.jsx";
import {useToast} from "../../../common/ui/feedbackContext.js";

import {
    getAccessList as fetchAccessApi,
    getActionCodes,
    saveAccessList,
} from "../../../../api/admin/system/access/accessApi";
import {getMenus} from "../../../../api/admin/system/menu/menuApi";

// 입력값 검증 실패면 필드별 메시지를, 아니면 서버 에러 메시지를 반환
const getErrorMessage = (error) =>
    error.validations
        ? Object.values(error.validations).flat().join("\n")
        : error.message;

const EMPTY_FILTER = {
    topMenuId: "",
    midMenuId: "",
    btmMenuId: "",
    actionName: "",
};

/**
 * 접근 권한(ACTION) 관리
 * ROLE_SUPER_ADMIN 전용 화면 (D-03). 화면 숨김은 표시용이며 실제 차단은 서버(@RequireSuperAdmin)가 한다.
 * 권한이 있을 때만 AccessManagement를 마운트하므로, 권한 없이 화면의 API를 호출하지 않는다.
 */
export default function Access() {
    const {isSuperAdmin, status} = usePermission();
    const crumbs = useBreadcrumbs();

    // idle: 비로그인(조회하지 않음) → 표시 없음
    let content = null;
    if (status === "loaded" && isSuperAdmin) {
        content = <AccessManagement />;
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

function AccessManagement() {
    const toast = useToast();

    const [menuList, setMenuList] = useState([]);

    const [topMenuId, setTopMenuId] = useState("");
    const [midMenuId, setMidMenuId] = useState("");
    const [btmMenuId, setBtmMenuId] = useState("");

    const [actionName, setActionName] = useState("");
    // 관리자가 권한명을 직접 고쳤는지 (고친 뒤에는 권한 선택을 바꿔도 덮어쓰지 않음)
    const [isActionNameEdited, setIsActionNameEdited] = useState(false);

    // 권한 코드 (GET /action-codes 의 domainList)
    const [actionDomainList, setActionDomainList] = useState([]);
    const [actionDomain, setActionDomain] = useState("");
    const [actionCode, setActionCode] = useState("");

    const [accessList, setAccessList] = useState([]);
    // 목록 조회 실패 메시지 (표 자리에 다시 시도와 함께 표시)
    const [listError, setListError] = useState("");

    const [editingId, setEditingId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingOriginalData, setEditingOriginalData] = useState(null);

    // 입력 칸 오류 (menu · action · name)
    const [errors, setErrors] = useState({});

    const clearError = (key) =>
        setErrors((previous) => {
            if (!previous[key]) return previous;
            const next = {...previous};
            delete next[key];
            return next;
        });

    // 아래 조회 함수들은 응답이 온 뒤에 상태를 바꾼다 (effect에서 불러도 렌더가 연달아 일어나지 않음).
    // 오류는 안에서 처리하므로 await해도 예외가 나지 않는다.

    // 메뉴 전체 조회 (메뉴 모듈의 GET /menus. 단계 → 상위 메뉴 → 메뉴 순서로 정렬되어 옴)
    const getMenuList = useCallback(
        () =>
            getMenus()
                .then((body) => setMenuList(body?.menus ?? []))
                .catch((error) => {
                    console.error("메뉴 조회 실패:", error);
                    toast.error(getErrorMessage(error));
                }),
        [toast]
    );

    // 접근 권한 목록 조회
    const getAccessList = useCallback(
        (params = {}) =>
            fetchAccessApi(params)
                .then((body) => {
                    setAccessList(body ?? []);
                    setListError("");
                })
                .catch((error) => {
                    console.error("접근 권한 조회 실패:", error);
                    setListError(getErrorMessage(error));
                }),
        []
    );

    // 권한 코드 목록 조회 (등록 여부 registered 포함)
    const getActionCodeList = useCallback(
        () =>
            getActionCodes()
                .then((body) => setActionDomainList(body?.domainList ?? []))
                .catch((error) => {
                    console.error("권한 코드 조회 실패:", error);
                    toast.error(getErrorMessage(error));
                }),
        [toast]
    );

    useEffect(() => {
        getMenuList();
        getAccessList();
        getActionCodeList();
    }, [getMenuList, getAccessList, getActionCodeList]);

    // 선택한 도메인의 권한 목록
    const actionCodeList = useMemo(() => {

        return actionDomainList.find(
            (item) => item.domain === actionDomain
        )?.actionList ?? [];

    }, [actionDomainList, actionDomain]);

    // 도메인 변경: 권한 선택값과 권한명 초기화
    const changeActionDomain = (value) => {
        setActionDomain(value);
        setActionCode("");
        setActionName("");
        setIsActionNameEdited(false);
    };

    // 권한 변경: 권한명을 description 으로 채움 (직접 고친 뒤에는 유지)
    const changeActionCode = (value) => {
        setActionCode(value);
        clearError("action");

        if (isActionNameEdited) return;

        const selected = actionCodeList.find(
            (item) => item.actionCode === value
        );

        setActionName(selected?.description ?? "");
        if (selected?.description) clearError("name");
    };

    // 권한명 직접 입력
    const changeActionName = (value) => {
        setActionName(value);
        setIsActionNameEdited(true);
        clearError("name");
    };

    // 권한 코드 입력값 초기화
    const resetActionCode = () => {
        setActionDomain("");
        setActionCode("");
        setIsActionNameEdited(false);
    };

    // 메뉴 계층별 데이터 (대메뉴는 parentId가 null)
    const topMenuList = useMemo(() => {

        return menuList.filter(
            (item) => item.parentId === null
        );

    }, [menuList]);

    const midMenuList = useMemo(() => {

        return menuList.filter(
            (item) => item.parentId === topMenuId
        );

    }, [menuList, topMenuId]);

    const btmMenuList = useMemo(() => {

        return menuList.filter(
            (item) => item.parentId === midMenuId
        );

    }, [menuList, midMenuId]);

    // 대메뉴 변경
    const changeTopMenu = (value) => {
        setTopMenuId(value);
        setMidMenuId("");
        setBtmMenuId("");

        if (isEditing) return;

        getAccessList({
            topMenuId: value,
            midMenuId: "",
            btmMenuId: "",
            actionName: "",
        });
    };

    // 중메뉴 변경
    const changeMidMenu = (value) => {
        setMidMenuId(value);
        setBtmMenuId("");

        if (isEditing) return;

        getAccessList({
            topMenuId,
            midMenuId: value,
            btmMenuId: "",
            actionName: "",
        });
    };

    // 소메뉴 변경
    const changeBtmMenu = (value) => {
        setBtmMenuId(value);
        if (value) clearError("menu");

        if (isEditing) return;

        getAccessList({
            topMenuId,
            midMenuId,
            btmMenuId: value,
            actionName: "",
        });
    };

    // 표 행 수정
    const editRow = (row) => {
        setIsEditing(true);
        setEditingId(row.actionId);
        setErrors({});

        setEditingOriginalData({...row});

        setActionName(row.actionName);
        setIsActionNameEdited(true);

        // 권한 코드는 수정 불가 (읽기 전용 표시)
        setActionCode(row.actionCode ?? "");
        setActionDomain(
            actionDomainList.find((domain) =>
                domain.actionList.some(
                    (item) => item.actionCode === row.actionCode
                )
            )?.domain ?? ""
        );

        setTopMenuId(row.topMenuId);
        setMidMenuId(row.midMenuId);
        setBtmMenuId(row.btmMenuId);
    };

    // 메뉴 · 권한명 검증 (권한 코드는 등록할 때만)
    const validate = ({checkActionCode}) => {
        const nextErrors = {};

        if (checkActionCode && !actionCode) {
            nextErrors.action = "도메인과 권한을 고르세요.";
        }
        if (!topMenuId || !midMenuId || !btmMenuId) {
            nextErrors.menu = "대 · 중 · 소 메뉴를 모두 고르세요.";
        }
        if (!actionName.trim()) {
            nextErrors.name = "권한 이름을 입력하세요.";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    // 신규 데이터 추가
    const addAccess = async () => {
        if (!validate({checkActionCode: true})) return;

        const newData = {
            actionId: `TEMP_${Date.now()}`,
            actionCode,
            actionName: actionName.trim(),
            topMenuId,
            midMenuId,
            btmMenuId,
        };

        try {
            await saveAccessList({
                addedList: [newData],
                modifiedList: [],
            });

            toast.success("접근 권한을 등록했습니다.");

            resetActionCode();
            setTopMenuId("");
            setMidMenuId("");
            setBtmMenuId("");

            setIsEditing(false);
            setActionName("");
            setEditingId(null);
            setEditingOriginalData(null);

            await getAccessList(EMPTY_FILTER);

            // 등록 여부(registered) 갱신
            await getActionCodeList();
        } catch (error) {
            console.error("접근 권한 추가 실패:", error);
            toast.error(getErrorMessage(error));
        }
    };

    // 기존 데이터 수정
    const updateAccess = async () => {
        if (!editingId) {
            toast.error("수정할 데이터를 확인하세요.");
            return;
        }
        if (!validate({checkActionCode: false})) return;

        const updatedData = {
            actionId: editingId,
            actionName: actionName.trim(),
            topMenuId,
            midMenuId,
            btmMenuId,
        };

        try {
            await saveAccessList({
                addedList: [],
                modifiedList: [updatedData],
            });

            toast.success("접근 권한을 저장했습니다.");

            resetActionCode();
            setTopMenuId("");
            setMidMenuId("");
            setBtmMenuId("");

            setIsEditing(false);
            setActionName("");
            setEditingId(null);
            setEditingOriginalData(null);

            await getAccessList(EMPTY_FILTER);
        } catch (error) {
            console.error("접근 권한 수정 실패:", error);
            toast.error(getErrorMessage(error));
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (editingId) {
            updateAccess();
        } else {
            addAccess();
        }
    };

    // 변경 데이터 저장 전 취소
    const cancelChanges = async () => {
        if (editingOriginalData) {
            setActionName(editingOriginalData.actionName);
            setTopMenuId(editingOriginalData.topMenuId);
            setMidMenuId(editingOriginalData.midMenuId);
            setBtmMenuId(editingOriginalData.btmMenuId);
        }

        setEditingId(null);
        setEditingOriginalData(null);
        setIsEditing(false);
        setErrors({});

        resetActionCode();
        setTopMenuId("");
        setMidMenuId("");
        setBtmMenuId("");

        setActionName("");

        await getAccessList(EMPTY_FILTER);
    };

    const getMenuName = (id) =>
        menuList.find((menu) => menu.id === id)?.title ?? "";

    // 표 칸 구성
    const columns = [
        {key: "actionId", title: "ID", width: "200px", mono: true},
        {
            key: "actionCode",
            title: "권한 코드",
            mono: true,
            // 등록부에 없는 코드(API에서 삭제된 권한)는 미사용 표시
            render: (item) =>
                item.actionCode ? (
                    <>
                        {item.actionCode}
                        {!item.actionCodeInUse && (
                            <>
                                {" "}
                                <Badge>미사용</Badge>
                            </>
                        )}
                    </>
                ) : (
                    ""
                ),
        },
        {key: "actionName", title: "접근 권한 명"},
        {
            key: "menu",
            title: "메뉴 위치",
            render: (item) =>
                [
                    item.topMenuName ?? getMenuName(item.topMenuId),
                    item.midMenuName ?? getMenuName(item.midMenuId),
                    item.btmMenuName ?? getMenuName(item.btmMenuId),
                ]
                    .filter(Boolean)
                    .join(" › "),
        },
        {
            key: "edit",
            title: "작업",
            width: "84px",
            align: "actions",
            render: (item) => (
                <Button
                    size="sm"
                    variant="text"
                    disabled={editingId === item.actionId}
                    onClick={() => editRow(item)}
                >
                    수정
                </Button>
            ),
        },
    ];

    return (
        <div className="form-stack">
            {/* 등록 · 수정 폼 (같은 폼, 표의 [수정]을 누르면 수정 모드) */}
            <form onSubmit={handleSubmit} noValidate>
                <Panel
                    title={editingId ? "접근 권한 수정" : "접근 권한 등록"}
                    badge={
                        editingId ? <Badge tone="warning">수정 중</Badge> : undefined
                    }
                    footer={
                        <>
                            <Button onClick={cancelChanges}>취소</Button>
                            <Button type="submit" variant="primary">
                                {editingId ? "저장" : "등록"}
                            </Button>
                        </>
                    }
                >
                    <div className="form-stack">
                        <Field
                            label="메뉴 위치"
                            htmlFor="accessTopMenu"
                            required
                            error={errors.menu}
                            hint={
                                isEditing
                                    ? undefined
                                    : "메뉴를 고르면 아래 목록이 그 메뉴로 좁혀집니다."
                            }
                        >
                            {/* 메뉴 선택 (대 › 중 › 소) */}
                            <div
                                className="input-range"
                                role="group"
                                aria-label="메뉴 위치"
                            >
                                <select
                                    id="accessTopMenu"
                                    value={topMenuId}
                                    onChange={(e) => changeTopMenu(e.target.value)}
                                    className="form-control"
                                    aria-label="대 메뉴"
                                    aria-describedby="accessTopMenu-msg"
                                >
                                    <option value="">대 메뉴 선택</option>
                                    {topMenuList.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.title}
                                        </option>
                                    ))}
                                </select>
                                <span className="input-range-sep">›</span>
                                <select
                                    value={midMenuId}
                                    onChange={(e) => changeMidMenu(e.target.value)}
                                    disabled={!topMenuId}
                                    className="form-control"
                                    aria-label="중 메뉴"
                                >
                                    <option value="">
                                        {topMenuId ? "중 메뉴 선택" : "대 메뉴를 먼저"}
                                    </option>
                                    {midMenuList.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.title}
                                        </option>
                                    ))}
                                </select>
                                <span className="input-range-sep">›</span>
                                <select
                                    value={btmMenuId}
                                    onChange={(e) => changeBtmMenu(e.target.value)}
                                    disabled={!midMenuId}
                                    className="form-control"
                                    aria-label="소 메뉴"
                                >
                                    <option value="">
                                        {midMenuId ? "소 메뉴 선택" : "중 메뉴를 먼저"}
                                    </option>
                                    {btmMenuList.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </Field>

                        <div className="form-row">
                            {/* 권한 코드 선택 (도메인 → 권한) */}
                            <Field
                                label="도메인"
                                htmlFor="accessDomain"
                                required
                                error={errors.action && !actionDomain ? errors.action : ""}
                                hint={isEditing ? "수정할 때는 바꿀 수 없습니다." : undefined}
                            >
                                <select
                                    id="accessDomain"
                                    value={actionDomain}
                                    onChange={(e) => changeActionDomain(e.target.value)}
                                    disabled={isEditing}
                                    className="form-control"
                                >
                                    <option value="">도메인 선택</option>
                                    {actionDomainList.map((item) => (
                                        <option key={item.domain} value={item.domain}>
                                            {item.domain}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field
                                label="권한"
                                htmlFor="accessActionCode"
                                required
                                error={errors.action && actionDomain ? errors.action : ""}
                                hint={
                                    actionCode
                                        ? `권한 코드: ${actionCode}`
                                        : actionDomain
                                            ? "등록된 권한은 고를 수 없습니다."
                                            : "도메인을 먼저 고르세요."
                                }
                            >
                                <select
                                    id="accessActionCode"
                                    value={actionCode}
                                    onChange={(e) => changeActionCode(e.target.value)}
                                    disabled={isEditing || !actionDomain}
                                    className="form-control"
                                >
                                    <option value="">
                                        {actionDomain ? "권한 선택" : "도메인을 먼저"}
                                    </option>
                                    {actionCodeList.map((item) => (
                                        <option
                                            key={item.actionCode}
                                            value={item.actionCode}
                                            disabled={item.registered}
                                        >
                                            {`${item.description} (${item.action})${item.registered ? " · 등록됨" : ""}`}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            {/* 권한명 입력 */}
                            <Field
                                label="권한 이름"
                                htmlFor="accessActionName"
                                required
                                error={errors.name}
                                hint="권한을 고르면 설명으로 채워집니다 (고칠 수 있음)."
                            >
                                <input
                                    id="accessActionName"
                                    type="text"
                                    placeholder="권한 이름을 입력하세요."
                                    value={actionName}
                                    onChange={(e) => changeActionName(e.target.value)}
                                    className="form-control"
                                />
                            </Field>
                        </div>
                    </div>
                </Panel>
            </form>

            {/* 접근 권한 표 */}
            {listError ? (
                <StatusBox
                    type="error"
                    detail={listError}
                    onRetry={() =>
                        getAccessList(
                            isEditing
                                ? EMPTY_FILTER
                                : {topMenuId, midMenuId, btmMenuId, actionName: ""}
                        )
                    }
                />
            ) : (
                <Table
                    columns={columns}
                    rows={accessList}
                    rowKey="actionId"
                    selectedKey={editingId ?? undefined}
                    isRowMuted={(item) => Boolean(item.actionCode) && !item.actionCodeInUse}
                    size="sm"
                    ariaLabel="접근 권한 목록"
                    emptyText="등록된 접근 권한이 없습니다."
                />
            )}
        </div>
    );
}
