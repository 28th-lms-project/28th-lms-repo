/**
 * 에디터 표 편집 (colspan / rowspan 을 고려한 논리 격자 기반)
 *
 * 모든 함수는 { ok, message?, focus? } 를 반환한다.
 * - ok=false: message 를 사용자에게 안내
 * - focus: 작업 후 커서를 둘 셀 (없으면 null)
 */

export const TABLE_CLASS = "editor-table";

const createCell = (tagName = "td") => {
  const cell = document.createElement(tagName);
  cell.appendChild(document.createElement("br"));
  return cell;
};

const setSpan = (cell, name, value) => {
  if (value > 1) cell.setAttribute(name, String(value));
  else cell.removeAttribute(name);
};

/** 표를 논리 격자로 변환. grid[row][col] = 그 칸을 차지하는 셀 */
export const buildTableMap = (table) => {
  const rows = Array.from(table.rows);
  const grid = rows.map(() => []);
  const positions = new Map();

  rows.forEach((row, rowIndex) => {
    let col = 0;
    Array.from(row.cells).forEach((cell) => {
      while (grid[rowIndex][col]) col += 1;
      const rowSpan = Math.min(Math.max(cell.rowSpan || 1, 1), rows.length - rowIndex);
      const colSpan = Math.max(cell.colSpan || 1, 1);
      positions.set(cell, { row: rowIndex, col, rowSpan, colSpan });
      for (let r = 0; r < rowSpan; r += 1) {
        for (let c = 0; c < colSpan; c += 1) {
          grid[rowIndex + r][col + c] = cell;
        }
      }
      col += colSpan;
    });
  });

  const width = grid.reduce((max, row) => Math.max(max, row.length), 0);
  return { rows, grid, positions, width, height: rows.length };
};

/** row 행에서 논리 열 col 위치에 셀 삽입 (해당 행에서 시작하는 셀 기준) */
const insertCellInRow = (map, rowIndex, col, cell) => {
  const row = map.rows[rowIndex];
  const next = Array.from(row.cells).find((item) => {
    const position = map.positions.get(item);
    return position && position.col >= col;
  });
  if (next) row.insertBefore(cell, next);
  else row.appendChild(cell);
};

const removeTableIfEmpty = (table) => {
  if (!table.querySelector("td, th")) {
    table.remove();
    return true;
  }
  return false;
};

export const createTable = (rowCount, colCount) => {
  const table = document.createElement("table");
  table.className = TABLE_CLASS;
  const body = document.createElement("tbody");
  for (let r = 0; r < rowCount; r += 1) {
    const row = document.createElement("tr");
    for (let c = 0; c < colCount; c += 1) row.appendChild(createCell());
    body.appendChild(row);
  }
  table.appendChild(body);
  return table;
};

// ======================================================================
// 열
// ======================================================================
export const insertColumn = (table, refCell, side) => {
  const map = buildTableMap(table);
  const position = map.positions.get(refCell);
  if (!position) return { ok: false, message: "표의 셀을 선택하세요." };

  const col = side === "left" ? position.col : position.col + position.colSpan;
  const extended = new Set();

  for (let r = 0; r < map.height; r += 1) {
    const cell = map.grid[r][col];
    const cellPosition = cell && map.positions.get(cell);
    if (cellPosition && cellPosition.col < col) {
      // 병합 셀이 새 열 위치를 가로지르면 colspan 만 늘린다
      if (!extended.has(cell)) {
        cell.colSpan = cellPosition.colSpan + 1;
        extended.add(cell);
      }
      continue;
    }
    if (cellPosition && cellPosition.row < r) {
      // 위 행에서 내려온 병합 셀 → 이 행에서 시작하는 셀 기준으로 삽입
      insertCellInRow(map, r, col, createCell(cell.tagName.toLowerCase()));
      continue;
    }
    insertCellInRow(map, r, col, createCell(cell?.tagName.toLowerCase() ?? "td"));
  }
  return { ok: true, focus: refCell };
};

export const deleteColumn = (table, refCell) => {
  const map = buildTableMap(table);
  const position = map.positions.get(refCell);
  if (!position) return { ok: false, message: "표의 셀을 선택하세요." };

  const col = position.col;
  const handled = new Set();
  for (let r = 0; r < map.height; r += 1) {
    const cell = map.grid[r][col];
    if (!cell || handled.has(cell)) continue;
    handled.add(cell);
    const cellPosition = map.positions.get(cell);
    if (cellPosition.colSpan > 1) setSpan(cell, "colspan", cellPosition.colSpan - 1);
    else cell.remove();
  }

  if (removeTableIfEmpty(table)) return { ok: true, focus: null, removed: true };
  const nextMap = buildTableMap(table);
  const focusRow = nextMap.grid[Math.min(position.row, nextMap.height - 1)] ?? [];
  return { ok: true, focus: focusRow[Math.min(col, focusRow.length - 1)] ?? null };
};

// ======================================================================
// 행
// ======================================================================
export const insertRow = (table, refCell, side) => {
  const map = buildTableMap(table);
  const position = map.positions.get(refCell);
  if (!position) return { ok: false, message: "표의 셀을 선택하세요." };

  const rowIndex = side === "above" ? position.row : position.row + position.rowSpan;
  const newRow = document.createElement("tr");
  const extended = new Set();

  for (let c = 0; c < map.width; c += 1) {
    const cell = rowIndex < map.height ? map.grid[rowIndex][c] : undefined;
    const cellPosition = cell && map.positions.get(cell);
    if (cellPosition && cellPosition.row < rowIndex) {
      // 병합 셀이 새 행 위치를 가로지르면 rowspan 만 늘린다
      if (!extended.has(cell)) {
        cell.rowSpan = cellPosition.rowSpan + 1;
        extended.add(cell);
      }
      continue;
    }
    newRow.appendChild(createCell());
  }

  if (rowIndex < map.height) map.rows[rowIndex].before(newRow);
  else map.rows[map.height - 1].after(newRow);

  return { ok: true, focus: newRow.cells[0] ?? refCell };
};

export const deleteRow = (table, refCell) => {
  const map = buildTableMap(table);
  const position = map.positions.get(refCell);
  if (!position) return { ok: false, message: "표의 셀을 선택하세요." };

  const rowIndex = position.row;
  const handled = new Set();

  for (let c = 0; c < map.width; c += 1) {
    const cell = map.grid[rowIndex][c];
    if (!cell || handled.has(cell)) continue;
    handled.add(cell);
    const cellPosition = map.positions.get(cell);

    if (cellPosition.row < rowIndex) {
      setSpan(cell, "rowspan", cellPosition.rowSpan - 1);
    } else if (cellPosition.rowSpan > 1) {
      // 이 행에서 시작해 아래로 병합된 셀 → 다음 행으로 옮기고 rowspan 감소
      setSpan(cell, "rowspan", cellPosition.rowSpan - 1);
      insertCellInRow(map, rowIndex + 1, cellPosition.col, cell);
    }
  }

  map.rows[rowIndex].remove();
  if (removeTableIfEmpty(table)) return { ok: true, focus: null, removed: true };

  const nextMap = buildTableMap(table);
  const focusRow = nextMap.grid[Math.min(rowIndex, nextMap.height - 1)] ?? [];
  return { ok: true, focus: focusRow[Math.min(position.col, focusRow.length - 1)] ?? null };
};

// ======================================================================
// 셀 병합 · 분할
// ======================================================================

/** 두 셀이 이루는 사각형 범위 */
const getRect = (map, cellA, cellB) => {
  const a = map.positions.get(cellA);
  const b = map.positions.get(cellB);
  if (!a || !b) return null;
  return {
    top: Math.min(a.row, b.row),
    left: Math.min(a.col, b.col),
    bottom: Math.max(a.row + a.rowSpan - 1, b.row + b.rowSpan - 1),
    right: Math.max(a.col + a.colSpan - 1, b.col + b.colSpan - 1),
  };
};

/** 선택 범위(시작 셀 ~ 끝 셀)에 포함되는 셀 목록 (선택 표시용) */
export const getCellsInRange = (table, startCell, endCell) => {
  const map = buildTableMap(table);
  const rect = getRect(map, startCell, endCell);
  if (!rect) return [];
  const cells = new Set();
  for (let r = rect.top; r <= rect.bottom; r += 1) {
    for (let c = rect.left; c <= rect.right; c += 1) {
      if (map.grid[r]?.[c]) cells.add(map.grid[r][c]);
    }
  }
  return Array.from(cells);
};

const hasCellContent = (cell) =>
  cell.textContent.trim() !== "" || Boolean(cell.querySelector("img,table,hr,a[data-file-id],pre"));

export const mergeCells = (table, startCell, endCell) => {
  const map = buildTableMap(table);
  const rect = startCell && endCell ? getRect(map, startCell, endCell) : null;
  if (!rect) {
    return { ok: false, message: "병합할 셀을 드래그하여 2개 이상 선택하세요." };
  }

  const cells = new Set();
  for (let r = rect.top; r <= rect.bottom; r += 1) {
    for (let c = rect.left; c <= rect.right; c += 1) {
      const cell = map.grid[r]?.[c];
      if (!cell) {
        return { ok: false, message: "빈 칸이 포함되어 있어 병합할 수 없습니다." };
      }
      const position = map.positions.get(cell);
      const inside =
        position.row >= rect.top &&
        position.col >= rect.left &&
        position.row + position.rowSpan - 1 <= rect.bottom &&
        position.col + position.colSpan - 1 <= rect.right;
      if (!inside) {
        return {
          ok: false,
          message: "선택 범위 밖으로 이어지는 병합 셀이 있어 병합할 수 없습니다. 범위를 다시 선택하세요.",
        };
      }
      cells.add(cell);
    }
  }

  if (cells.size < 2) {
    return { ok: false, message: "병합할 셀을 드래그하여 2개 이상 선택하세요." };
  }

  const target = map.grid[rect.top][rect.left];
  cells.forEach((cell) => {
    if (cell === target) return;
    if (hasCellContent(cell)) {
      if (hasCellContent(target)) target.appendChild(document.createElement("br"));
      else target.replaceChildren();
      while (cell.firstChild) target.appendChild(cell.firstChild);
    }
    cell.remove();
  });

  setSpan(target, "rowspan", rect.bottom - rect.top + 1);
  setSpan(target, "colspan", rect.right - rect.left + 1);

  // 병합으로 셀이 하나도 남지 않은 행은 rowspan 을 줄이고 제거
  Array.from(table.rows).forEach((row) => {
    if (row.cells.length > 0) return;
    const rowIndex = Array.from(table.rows).indexOf(row);
    const current = buildTableMap(table);
    const handled = new Set();
    (current.grid[rowIndex] ?? []).forEach((cell) => {
      if (!cell || handled.has(cell)) return;
      handled.add(cell);
      setSpan(cell, "rowspan", current.positions.get(cell).rowSpan - 1);
    });
    row.remove();
  });

  return { ok: true, focus: target };
};

export const splitCell = (table, cell) => {
  const map = buildTableMap(table);
  const position = map.positions.get(cell);
  if (!position) return { ok: false, message: "표의 셀을 선택하세요." };
  if (position.rowSpan === 1 && position.colSpan === 1) {
    return { ok: false, message: "병합된 셀에서만 분할할 수 있습니다." };
  }

  setSpan(cell, "rowspan", 1);
  setSpan(cell, "colspan", 1);
  const tagName = cell.tagName.toLowerCase();

  for (let r = position.row; r < position.row + position.rowSpan; r += 1) {
    for (let c = position.col; c < position.col + position.colSpan; c += 1) {
      if (r === position.row && c === position.col) continue;
      // 같은 열 범위의 다음 셀 앞에 순서대로 삽입 (c 가 커질수록 뒤에 붙음)
      insertCellInRow(map, r, c, createCell(tagName));
    }
  }
  return { ok: true, focus: cell };
};
