import { useEffect, useState } from "react";
import PageHeader from "../../../common/ui/PageHeader";
import Panel from "../../../common/ui/Panel";
import Table from "../../../common/ui/Table";
import Button from "../../../common/ui/Button";
import StatusBox from "../../../common/ui/StatusBox";
import { useToast } from "../../../common/ui/feedbackContext";
import { icons } from "../../../common/input/icons";
import { getCodeList } from "../../../../api/admin/system/code/codeApi";
import AddCode from "./AddCode";
import UpdateCode from "./UpdateCode";
import usePermission from "../../../../hooks/usePermission";
import useBreadcrumbs from "../../../../hooks/useBreadcrumbs";

const CODE_COLUMNS = [
  { key: "id", title: "코드", mono: true, ellipsis: true },
  { key: "name", title: "이름", ellipsis: true },
  { key: "order", title: "순서", width: "56px", align: "num" },
];

// 폼을 새로 만들지 판단할 key (코드가 없으면 "empty")
const toFormKey = (code) => {
  if (!code) {
    return "empty";
  }
  return code.id;
};

// 브레드크럼 마지막 항목의 제목 (없으면 기본 제목)
const pageTitleOf = (crumbs) => {
  const last = crumbs.at(-1);
  if (last && last.title) {
    return last.title;
  }
  return "환경 변수 관리";
};

export default function Code() {
  const { isSuperAdmin, status } = usePermission();
  const crumbs = useBreadcrumbs();

  // idle: 비로그인(조회하지 않음) → 표시 없음
  let content = null;
  if (status === "loading") {
    content = <StatusBox type="loading" title="권한 확인 중..." />;
  } else if (status === "failed") {
    content = (
      <StatusBox
        type="error"
        title="권한 정보를 불러오지 못했습니다."
        detail="새로고침 후 다시 시도해 주세요."
      />
    );
  } else if (status === "loaded") {
    if (isSuperAdmin) {
      content = <CodeManagement />;
    } else {
      content = <StatusBox type="denied" />;
    }
  }

  return (
    <>
      <PageHeader
        crumbs={crumbs}
        title={pageTitleOf(crumbs)}
        description="대 · 중 · 소 분류의 환경 변수(코드)를 관리합니다."
      />
      {content}
    </>
  );
}

function CodeManagement() {
  const toast = useToast();

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

  // 처음 불러오기 상태: loading | loaded | failed
  const [listStatus, setListStatus] = useState("loading");
  const [listError, setListError] = useState("");

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
    toast.error(e.message);
  };

  // 행 클릭 · 저장 후에 사용 (기존과 같은 이름이라 호출하는 쪽은 그대로)
  const loadCodes = (topId, midId, lowId) => {
    fetchCodes(topId, midId, lowId).then(applyCodes).catch(failCodes);
  };

  // 처음 불러오기 (실패하면 화면에 오류 + 다시 시도)
  const requestFirst = () => {
    fetchCodes()
      .then((result) => {
        applyCodes(result);
        setListStatus("loaded");
      })
      .catch((e) => {
        setListError(e.message);
        setListStatus("failed");
      });
  };

  // [다시 시도]
  const retryFirst = () => {
    setListStatus("loading");
    requestFirst();
  };

  useEffect(() => {
    requestFirst();
  }, []);

  const onSelectTop = (row) => {
    setAddingTop(false);
    setAddingMid(false);
    setAddingLow(false);
    loadCodes(row.id);
  };

  const onSelectMid = (row) => {
    setAddingMid(false);
    setAddingLow(false);
    loadCodes(idOf(selectedTopCode), row.id);
  };

  const onSelectLow = (row) => {
    setAddingLow(false);
    setSelectedLow(lowCodes.findIndex((code) => code.id === row.id));
  };

  // 추가 중이면 표에서 선택 표시를 끔
  const selectedKeyOf = (adding, code) => {
    if (adding || !code) {
      return undefined;
    }
    return code.id;
  };

  // 상위 코드가 없으면 그 안내, 있으면 빈 목록 안내
  const emptyTextOf = (hasParent) => {
    if (!hasParent) {
      return "상위 분류가 없습니다.";
    }
    return "코드가 없습니다.";
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

  if (listStatus === "loading") {
    return <StatusBox type="loading" title="목록을 불러오는 중..." />;
  }

  if (listStatus === "failed") {
    return (
      <StatusBox
        type="error"
        title="목록을 불러오지 못했습니다."
        detail={listError}
        onRetry={retryFirst}
      />
    );
  }

  const addButton = (adding, onClick) => (
    <Button size="sm" icon={icons.add} disabled={adding} onClick={onClick}>
      추가
    </Button>
  );

  return (
    <div className="layout-3col">
      <div className="form-stack">
        <Panel
          title="대 분류"
          subtitle={`${topCodes.length}건`}
          flush
          actions={addButton(addingTop, () => setAddingTop(true))}
        >
          <Table
            ariaLabel="대 분류 코드 목록"
            columns={CODE_COLUMNS}
            rows={topCodes}
            size="sm"
            selectedKey={selectedKeyOf(addingTop, selectedTopCode)}
            onRowClick={onSelectTop}
            isRowMuted={(code) => code.useYn === "N"}
            emptyText={emptyTextOf(true)}
          />
        </Panel>
        {addingTop && (
          <AddCode onSaved={onSavedTop} onCancel={() => setAddingTop(false)} />
        )}
        {!addingTop && (
          <UpdateCode
            key={toFormKey(selectedTopCode)}
            code={selectedTopCode}
            onSaved={onSavedTop}
          />
        )}
      </div>

      <div className="form-stack">
        <Panel
          title="중 분류"
          subtitle={`${midCodes.length}건`}
          flush
          actions={addButton(addingMid, () => setAddingMid(true))}
        >
          <Table
            ariaLabel="중 분류 코드 목록"
            columns={CODE_COLUMNS}
            rows={midCodes}
            size="sm"
            selectedKey={selectedKeyOf(addingMid, selectedMidCode)}
            onRowClick={onSelectMid}
            isRowMuted={(code) => code.useYn === "N"}
            emptyText={emptyTextOf(!!selectedTopCode)}
          />
        </Panel>
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
          />
        )}
      </div>

      <div className="form-stack">
        <Panel
          title="소 분류"
          subtitle={`${lowCodes.length}건`}
          flush
          actions={addButton(addingLow, () => setAddingLow(true))}
        >
          <Table
            ariaLabel="소 분류 코드 목록"
            columns={CODE_COLUMNS}
            rows={lowCodes}
            size="sm"
            selectedKey={selectedKeyOf(addingLow, selectedLowCode)}
            onRowClick={onSelectLow}
            isRowMuted={(code) => code.useYn === "N"}
            emptyText={emptyTextOf(!!selectedMidCode)}
          />
        </Panel>
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
          />
        )}
      </div>
    </div>
  );
}
