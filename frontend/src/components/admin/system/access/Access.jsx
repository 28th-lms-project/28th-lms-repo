import {useCallback, useEffect, useMemo, useState} from "react";

import PageContainer from "../../../common/PageContainer";
import {Grid} from "../../../common/Grid";

import {
    getAccessList as fetchAccessApi,
    getAccessMenuList,
    saveAccessList,
} from "../../../../api/admin/system/access/accessApi";

const selectStyle = {
    width: "auto",
    minWidth: "120px",
    height: "36px",
    padding: "0 10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    backgroundColor: "#fff",
    fontSize: "13px",
};

const inputStyle = {
    flex: 1,
    minWidth: 0,
    height: "35px",
    padding: "0 10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "13px",
};

const buttonStyle = {
    minWidth: "45px",
    height: "35px",
    padding: "0 12px",
    border: "1px solid #ccc",
    borderRadius: "3px",
    backgroundColor: "#f5f5f5",
    color: "#555",
    cursor: "pointer",
};

export default function Access() {

    const [menuList, setMenuList] = useState([]);

    const [topMenuId, setTopMenuId] = useState("");
    const [midMenuId, setMidMenuId] = useState("");
    const [btmMenuId, setBtmMenuId] = useState("");

    const [actionName, setActionName] = useState("");

    const [accessList, setAccessList] = useState([]);

    const [editingId, setEditingId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingOriginalData, setEditingOriginalData] = useState(null);

    // 메뉴 전체 조회
    const getMenuList = useCallback(async () => {
        try {
            const response = await getAccessMenuList();

            if (response.responseCode === "SUCCESS") {
                setMenuList(response.data ?? []);
            }
        } catch (error) {
            console.error("메뉴 조회 실패:", error);
        }
    }, []);

    // 접근 권한 목록 조회
    const getAccessList = useCallback(async (params = {}) => {
        try {
            const response = await fetchAccessApi(params);

            if (response.responseCode === "SUCCESS") {
                setAccessList(response.data ?? []);
            } else {
                alert(response.message || "목록 조회에 실패했습니다.");
            }
        } catch (error) {
            console.error("접근 권한 조회 실패:", error);
            alert("접근 권한 목록 조회에 실패했습니다.");
        }
    }, []);

    useEffect(() => {
        getMenuList();
        getAccessList();
    }, [getMenuList, getAccessList]);

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
        setTopMenuId(row.topMenuId);
        setMidMenuId(row.midMenuId);
        setBtmMenuId(row.btmMenuId);
    };

    // 신규 데이터 추가
    const addAccess = async () => {
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
            actionName: actionName.trim(),
            topMenuId,
            midMenuId,
            btmMenuId,
        };

        try {
            const response = await saveAccessList({
                addedList: [newData],
                modifiedList: [],
            });

            if (response.responseCode === "SUCCESS") {
                alert("접근 권한이 추가되었습니다.");

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
            } else {
                alert(response.message || "접근 권한 추가에 실패했습니다.");
            }
        } catch (error) {
            console.error("접근 권한 추가 실패:", error);
            alert(error.message || "접근 권한 추가 중 오류가 발생했습니다.");
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
            const response = await saveAccessList({
                addedList: [],
                modifiedList: [updatedData],
            });

            if (response.responseCode === "SUCCESS") {
                alert("접근 권한이 수정되었습니다.");

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
            } else {
                alert(response.message || "접근 권한 수정에 실패했습니다.");
            }
        } catch (error) {
            console.error("접근 권한 수정 실패:", error);
            alert(error.message || "접근 권한 수정 중 오류가 발생했습니다.");
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

            <div className="access-page">

                <h2>접근 권한 조회</h2>

                {/* 검색 및 등록 영역 */}
                <div className="access-search">

                    <div className="access-select">

                        <select
                            value={topMenuId}
                            onChange={(e) =>
                                changeTopMenu(e.target.value)
                            }
                            style={selectStyle}
                        >
                            <option value="">대 메뉴 선택</option>

                            {topMenuList.map((item) => (
                                <option
                                    key={item.id}
                                    value={item.id}
                                >
                                    {item.title}
                                </option>
                            ))}

                        </select>

                        <select
                            value={midMenuId}
                            onChange={(e) =>
                                changeMidMenu(e.target.value)
                            }
                            disabled={!topMenuId}
                            style={selectStyle}
                        >
                            <option value="">중 메뉴 선택</option>

                            {midMenuList.map((item) => (
                                <option
                                    key={item.id}
                                    value={item.id}
                                >
                                    {item.title}
                                </option>
                            ))}

                        </select>

                        <select
                            value={btmMenuId}
                            onChange={(e) =>
                                changeBtmMenu(e.target.value)
                            }
                            disabled={!midMenuId}
                            style={selectStyle}
                        >
                            <option value="">소 메뉴 선택</option>

                            {btmMenuList.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.title}
                                </option>
                            ))}
                        </select>

                    </div>

                    <div className="access-input">

                        <input
                            type="text"
                            placeholder="권한 명을 입력하세요"
                            value={actionName}
                            onChange={(e) =>
                                setActionName(e.target.value)
                            }
                            style={inputStyle}
                        />

                        {editingId ? (

                            <button onClick={updateAccess} style={buttonStyle}>
                                수정 반영
                            </button>

                        ) : (

                            <button onClick={addAccess} style={buttonStyle}>
                                추가
                            </button>

                        )}

                        <button onClick={cancelChanges} style={buttonStyle}>
                            취소
                        </button>

                    </div>

                </div>

                {/* 접근 권한 그리드 */}
                <div className="access-grid">

                    <Grid
                        title=""
                        header={header}
                        content={content}
                        columnStyle="70px 2fr 1fr 1fr 1fr 80px"
                        clickableColumn={{
                            5: (value, rowIndex) => {
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