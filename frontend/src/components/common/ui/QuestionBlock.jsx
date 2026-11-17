import { useId } from "react";

/**
 * 시험 문제 한 개: 번호 · 제목 · 배점 + 문제 내용(글 · 코드) + 보기 목록. 스타일은 styles/content.css.
 * 주관식 · 코드 답안은 children으로 입력 칸을 넣는다 (<textarea className="form-control form-control-mono" />).
 *
 * @param {object} props
 * @param {number|string} props.no
 * @param {React.ReactNode} props.title
 * @param {number} [props.score]                배점 ("5점")
 * @param {React.ReactNode} [props.body]        문제 내용 (회색 상자, 줄바꿈 유지)
 * @param {string} [props.code]                 코드 문제 (고정폭 상자)
 * @param {{ value: string, label: React.ReactNode }[]} [props.options]  보기
 * @param {boolean} [props.multiple]            여러 개 고르기 (체크박스)
 * @param {string|string[]} [props.value]       고른 보기 (multiple이면 배열)
 * @param {(value) => void} [props.onChange]    없으면 읽기 전용 (보기만)
 * @param {string|string[]} [props.answer]      정답. showResult일 때 초록 표시
 * @param {boolean} [props.showResult]          채점 결과: 정답 초록 · 고른 오답 빨강, 고칠 수 없음
 */
export default function QuestionBlock({
  no,
  title,
  score,
  body,
  code,
  options,
  multiple = false,
  value,
  onChange,
  answer,
  showResult = false,
  children,
}) {
  const name = useId();
  const titleId = `${name}-title`;
  const asList = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);
  const chosen = asList(value);
  const answers = asList(answer);
  const readOnly = !onChange || showResult;

  const handleChange = (optionValue) => {
    if (!multiple) return onChange(optionValue);
    onChange(chosen.includes(optionValue) ? chosen.filter((v) => v !== optionValue) : [...chosen, optionValue]);
  };

  return (
    <article className="question" aria-labelledby={titleId}>
      <header className="question-head">
        <span className="question-no">{no}</span>
        <h4 id={titleId} className="question-title">
          {title}
        </h4>
        {score != null && <span className="question-score">{score}점</span>}
      </header>

      {body && <div className="question-body">{body}</div>}
      {code && <pre className="question-code">{code}</pre>}

      {options && (
        <ol className="option-list" role={multiple ? "group" : "radiogroup"} aria-labelledby={titleId}>
          {options.map((option) => {
            const isChosen = chosen.includes(option.value);
            const isAnswer = showResult && answers.includes(option.value);
            const isWrong = showResult && isChosen && !answers.includes(option.value);
            return (
              <li key={option.value}>
                <label className={["option", isAnswer && "is-answer", isWrong && "is-wrong"].filter(Boolean).join(" ")}>
                  <input
                    type={multiple ? "checkbox" : "radio"}
                    name={name}
                    value={option.value}
                    checked={isChosen}
                    disabled={readOnly}
                    onChange={() => handleChange(option.value)}
                  />
                  <span>{option.label}</span>
                  {isAnswer && <span className="option-result">정답{isChosen ? " · 선택" : ""}</span>}
                  {isWrong && <span className="option-result">선택 (오답)</span>}
                </label>
              </li>
            );
          })}
        </ol>
      )}

      {children}
    </article>
  );
}
