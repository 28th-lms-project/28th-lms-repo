import { useEffect, useState } from "react";
import {
  deleteTestQuestion,
  searchTestQuestion,
  updateTestQuestion,
} from "../../../../api/admin/system/test/testApi";
import { useDispatch } from "react-redux";
import { testActions } from "../../../../store/slices/testSliceStore";
import { questActions } from "../../../../store/slices/questionSliceStore";
import Button from "../../../common/ui/Button";
import StatusBox from "../../../common/ui/StatusBox";
import { useConfirm, useToast } from "../../../common/ui/feedbackContext";
import { icons } from "../../../common/input/icons";
import QuestionForm from "./QuestionForm";
import { toQuestionForm, toQuestionPayload } from "./questionFormValues";
import style from "./Test.module.css";

/**
 * 문제 카드의 [수정] [삭제] 버튼 줄 + 수정 폼.
 * children: 버튼 줄 왼쪽에 놓을 것 (보기 · 정답 펼치기 버튼)
 */
export default function UpdateTest({ questionId, answerTypes, children }) {
  const [modifying, setModifying] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  // 이 문제로 이미 제출된 답안 수 (있으면 저장 전에 경고)
  const [submittedCount, setSubmittedCount] = useState(0);

  const dispatch = useDispatch();
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    if (!modifying) {
      return;
    }
    let ignoreUpdateState = false;

    (async () => {
      try {
        const response = await searchTestQuestion(questionId);
        console.log(response);

        if (!ignoreUpdateState) {
          dispatch(questActions.setViewQuestion(response));
          setForm(toQuestionForm(response));
          setSubmittedCount(Number(response.submittedAnswerCount) || 0);
        }
      } catch (e) {
        if (!ignoreUpdateState) {
          toast.error(e.message);
        }
      }
    })();
    return () => {
      ignoreUpdateState = true;
    };
  }, [questionId, dispatch, modifying, toast]);

  const onClickDeleteButtonHandler = async (questionId) => {
    const ok = await confirm({
      title: "문제 삭제",
      message: "이 문제를 삭제할까요?",
      confirmText: "삭제",
      danger: true,
    });
    if (!ok) {
      return;
    }
    try {
      await deleteTestQuestion(questionId);
      dispatch(testActions.deleteTestQuestion(questionId));
      toast.success("문제를 삭제했습니다.");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const onClickCancelHandler = () => {
    setFieldErrors({});
    setModifying(false);
    setForm(null);
    setSubmittedCount(0);
    dispatch(questActions.clearViewQuestion());
  };

  const onClickUpdateHandler = async () => {
    // 이미 응시한 답안이 있으면: 저장된 답안 · 채점 결과는 옛 문제 기준으로 남는다는 것을 알리고 확인
    if (submittedCount > 0) {
      const ok = await confirm({
        title: "응시한 문제 수정",
        message: `이 문제로 제출된 답안이 ${submittedCount}건 있습니다.\n수정해도 이미 제출된 답안과 채점 결과는 바뀌지 않아, 채점 화면에서 답안과 문제가 맞지 않을 수 있습니다.\n그래도 수정할까요?`,
        confirmText: "수정",
        danger: true,
      });
      if (!ok) {
        return;
      }
    }
    setFieldErrors({});

    // 백엔드 ModifyExamQuestionVO 필드 이름과 똑같이 맞춤
    const modQuestion = toQuestionPayload(form);
    modQuestion.pointAlloc = Number(modQuestion.pointAlloc);

    setSaving(true);
    (async () => {
      try {
        // 서버가 수정된 문제를 돌려주면 그걸로 목록을 갱신
        const updatedQuestion = await updateTestQuestion(
          questionId,
          modQuestion,
        );
        dispatch(testActions.updateTestQuestion(updatedQuestion));
        toast.success("문제를 저장했습니다.");
        onClickCancelHandler();
      } catch (e) {
        if (e.validations) {
          setFieldErrors(e.validations);
        } else {
          toast.error(e.message);
        }
      } finally {
        setSaving(false);
      }
    })();
  };

  let editArea = null;
  if (modifying) {
    if (form) {
      editArea = (
        <QuestionForm
          title="문제 수정"
          answerTypes={answerTypes}
          form={form}
          onChange={setForm}
          onResetErrors={() => setFieldErrors({})}
          fieldErrors={fieldErrors}
          saving={saving}
          submitText="저장"
          savingText="저장 중..."
          onSubmit={onClickUpdateHandler}
          onCancel={onClickCancelHandler}
        />
      );
    } else {
      editArea = (
        <StatusBox type="loading" size="sm" title="문제를 불러오는 중..." />
      );
    }
  }

  return (
    <>
      <div className={style.cardActions}>
        <div>{children}</div>
        {!modifying && (
          <div className="btn-group">
            <Button
              size="sm"
              icon={icons.edit}
              onClick={() => {
                setFieldErrors({});
                setForm(null);
                setModifying(true);
              }}
            >
              수정
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={icons.delete}
              onClick={() => {
                onClickDeleteButtonHandler(questionId);
              }}
            >
              삭제
            </Button>
          </div>
        )}
      </div>
      {editArea}
    </>
  );
}
