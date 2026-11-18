import { newListItem } from "../../../common/ui/listEditorItem";
import { toAnswerTypeCode } from "../../../../utils/examAnswerType";

/**
 * 문제 추가 · 수정 폼의 값 변환 (QuestionForm에서 씀)
 * 보기 줄 수 = 보기 개수(answerCount), 줄 순서 = answerSheet1~5, 줄 앞에 표시한 번호 = correctAnswer
 */

export const CHOICE_TYPES = ["ANSWER_SELECT", "ANSWER_MULTIPLE"];
export const OX_OPTIONS = [
  { value: "O", label: "O" },
  { value: "X", label: "X" },
];
export const MAX_ITEMS = 5;
// 부연 설명 최대 글자 수 (TESTS.SUB_QUESTION VARCHAR2(2000 CHAR), VO @Size와 같게)
export const SUB_QUESTION_MAX = 2000;

/** 빈 폼 (보기 4줄, 배점 4) */
export const emptyQuestionForm = () => ({
  type: "",
  question: "",
  subQuestion: "",
  point: "4",
  items: [newListItem(), newListItem(), newListItem(), newListItem()],
  correct: [],
  ox: "",
});

/** 서버에서 받은 문제 → 폼 값 */
export const toQuestionForm = (response) => {
  // 옛 데이터(한글 이름 등)도 코드로 바꿔서 폼에 넣음 → 저장하면 코드로 고쳐진다
  const type = toAnswerTypeCode(response.answerType);
  const sheet = [
    response.answerSheet1,
    response.answerSheet2,
    response.answerSheet3,
    response.answerSheet4,
    response.answerSheet5,
  ];
  let count = Number(response.answerCount) || 0;
  if (!count) {
    count = sheet.filter(
      (sheet) => sheet !== null && sheet !== undefined && sheet !== "",
    ).length;
  }
  const answers = sheet;
  const items = answers.slice(0, count).map((answer) => {
    let text = answer;
    if (answer === null || answer === undefined) {
      text = "";
    }
    return newListItem(text);
  });

  const correctNumbers = [];
  if (response.correctAnswer) {
    String(response.correctAnswer)
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .forEach((value) => correctNumbers.push(value));
  }

  let correct = [];
  let ox = "";
  if (response.correctAnswer === "O" || response.correctAnswer === "X") {
    ox = response.correctAnswer;
  } else if (CHOICE_TYPES.includes(type)) {
    correct = correctNumbers
      .map((number) => items[Number(number) - 1])
      .filter(Boolean)
      .map((item) => item.id);
  }

  let point = "";
  if (response.pointAlloc !== null && response.pointAlloc !== undefined) {
    point = String(response.pointAlloc);
  }

  let subQuestion = "";
  if (response.subQuestion) {
    subQuestion = response.subQuestion;
  }

  let question = "";
  if (response.question) {
    question = response.question;
  }

  return {
    type,
    question,
    subQuestion,
    point,
    items,
    correct,
    ox,
  };
};

/** 폼 값 → 서버로 보내는 값 (AddTest · UpdateTest가 보내던 것과 같은 필드) */
export const toQuestionPayload = (form) => {
  const noChoices = !CHOICE_TYPES.includes(form.type);

  let answerCount = null;
  if (!noChoices) {
    answerCount = form.items.length;
  }

  const getAnswer = (index) => {
    if (noChoices) {
      return null;
    }
    if (index >= form.items.length) {
      return "";
    }
    return form.items[index].value;
  };

  let correctAnswer = null;
  if (form.type === "ANSWER_CHECK") {
    correctAnswer = form.ox;
  } else if (!noChoices) {
    const numbers = [];
    form.items.forEach((item, index) => {
      if (form.correct.includes(item.id)) {
        numbers.push(index + 1);
      }
    });
    correctAnswer = numbers.join(",");
  }

  return {
    question: form.question,
    subQuestion: form.subQuestion,
    answerType: form.type,
    correctAnswer,
    pointAlloc: form.point,
    answerCount,
    answerSheet1: getAnswer(0),
    answerSheet2: getAnswer(1),
    answerSheet3: getAnswer(2),
    answerSheet4: getAnswer(3),
    answerSheet5: getAnswer(4),
  };
};
