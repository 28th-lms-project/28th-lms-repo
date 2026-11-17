let nextId = 1;

/** ListEditor에 넣을 새 행. id는 화면 안에서만 쓰는 임시 값 (저장할 때는 value만 보냄) */
export const newListItem = (value = "") => ({ id: `new-${nextId++}`, value });
