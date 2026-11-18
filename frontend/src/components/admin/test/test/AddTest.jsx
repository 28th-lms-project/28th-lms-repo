import { useState } from "react";
import { useDispatch } from "react-redux";
import { createNewQuestion } from "../../../../api/admin/system/test/testApi";
import { testActions } from "../../../../store/slices/testSliceStore";
import Button from "../../../common/ui/Button";
import { useToast } from "../../../common/ui/feedbackContext";
import { icons } from "../../../common/input/icons";
import QuestionForm from "./QuestionForm";
import { emptyQuestionForm, toQuestionPayload } from "./questionFormValues";

export default function AddTest({ subjectId, answerTypes, questionCount }) {
  const [addState, setAddState] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState(emptyQuestionForm);
  const [saving, setSaving] = useState(false);

  const dispatch = useDispatch();
  const toast = useToast();

  const onClickAddButtonHandler = () => {
    setFieldErrors({});
    const registTestQ = {
      subjectId: subjectId,
      ...toQuestionPayload(form),
    };
    setSaving(true);
    (async () => {
      try {
        const response = await createNewQuestion(registTestQ);
        dispatch(testActions.addTestQuestion(response));
        toast.success("문제를 등록했습니다.");
        setAddState(false);
        console.log(response);
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

  return (
    <>
      <div className="toolbar">
        <span className="field-hint">{questionCount}문제</span>
        {!addState && (
          <Button
            variant="primary"
            icon={icons.add}
            onClick={() => {
              setFieldErrors({});
              setForm(emptyQuestionForm());
              setAddState(true);
            }}
          >
            문제 추가
          </Button>
        )}
      </div>
      {addState && (
        <QuestionForm
          title="문제 추가"
          answerTypes={answerTypes}
          form={form}
          onChange={setForm}
          onResetErrors={() => setFieldErrors({})}
          fieldErrors={fieldErrors}
          saving={saving}
          submitText="등록"
          savingText="등록 중..."
          submitIcon={icons.add}
          onSubmit={onClickAddButtonHandler}
          onCancel={() => {
            setFieldErrors({});
            setAddState(false);
          }}
        />
      )}
    </>
  );
}
