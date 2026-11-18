import { useId, useState } from "react";
import Button from "../../../common/ui/Button";
import Callout from "../../../common/ui/Callout";
import ChoiceGroup from "../../../common/ui/ChoiceGroup";
import Field from "../../../common/ui/Field";
import ListEditor from "../../../common/ui/ListEditor";
import Panel from "../../../common/ui/Panel";
import QuestionBlock from "../../../common/ui/QuestionBlock";
import StatusBox from "../../../common/ui/StatusBox";
import { newListItem } from "../../../common/ui/listEditorItem";
import {
  CHOICE_TYPES,
  MAX_ITEMS,
  OX_OPTIONS,
  SUB_QUESTION_MAX,
} from "./questionFormValues";
import style from "./QuestionForm.module.css";

/**
 * 문제 추가 · 수정 공통 폼 (샘플 "문제 은행: 문제 추가 · 수정")
 * 보기 줄 수 = 보기 개수(answerCount), 줄 순서 = answerSheet1~5, 줄 앞에 표시한 번호 = correctAnswer
 */

// 서버 검사 결과(필드별 문구 배열) → 한 줄
const joinMessages = (messages) => {
  if (!messages || messages.length === 0) {
    return "";
  }
  return messages.join(" ");
};

export default function QuestionForm({
  title,
  badge,
  answerTypes,
  form,
  onChange,
  fieldErrors,
  saving,
  submitText,
  savingText,
  submitIcon,
  onSubmit,
  onCancel,
  onResetErrors,
}) {
  const formId = useId();
  const [ownError, setOwnError] = useState("");

  const update = (patch) => {
    onChange({ ...form, ...patch });
  };

  const isChoice = CHOICE_TYPES.includes(form.type);
  const isMultiple = form.type === "ANSWER_MULTIPLE";
  const isCode = form.type === "ANSWER_CODE";
  const isWrite = form.type === "ANSWER_WRITE";

  const changeType = (type) => {
    // 유형을 바꾸면 정답 표시는 다시 고름. 보기 내용은 그대로
    let items = form.items;
    if (CHOICE_TYPES.includes(type) && items.length < 2) {
      items = [newListItem(), newListItem(), newListItem(), newListItem()];
    }
    setOwnError("");
    onResetErrors();
    onChange({ ...form, type, items, correct: [], ox: "" });
  };

  const changeItems = (items) => {
    const ids = items.map((item) => item.id);
    setOwnError("");
    onResetErrors();
    update({ items, correct: form.correct.filter((id) => ids.includes(id)) });
  };

  const toggleCorrect = (id) => {
    setOwnError("");
    if (isMultiple) {
      onResetErrors();
    }
    if (!isMultiple) {
      update({ correct: [id] });
      return;
    }
    if (form.correct.includes(id)) {
      update({ correct: form.correct.filter((c) => c !== id) });
    } else {
      update({ correct: [...form.correct, id] });
    }
  };

  const submit = (event) => {
    event.preventDefault();
    if (isMultiple && form.correct.length < 2) {
      setOwnError("정답을 2개 이상 선택해주세요.");
      return;
    }
    setOwnError("");
    onSubmit();
  };

  // 보기 · 정답 칸 오류: 화면 검사 + 서버의 정답 · 보기 개수 · 보기 n 오류
  const itemMessages = [];
  if (ownError) {
    itemMessages.push(ownError);
  }
  if (isChoice) {
    const correctMessage = joinMessages(fieldErrors.correctAnswer);
    if (correctMessage) {
      itemMessages.push(correctMessage);
    }
  }
  const countMessage = joinMessages(fieldErrors.answerCount);
  if (countMessage) {
    itemMessages.push(countMessage);
  }
  for (let no = 1; no <= MAX_ITEMS; no++) {
    const sheetMessage = joinMessages(fieldErrors[`answerSheet${no}`]);
    if (sheetMessage) {
      itemMessages.push(`${no}번 보기: ${sheetMessage}`);
    }
  }

  let oxError = "";
  if (form.type === "ANSWER_CHECK") {
    oxError = joinMessages(fieldErrors.correctAnswer);
  }

  const formMessages = [];
  const globalMessage = joinMessages(fieldErrors.global);
  if (globalMessage) {
    formMessages.push(globalMessage);
  }
  const subjectMessage = joinMessages(fieldErrors.subjectId);
  if (subjectMessage) {
    formMessages.push(subjectMessage);
  }

  let itemsHint = `1~${MAX_ITEMS}개. 정답 보기 하나를 왼쪽 동그라미로 표시`;
  let itemsMin = 1;
  if (isMultiple) {
    itemsHint = `2~${MAX_ITEMS}개. 정답 보기를 왼쪽 네모로 모두 표시 (2개 이상)`;
    itemsMin = 2;
  }

  let subLabel = "부연 설명";
  let subClass = "form-control";
  let subRows = 3;
  if (isCode) {
    subLabel = "부연 설명 · 예시 코드";
    subClass = "form-control form-control-mono";
    subRows = 5;
  }

  const typeOptions = answerTypes.map((type) => ({
    value: type.id,
    label: type.name,
  }));

  let submitLabel = submitText;
  if (saving) {
    submitLabel = savingText;
  }

  return (
    <div className="layout-split">
      <form onSubmit={submit} noValidate>
        <Panel
          title={title}
          badge={badge}
          footer={
            <>
              <Button onClick={onCancel} disabled={saving}>
                취소
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={submitIcon}
                loading={saving}
              >
                {submitLabel}
              </Button>
            </>
          }
        >
          <div className="form-stack">
            {formMessages.length > 0 && (
              <Callout tone="danger">{formMessages.join(" ")}</Callout>
            )}
            <Field
              label="문제 유형"
              required
              error={joinMessages(fieldErrors.answerType)}
            >
              <ChoiceGroup
                name={`${formId}-type`}
                legend="문제 유형"
                options={typeOptions}
                value={form.type}
                onChange={changeType}
              />
            </Field>
            <Field
              label="문제"
              htmlFor={`${formId}-question`}
              required
              error={joinMessages(fieldErrors.question)}
            >
              <textarea
                id={`${formId}-question`}
                className="form-control"
                rows={2}
                value={form.question}
                onChange={(e) => update({ question: e.target.value })}
                aria-invalid={!!fieldErrors.question}
                aria-describedby={`${formId}-question-msg`}
              />
            </Field>
            <Field
              label={subLabel}
              htmlFor={`${formId}-sub`}
              hint="선택. 문제 아래 회색 상자에 보이는 내용 (줄바꿈 유지)"
              error={joinMessages(fieldErrors.subQuestion)}
              count={{ current: form.subQuestion.length, max: SUB_QUESTION_MAX }}
            >
              <textarea
                id={`${formId}-sub`}
                className={subClass}
                rows={subRows}
                maxLength={SUB_QUESTION_MAX}
                value={form.subQuestion}
                onChange={(e) => update({ subQuestion: e.target.value })}
                aria-invalid={!!fieldErrors.subQuestion}
                aria-describedby={`${formId}-sub-msg`}
              />
            </Field>
            <Field
              label="배점"
              htmlFor={`${formId}-point`}
              required
              hint="1~4점"
              error={joinMessages(fieldErrors.pointAlloc)}
            >
              <input
                id={`${formId}-point`}
                type="number"
                min={1}
                max={4}
                className={`form-control ${style.pointInput}`}
                value={form.point}
                onChange={(e) => update({ point: e.target.value })}
                aria-invalid={!!fieldErrors.pointAlloc}
                aria-describedby={`${formId}-point-msg`}
              />
            </Field>

            {isChoice && (
              <Field
                label="보기 · 정답"
                required
                hint={itemsHint}
                error={itemMessages.join(" ")}
              >
                <ListEditor
                  label="보기"
                  items={form.items}
                  onChange={changeItems}
                  min={itemsMin}
                  max={MAX_ITEMS}
                  addLabel="보기 추가"
                  placeholder="보기 내용"
                  renderMarker={(item, index) => {
                    let markerType = "radio";
                    if (isMultiple) {
                      markerType = "checkbox";
                    }
                    return (
                      <label className="list-editor-mark" title="정답으로 표시">
                        <input
                          type={markerType}
                          name={`${formId}-correct`}
                          checked={form.correct.includes(item.id)}
                          onChange={() => toggleCorrect(item.id)}
                          aria-label={`보기 ${index + 1} 정답`}
                        />
                      </label>
                    );
                  }}
                />
              </Field>
            )}
            {form.type === "ANSWER_CHECK" && (
              <Field label="정답" required error={oxError}>
                <ChoiceGroup
                  variant="segmented"
                  name={`${formId}-ox`}
                  legend="정답"
                  options={OX_OPTIONS}
                  value={form.ox}
                  onChange={(ox) => update({ ox })}
                />
              </Field>
            )}
            {(isWrite || isCode) && (
              <Callout tone="info">
                수강생이 작성한 답변은 제출 후 강사가 채점합니다.
              </Callout>
            )}
          </div>
        </Panel>
      </form>

      <Panel title="미리 보기" subtitle="수강생 화면">
        <QuestionPreview form={form} />
      </Panel>
    </div>
  );
}

// 수강생에게 보이는 모양 (정답은 초록)
const QuestionPreview = ({ form }) => {
  if (!form.type) {
    return (
      <StatusBox
        type="empty"
        size="sm"
        title="문제 유형을 고르면 여기에 보입니다."
      />
    );
  }

  const isChoice = CHOICE_TYPES.includes(form.type);
  const isCode = form.type === "ANSWER_CODE";

  let options;
  let answer;
  if (isChoice) {
    options = form.items.map((item, index) => {
      let label = item.value;
      if (!label) {
        label = `보기 ${index + 1}`;
      }
      return { value: item.id, label };
    });
    answer = form.correct;
  } else if (form.type === "ANSWER_CHECK") {
    options = OX_OPTIONS;
    answer = form.ox;
  }

  let body;
  let code;
  if (form.subQuestion) {
    if (isCode) {
      code = form.subQuestion;
    } else {
      body = form.subQuestion;
    }
  }

  let title = form.question;
  if (!title) {
    title = "문제를 입력하세요";
  }

  let score;
  if (Number(form.point)) {
    score = Number(form.point);
  }

  let answerClass = "form-control";
  if (isCode) {
    answerClass = "form-control form-control-mono";
  }

  return (
    <QuestionBlock
      no={1}
      title={title}
      score={score}
      body={body}
      code={code}
      options={options}
      multiple={form.type === "ANSWER_MULTIPLE"}
      answer={answer}
      showResult={!!options}
    >
      {!options && (
        <textarea
          className={answerClass}
          rows={3}
          disabled
          placeholder="수강생 답안 칸"
          aria-label="수강생 답안 칸 (미리 보기)"
        />
      )}
    </QuestionBlock>
  );
};
