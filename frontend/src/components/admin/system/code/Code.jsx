import { useEffect, useState } from "react";
import PageContainer from "../../../common/PageContainer";
import { Grid } from "../../../common/Grid";
import style from "./Code.module.css";
import { getCodeList } from "../../../../api/admin/system/code/codeApi";
import AddCode from "./AddCode";
import UpdateCode from "./UpdateCode";
import usePermission from "../../../../hooks/usePermission";

const CODE_HEADER = [
  { id: "id", title: "ID" },
  { id: "name", title: "이름" },
  { id: "order", title: "정렬" },
];

const GRID_COLUMN_STYLE = "minmax(0, 1fr) minmax(0, 2fr) 60px";

const toGridContent = (codes) =>
  codes.map((code) => [
    { id: `${code.id}_id`, value: code.id },
    { id: `${code.id}_name`, value: code.name },
    { id: `${code.id}_order`, value: code.order },
  ]);

// 폼을 새로 만들지 판단할 key (코드가 없으면 "empty")
const toFormKey = (code) => {
  if (!code) {
    return "empty";
  }
  return code.id;
};

export default function Code() {
  const { isSuperAdmin, status } = usePermission();

  if (status === "loaded" && isSuperAdmin) return <CodeManagement />;

  // idle: 비로그인(조회하지 않음) → 표시 없음
  let content = null;
  if (status === "loading") {
    content = <p className={style.notice}>권한 확인 중...</p>;
  } else if (status === "failed") {
    content = (
      <p className={style.notice}>
        권한 정보를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.
      </p>
    );
  } else if (status === "loaded") {
    content = <p className={style.notice}>권한이 없습니다.</p>;
  }
  return <PageContainer>{content}</PageContainer>;
}

function CodeManagement() {
  //환경 변수들을 저장할 state
  const [topCodes, setTopCodes] = useState([]);
  const [midCodes, setMidCodes] = useState([]);
  const [lowCodes, setLowCodes] = useState([]);

  const [selectedTop, setSelectedTop] = useState();
  const [selectedMid, setSelectedMid] = useState();
  const [selectedLow, setSelectedLow] = useState();

  const selectedTopCode = topCodes[selectedTop];
  const selectedMidCode = midCodes[selectedMid];
  const selectedLowCode = lowCodes[selectedLow];

  const [addingTop, setAddingTop] = useState(false);
  const [addingMid, setAddingMid] = useState(false);
  const [addingLow, setAddingLow] = useState(false);

  const idOf = (code) => {
    if (!code) {
      return "";
    }
    return code.id;
  };

  const findSelectIndex = (codes, selectId) => {
    if (codes.length === 0) {
      return undefined;
    }
    if (selectId) {
      const index = codes.findIndex((code) => code.id === selectId);
      if (index >= 0) {
        return index;
      }
    }
    return 0;
  };

  const fetchCodes = async (topId, midId, lowId) => {
    const top = await getCodeList();
    const topIndex = findSelectIndex(top, topId);

    let mid = [];
    let midIndex;
    if (topIndex !== undefined) {
      mid = await getCodeList(top[topIndex].id);
      midIndex = findSelectIndex(mid, midId);
    }

    let low = [];
    let lowIndex;
    if (midIndex !== undefined) {
      low = await getCodeList(mid[midIndex].id);
      lowIndex = findSelectIndex(low, lowId);
    }

    return { top, topIndex, mid, midIndex, low, lowIndex };
  };

  // 받은 결과를 state에 반영
  const applyCodes = (result) => {
    setTopCodes(result.top);
    setSelectedTop(result.topIndex);
    setMidCodes(result.mid);
    setSelectedMid(result.midIndex);
    setLowCodes(result.low);
    setSelectedLow(result.lowIndex);
  };

  const failCodes = (e) => {
    alert(e.message);
  };

  // 행 클릭 · 저장 후에 사용 (기존과 같은 이름이라 호출하는 쪽은 그대로)
  const loadCodes = (topId, midId, lowId) => {
    fetchCodes(topId, midId, lowId).then(applyCodes).catch(failCodes);
  };

  useEffect(() => {
    fetchCodes().then(applyCodes).catch(failCodes);
  }, []);

  const onSelectTop = (value, rowIndex) => {
    setAddingTop(false);
    setAddingMid(false);
    setAddingLow(false);
    loadCodes(topCodes[rowIndex].id);
  };
  const onSelectMid = (value, rowIndex) => {
    setAddingMid(false);
    setAddingLow(false);
    loadCodes(idOf(selectedTopCode), midCodes[rowIndex].id);
  };

  const onSelectLow = (value, rowIndex) => {
    setAddingLow(false);
    setSelectedLow(rowIndex);
  };
  const toActiveRows = (selected) => {
    if (selected === undefined) {
      return [];
    } else {
      return [selected];
    }
  };

  const onSavedTop = (saved) => {
    setAddingTop(false);
    loadCodes(saved.id);
  };

  const onSavedMid = (saved) => {
    setAddingMid(false);
    loadCodes(idOf(selectedTopCode), saved.id);
  };

  const onSavedLow = (saved) => {
    setAddingLow(false);
    loadCodes(idOf(selectedTopCode), idOf(selectedMidCode), saved.id);
  };

  return (
    <PageContainer>
      <div className={style.container}>
        <div>Code</div>

        <div className={style.codeListContainer}>
          <div className={style.codeList}>
            <div className={style.gridContainer}>
              <Grid
                className={style.codeGrid}
                title="대 분류"
                columnStyle={GRID_COLUMN_STYLE}
                header={CODE_HEADER}
                content={toGridContent(topCodes)}
                clickableColumn={{
                  0: onSelectTop,
                  1: onSelectTop,
                  2: onSelectTop,
                }}
                activeRows={toActiveRows(selectedTop)}
              />
            </div>
            {addingTop && (
              <AddCode
                onSaved={onSavedTop}
                onCancel={() => setAddingTop(false)}
              />
            )}
            {!addingTop && (
              <UpdateCode
                key={toFormKey(selectedTopCode)}
                code={selectedTopCode}
                onSaved={onSavedTop}
                onAddClick={() => setAddingTop(true)}
              />
            )}
          </div>
          <div className={style.codeList}>
            <div className={style.gridContainer}>
              <Grid
                className={style.codeGrid}
                title="중 분류"
                columnStyle={GRID_COLUMN_STYLE}
                header={CODE_HEADER}
                content={toGridContent(midCodes)}
                clickableColumn={{
                  0: onSelectMid,
                  1: onSelectMid,
                  2: onSelectMid,
                }}
                activeRows={toActiveRows(selectedMid)}
              />
            </div>
            {addingMid && (
              <AddCode
                parentOptions={topCodes}
                defaultParentId={idOf(selectedTopCode)}
                onSaved={onSavedMid}
                onCancel={() => setAddingMid(false)}
              />
            )}
            {!addingMid && (
              <UpdateCode
                key={toFormKey(selectedMidCode)}
                code={selectedMidCode}
                parentOptions={topCodes}
                onSaved={onSavedMid}
                onAddClick={() => setAddingMid(true)}
              />
            )}
          </div>
          <div className={style.codeList}>
            <div className="gridContainer">
              <Grid
                className={style.codeGrid}
                title="소 분류"
                columnStyle={GRID_COLUMN_STYLE}
                header={CODE_HEADER}
                content={toGridContent(lowCodes)}
                clickableColumn={{
                  0: onSelectLow,
                  1: onSelectLow,
                  2: onSelectLow,
                }}
                activeRows={toActiveRows(selectedLow)}
              />
            </div>
            {addingLow && (
              <AddCode
                parentOptions={midCodes}
                defaultParentId={idOf(selectedMidCode)}
                onSaved={onSavedLow}
                onCancel={() => setAddingLow(false)}
              />
            )}
            {!addingLow && (
              <UpdateCode
                key={toFormKey(selectedLowCode)}
                code={selectedLowCode}
                parentOptions={midCodes}
                onSaved={onSavedLow}
                onAddClick={() => setAddingLow(true)}
              />
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
