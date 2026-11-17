import Select from "react-select";
import { selectStyles } from "./selectStyles";

const NO_OPTIONS = () => "선택할 항목이 없습니다.";
const LOADING = () => "불러오는 중...";

/**
 * 검색 · 다중 선택이 필요한 셀렉트 (react-select + 표준 모양). 단순 목록이면 <select className="form-control">.
 * props는 react-select 그대로 (options · value · onChange · isMulti · isSearchable · isClearable · isLoading ...).
 *
 * @param {object} props
 * @param {"md"|"sm"} [props.size="md"]
 * @param {boolean} [props.aria-invalid]   오류 테두리 (Field error와 같이)
 * @param {boolean} [props.inModal]        모달 안: 메뉴를 body로 띄워 모달 밖으로 잘리지 않게
 *
 * Field와 쓸 때는 inputId를 htmlFor와 맞춘다: <Field htmlFor="tutor"><SelectBox inputId="tutor" /></Field>
 */
// eslint-disable-next-line no-unused-vars -- inModal: 예전 prop. 이제 메뉴는 항상 body로 띄우므로 받기만 하고 무시
export default function SelectBox({ inModal, placeholder = "선택", ...props }) {
  return (
    <Select
      styles={selectStyles}
      placeholder={placeholder}
      noOptionsMessage={NO_OPTIONS}
      loadingMessage={LOADING}
      // 메뉴는 항상 body로 띄움: 모달 · 표 · overflow 상자 안에서도 잘리지 않음 (z-index는 selectStyles.menuPortal)
      menuPortalTarget={document.body}
      {...props}
    />
  );
}
