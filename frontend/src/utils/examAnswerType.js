import { useEffect, useState } from "react";
import { getCodeOptionList } from "../api/admin/system/code/codeApi";

/**
 * 시험 문제 유형 (TESTS.ANSWER_TYPE).
 * 저장 값은 공통 코드 TEST_ANSWER_TYPE 의 ID. 옛 데이터에는 한글 이름 등이 섞여 있어
 * 화면에서는 toAnswerTypeCode 로 코드로 바꾼 뒤 비교한다.
 */
export const ANSWER_TYPE = {
  SELECT: "ANSWER_SELECT",
  MULTIPLE: "ANSWER_MULTIPLE",
  WRITE: "ANSWER_WRITE",
  CHECK: "ANSWER_CHECK",
  CODE: "ANSWER_CODE",
};

const CODES = Object.values(ANSWER_TYPE);

/** 옛 값 → 코드 */
const LEGACY_TO_CODE = {
  "객관식-단항": ANSWER_TYPE.SELECT,
  "객관식-다항": ANSWER_TYPE.MULTIPLE,
  MULTIPLE: ANSWER_TYPE.MULTIPLE,
  주관식: ANSWER_TYPE.WRITE,
  "O/X": ANSWER_TYPE.CHECK,
  코드작성: ANSWER_TYPE.CODE,
  "코드 작성": ANSWER_TYPE.CODE,
};

/** 공통 코드를 못 불러올 때 쓰는 이름 (공통 코드 이름과 같게) */
const DEFAULT_NAMES = {
  [ANSWER_TYPE.SELECT]: "객관식-단항",
  [ANSWER_TYPE.MULTIPLE]: "객관식-다항",
  [ANSWER_TYPE.WRITE]: "주관식",
  [ANSWER_TYPE.CHECK]: "O/X",
  [ANSWER_TYPE.CODE]: "코드 작성",
};

/** 저장된 유형 값 → 코드. 알 수 없는 값은 그대로 돌려준다 */
export const toAnswerTypeCode = (value) => {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value).trim();
  if (CODES.includes(text)) {
    return text;
  }
  if (LEGACY_TO_CODE[text]) {
    return LEGACY_TO_CODE[text];
  }
  return text;
};

// 공통 코드 이름은 한 번만 불러와서 여러 화면이 같이 쓴다
let namesPromise = null;

const loadNames = () => {
  if (!namesPromise) {
    namesPromise = getCodeOptionList("TEST_ANSWER_TYPE")
      .then((codes) => {
        const names = { ...DEFAULT_NAMES };
        codes.forEach((code) => {
          names[code.id] = code.name;
        });
        return names;
      })
      .catch(() => {
        // 수강생처럼 환경 변수 조회 권한이 없으면 기본 이름을 쓴다 (다음에 다시 시도)
        namesPromise = null;
        return DEFAULT_NAMES;
      });
  }
  return namesPromise;
};

/**
 * 유형 값 → 화면에 보일 이름을 돌려주는 함수.
 * 이름은 환경 변수(TEST_ANSWER_TYPE)에서 불러오고, 못 불러오면 기본 이름을 쓴다.
 */
export const useAnswerTypeName = () => {
  const [names, setNames] = useState(DEFAULT_NAMES);

  useEffect(() => {
    let ignore = false;
    loadNames().then((loaded) => {
      if (!ignore) {
        setNames(loaded);
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  return (value) => {
    const code = toAnswerTypeCode(value);
    if (names[code]) {
      return names[code];
    }
    return code;
  };
};
