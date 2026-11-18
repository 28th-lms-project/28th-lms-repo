import { useEffect, useState } from "react";
import { getCodeOptionList } from "../../../../api/admin/system/code/codeApi";
import SelectBox from "../../../common/ui/SelectBox";
import { useToast } from "../../../common/ui/feedbackContext";

/**
 * 시험 종류 선택. 종류 목록은 공통 코드(TEST_TYPE)에서 불러온다.
 * TODO 고른 값은 아직 어디에도 저장 · 전송하지 않음 (등록 요청의 testType 에는 지금 시험 과목이 들어감, 담당자 확인 필요)
 * Field 안에서 쓸 때는 inputId 를 Field htmlFor 와 맞춘다. 나머지 props 는 SelectBox 로 전달
 */
export default function ExamSubjectSelect({ inputId, ...rest }) {
  const toast = useToast();
  const [typeOptions, setTypeOptions] = useState([]);
  // 종류 목록을 불러오는 동안은 고를 수 없게 하고 안내 문구를 보여 준다
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const codes = await getCodeOptionList("TEST_TYPE");
        if (!ignore) {
          setTypeOptions(
            codes.map((code) => ({ value: code.id, label: code.name })),
          );
        }
      } catch (e) {
        if (!ignore) {
          toast.error(`시험 종류를 불러오지 못했습니다. ${e.message ?? ""}`.trim());
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [toast]);

  return (
    <SelectBox
      {...rest}
      inputId={inputId}
      options={typeOptions}
      isDisabled={loading}
      placeholder={loading ? "종류 불러오는 중..." : "종류 선택"}
      isSearchable
    />
  );
}
