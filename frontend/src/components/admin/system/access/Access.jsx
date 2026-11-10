import {useCallback, useEffect, useMemo, useState} from "react";

import PageContainer from "../../../common/PageContainer";
import {Grid} from "../../../common/Grid";

import {
    getAccessList as fetchAccessApi,
    getAccessMenuList,
    getActionCodes,
    saveAccessList,
} from "../../../../api/admin/system/access/accessApi";

import styles from "./Access.module.css";

// 입력값 검증 실패면 필드별 메시지를, 아니면 서버 에러 메시지를 반환
const getErrorMessage = (error) =>
    error.validations
        ? Object.values(error.validations).flat().join("\n")
        : error.message;

export default function Access() {

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

    const [editingId, setEditingId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingOriginalData, setEditingOriginalData] = useState(null);

    // 메뉴 전체 조회
    const getMenuList = useCallback(async () => {
        try {
            const body = await getAccessMenuList();

            setMenuList(body ?? []);
        } catch (error) {
            console.error("메뉴 조회 실패:", error);
            alert(getErrorMessage(error));
        }
    }, []);

    // 접근 권한 목록 조회
    const getAccessList = useCallback(async (params = {}) => {
        try {
            const body = await fetchAccessApi(params);

            setAccessList(body ?? []);
        } catch (error) {
            console.error("접근 권한 조회 실패:", error);
            alert(getErrorMessage(error));
        }
    }, []);

    // 권한 코드 목록 조회 (등록 여부 registered 포함)
    const getActionCodeList = useCallback(async () => {
        try {
            const body = await getActionCodes();

            setActionDomainList(body?.domainList ?? []);
        } catch (error) {
            console.error("권한 코드 조회 실패:", error);
            alert(getErrorMessage(error));
        }
    }, []);

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

        if (isActionNameEdited) return;

        const selected = actionCodeList.find(
            (item) => item.actionCode === value
        );

        setActionName(selected?.description ?? "");
    };

    // 권한명 직접 입력
    const changeActionName = (value) => {
        setActionName(value);
        setIsActionNameEdited(true);
    };

    // 권한 코드 입력값 초기화
    const resetActionCode = () => {
        setActionDomain("");
        setActionCode("");
        setIsActionNameEdited(false);
    };

    // 메뉴 계층별 데이터
    const topMenuList = useMemo(() => {

        return menuList.filter(
            (item) => !menuList.some(
                (parent) => parent.id === item.parentId
            )
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

        if (isEditing) return;

        getAccessList({
            topMenuId,
            midMenuId,
            btmMenuId: value,
            actionName: "",
        });
    };

    // 그리드 행 수정
    const editRow = (row) => {
        setIsEditing(true);
        setEditingId(row.actionId);

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

    // 신규 데이터 추가
    const addAccess = async () => {
        if (!actionCode) {
            alert("도메인과 권한을 선택해주세요.");
            return;
        }

        if (
            !actionName.trim() ||
            !topMenuId ||
            !midMenuId ||
            !btmMenuId
        ) {
            alert("대·중·소 메뉴와 접근 권한명을 입력해주세요.");
            return;
        }

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

            alert("접근 권한이 추가되었습니다.");

            resetActionCode();
            setTopMenuId("");
            setMidMenuId("");
            setBtmMenuId("");

            setIsEditing(false);
            setActionName("");
            setEditingId(null);
            setEditingOriginalData(null);

            await getAccessList({
                topMenuId: "",
                midMenuId: "",
                btmMenuId: "",
                actionName: "",
            });

            // 등록 여부(registered) 갱신
            await getActionCodeList();
        } catch (error) {
            console.error("접근 권한 추가 실패:", error);
            alert(getErrorMessage(error));
        }
    };

    // 기존 데이터 수정
    const updateAccess = async () => {
        if (
            !editingId ||
            !actionName.trim() ||
            !topMenuId ||
            !midMenuId ||
            !btmMenuId
        ) {
            alert("수정할 데이터를 확인해주세요.");
            return;
        }

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

            alert("접근 권한이 수정되었습니다.");

            resetActionCode();
            setTopMenuId("");
            setMidMenuId("");
            setBtmMenuId("");

            setIsEditing(false);
            setActionName("");
            setEditingId(null);
            setEditingOriginalData(null);

            await getAccessList({
                topMenuId: "",
                midMenuId: "",
                btmMenuId: "",
                actionName: "",
            });
        } catch (error) {
            console.error("접근 권한 수정 실패:", error);
            alert(getErrorMessage(error));
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

        resetActionCode();
        setTopMenuId("");
        setMidMenuId("");
        setBtmMenuId("");

        setActionName("");

        await getAccessList({
            topMenuId: "",
            midMenuId: "",
            btmMenuId: "",
            actionName: "",
        });
    };

    // 그리드 데이터 구성
    const header = [
        {id: "actionId", title: "ID"},
        {id: "actionCode", title: "권한 코드"},
        {id: "actionName", title: "접근 권한 명"},
        {id: "topMenuName", title: "대 메뉴명"},
        {id: "midMenuName", title: "중 메뉴명"},
        {id: "btmMenuName", title: "소 메뉴명"},
        {id: "edit", title: "수정"},
    ];

    const content = accessList.map((item) => {

        const getMenuName = (id) =>
            menuList.find((menu) => menu.id === id)?.title ?? "";

        return [
            {
                id: item.actionId,
                keyName: "actionId",
                value: item.actionId,
            },
            {
                id: item.actionId,
                keyName: "actionCode",
                // 등록부에 없는 코드(API에서 삭제된 권한)는 미사용 표시
                value: item.actionCode
                    ? `${item.actionCode}${item.actionCodeInUse ? "" : " (미사용)"}`
                    : "",
            },
            {
                id: item.actionId,
                keyName: "actionName",
                value: item.actionName,
            },
            {
                id: item.actionId,
                keyName: "topMenuName",
                value: item.topMenuName ?? getMenuName(item.topMenuId),
            },
            {
                id: item.actionId,
                keyName: "midMenuName",
                value: item.midMenuName ?? getMenuName(item.midMenuId),
            },
            {
                id: item.actionId,
                keyName: "btmMenuName",
                value: item.btmMenuName ?? getMenuName(item.btmMenuId),
            },
            {
                id: item.actionId,
                keyName: "edit",
                value: "수정",
            },
        ];

    });

    return (
        <PageContainer>
            <div className={styles.accessPage}>
                {/* 검색 및 등록 영역 */}
                <div className={styles.accessSearch}>
                    {/* 메뉴 선택 영역 */}
                    <div className={styles.accessSelect}>
                        <select
                            value={topMenuId}
                            onChange={(e) => changeTopMenu(e.target.value)}
                            className={styles.select}
                        >
                            <option value="">대 메뉴 선택</option>
                            {topMenuList.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.title}
                                </option>
                            ))}
                        </select>

                        <select
                            value={midMenuId}
                            onChange={(e) => changeMidMenu(e.target.value)}
                            disabled={!topMenuId}
                            className={styles.select}
                        >
                            <option value="">중 메뉴 선택</option>
                            {midMenuList.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.title}
                                </option>
                            ))}
                        </select>

                        <select
                            value={btmMenuId}
                            onChange={(e) => changeBtmMenu(e.target.value)}
                            disabled={!midMenuId}
                            className={styles.select}
                        >
                            <option value="">소 메뉴 선택</option>
                            {btmMenuList.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 권한 코드 선택 영역 (도메인 → 권한) */}
                    <div className={styles.accessCode}>
                        <select
                            value={actionDomain}
                            onChange={(e) => changeActionDomain(e.target.value)}
                            disabled={isEditing}
                            className={styles.select}
                        >
                            <option value="">도메인 선택</option>
                            {actionDomainList.map((item) => (
                                <option key={item.domain} value={item.domain}>
                                    {item.domain}
                                </option>
                            ))}
                        </select>

                        <select
                            value={actionCode}
                            onChange={(e) => changeActionCode(e.target.value)}
                            disabled={isEditing || !actionDomain}
                            className={styles.select}
                        >
                            <option value="">권한 선택</option>
                            {actionCodeList.map((item) => (
                                <option
                                    key={item.actionCode}
                                    value={item.actionCode}
                                    disabled={item.registered}
                                >
                                    {`${item.description} (${item.action})${item.registered ? " (등록됨)" : ""}`}
                                </option>
                            ))}
                        </select>

                        <div className={styles.codeView}>
                            <span className={styles.codeLabel}>권한 코드</span>
                            <span className={styles.codeValue}>
                                {actionCode || "-"}
                            </span>
                        </div>
                    </div>

                    {/* 권한명 입력 및 버튼 영역 */}
                    <div className={styles.accessInput}>
                        <input
                            type="text"
                            placeholder="권한 명을 입력하세요"
                            value={actionName}
                            onChange={(e) => changeActionName(e.target.value)}
                            className={styles.input}
                        />

                        {editingId ? (
                            <button
                                type="button"
                                onClick={updateAccess}
                                className={styles.button}
                            >
                                수정 반영
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={addAccess}
                                className={styles.button}
                            >
                                추가
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={cancelChanges}
                            className={styles.button}
                        >
                            취소
                        </button>
                    </div>
                </div>

                {/* 접근 권한 그리드 */}
                <div className={styles.accessGrid}>
                    <Grid
                        title=""
                        header={header}
                        content={content}
                        columnStyle="200px 1.5fr 1.5fr 1fr 1fr 1fr 80px"
                        clickableColumn={{
                            6: (value, rowIndex) => {
                                const row = accessList[rowIndex];

                                if (row) {
                                    editRow(row);
                                }
                            },
                        }}
                    />
                </div>
            </div>
        </PageContainer>
    );
}