import {useCallback, useEffect, useMemo, useState} from "react";

import PageContainer from "../../../common/PageContainer";
import {Grid} from "../../../common/Grid";

import {
    getAccessMenuList,
    getAccessList,
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
    const [originalList, setOriginalList] = useState([]);

    const [editingId, setEditingId] = useState(null);

    const [addedList, setAddedList] = useState([]);
    const [modifiedList, setModifiedList] = useState([]);

    const [search, setSearch] = useState({
        topMenuId: "",
        midMenuId: "",
        btmMenuId: "",
        actionName: "",
    });

    // 메뉴 목록 조회
    const fetchMenuList = async () => {
        try {
            const response = await getAccessMenuList();

            if (response.responseCode === "SUCCESS") {
                setMenuList(response.data || []);
            }
        } catch (error) {
            console.error("메뉴 조회 실패", error);
        }
    };

    // 접근 권한 목록 조회
    const fetchAccessList = async () => {
        try {
            const response = await getAccessList(search);

            if (response.responseCode === "SUCCESS") {
                setAccessList(response.data || []);
            }
        } catch (error) {
            console.error("접근 권한 조회 실패", error);
        }
    };

    // 신규 추가 및 수정 저장
    const handleSave = async () => {
        try {
            const response = await saveAccessList({
                addedList,
                modifiedList,
            });

            if (response.responseCode === "SUCCESS") {
                alert("저장되었습니다.");

                setAddedList([]);
                setModifiedList([]);

                fetchAccessList();
            }
        } catch (error) {
            console.error("저장 실패", error);
        }
    };

    useEffect(() => {
        fetchMenuList();
        fetchAccessList();
    }, []);

    // 메뉴 전체 조회
    const getMenuList = useCallback(async () => {

        try {

            const response = await getAccessMenuList();

            if (response.responseCode === "SUCCESS") {
                setMenuList(response.data ?? []);
            }

        } catch (error) {
            console.error("메뉴 조회 실패", error);
        }

    }, []);

    // 접근 권한 조회
    const getAccessList = useCallback(async () => {

        try {

            const response = await api(
                apiOption.GET,
                "/access/actions",
                {
                    topMenuId,
                    midMenuId,
                    btmMenuId,
                    actionName,
                }
            );

            if (response.responseCode === "SUCCESS") {

                const data = response.data ?? [];

                setAccessList(data);
                setOriginalList(
                    JSON.parse(JSON.stringify(data))
                );

                setAddedList([]);
                setModifiedList([]);
                setEditingId(null);
            }

        } catch (error) {
            console.error("접근 권한 조회 실패", error);
        }

    }, [topMenuId, midMenuId, btmMenuId, actionName]);

    useEffect(() => {
        getMenuList();
    }, [getMenuList]);

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

    };

    // 중메뉴 변경
    const changeMidMenu = (value) => {

        setMidMenuId(value);
        setBtmMenuId("");

    };

    // 그리드 행 수정
    const editRow = (row) => {

        setEditingId(row.actionId);

        setActionName(row.actionName);
        setTopMenuId(row.topMenuId);
        setMidMenuId(row.midMenuId);
        setBtmMenuId(row.btmMenuId);

    };

    // 신규 데이터 추가
    const addAccess = () => {

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

        setAccessList((prev) => [...prev, newData]);

        setAddedList((prev) => [...prev, newData]);

        setActionName("");
        setEditingId(null);

    };

    // 기존 데이터 수정
    const updateAccess = () => {

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

        setAccessList((prev) =>
            prev.map((item) =>
                item.actionId === editingId
                    ? {...item, ...updatedData}
                    : item
            )
        );

        const isNew = addedList.some(
            (item) => item.actionId === editingId
        );

        if (isNew) {
            setAddedList((prev) =>
                prev.map((item) =>
                    item.actionId === editingId
                        ? updatedData
                        : item
                )
            );
        } else {
            setModifiedList((prev) => {
                const exists = prev.some(
                    (item) => item.actionId === editingId
                );

                return exists
                    ? prev.map((item) =>
                        item.actionId === editingId
                            ? updatedData
                            : item
                    )
                    : [...prev, updatedData];
            });
        }

        setEditingId(null);
        setActionName("");

    };

    // 저장 전 전체 취소
    const cancelChanges = () => {

        setAccessList(
            JSON.parse(JSON.stringify(originalList))
        );

        setAddedList([]);
        setModifiedList([]);

        setEditingId(null);

        setTopMenuId("");
        setMidMenuId("");
        setBtmMenuId("");

        setActionName("");

    };

    // DB 저장
    const saveAccess = async () => {

        if (
            addedList.length === 0 &&
            modifiedList.length === 0
        ) {
            alert("변경된 데이터가 없습니다.");
            return;
        }

        try {

            const response = await api(
                apiOption.POST,
                "/access/save",
                {
                    addedList,
                    modifiedList,
                }
            );

            if (response.responseCode === "SUCCESS") {

                alert("저장되었습니다.");

                await getAccessList();

                setAddedList([]);
                setModifiedList([]);
            }

        } catch (error) {

            console.error("저장 실패", error);

            alert("저장 중 오류가 발생했습니다.");

        }

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
                                setBtmMenuId(e.target.value)
                            }
                            disabled={!midMenuId}
                            style={selectStyle}
                        >
                            <option value="">소 메뉴 선택</option>

                            {btmMenuList.map((item) => (
                                <option
                                    key={item.id}
                                    value={item.id}
                                >
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

                        <button onClick={getAccessList} style={buttonStyle}>
                            조회
                        </button>

                    </div>

                    <div className="access-buttons">

                        <button onClick={saveAccess} style={buttonStyle}>
                            저장
                        </button>

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