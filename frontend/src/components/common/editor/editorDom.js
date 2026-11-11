/**
 * 에디터(contentEditable) DOM 유틸
 * - 선택 영역 직렬화 (Undo/Redo 시 커서 복원)
 * - 인라인 스타일 적용 (글꼴 · 글자 크기 · 글자 색 · 배경 색)
 * - 블록 삽입 위치 계산
 * - 코드 블록 텍스트 추출
 */

export const ZWSP = "​";

/** 블록 요소 (인라인 스타일 적용 시 상위로 올라가지 않는 경계) */
export const BLOCK_SELECTOR =
  "p,h1,h2,h3,h4,h5,h6,li,td,th,blockquote,pre,div,summary,details,ul,ol,table,thead,tbody,tr";

/** 다른 블록을 담을 수 있는 영역 (블록 삽입 시 이 영역의 직계 자식 뒤에 삽입) */
export const CONTAINER_SELECTOR =
  ".editor-flex-item,.editor-textbox,.editor-float-left,.editor-float-right,.editor-details-body,td,th,blockquote,li";

const isElement = (node) => node?.nodeType === Node.ELEMENT_NODE;
const isText = (node) => node?.nodeType === Node.TEXT_NODE;

export const toElement = (node) => (isElement(node) ? node : node?.parentElement ?? null);

/** root 안에서 selector 와 일치하는 가장 가까운 조상 (root 자신은 제외) */
export const closestIn = (node, selector, root) => {
  let element = toElement(node);
  while (element && element !== root) {
    if (element.matches(selector)) return element;
    element = element.parentElement;
  }
  return null;
};

export const unwrap = (element) => {
  const parent = element.parentNode;
  if (!parent) return;
  while (element.firstChild) parent.insertBefore(element.firstChild, element);
  element.remove();
};

export const createParagraph = () => {
  const paragraph = document.createElement("p");
  paragraph.appendChild(document.createElement("br"));
  return paragraph;
};

// ======================================================================
// 선택 영역 직렬화 (노드 경로 + offset)
// ======================================================================
const getNodePath = (root, node) => {
  const path = [];
  let current = node;
  while (current && current !== root) {
    const parent = current.parentNode;
    if (!parent) return null;
    path.unshift(Array.prototype.indexOf.call(parent.childNodes, current));
    current = parent;
  }
  return current === root ? path : null;
};

const getNodeByPath = (root, path) => {
  let current = root;
  for (const index of path) {
    current = current?.childNodes[index];
    if (!current) return null;
  }
  return current;
};

const maxOffset = (node) =>
  isText(node) ? node.length : node.childNodes.length;

export const serializeRange = (root, range) => {
  if (!range) return null;
  const start = getNodePath(root, range.startContainer);
  const end = getNodePath(root, range.endContainer);
  if (!start || !end) return null;
  return { start, startOffset: range.startOffset, end, endOffset: range.endOffset };
};

export const deserializeRange = (root, data) => {
  if (!data) return null;
  const start = getNodeByPath(root, data.start);
  const end = getNodeByPath(root, data.end);
  if (!start || !end) return null;
  try {
    const range = document.createRange();
    range.setStart(start, Math.min(data.startOffset, maxOffset(start)));
    range.setEnd(end, Math.min(data.endOffset, maxOffset(end)));
    return range;
  } catch {
    return null;
  }
};

export const placeCaret = (range, node, atEnd = false) => {
  range.selectNodeContents(node);
  range.collapse(!atEnd);
  return range;
};

// ======================================================================
// 인라인 스타일 (span style) 적용 · 해제
// ======================================================================

/** 스타일 속성 → 같은 의미의 레거시 <font> 속성 */
const FONT_ATTRIBUTE = {
  "font-family": "face",
  "font-size": "size",
  color: "color",
};

const hasMeaningfulContent = (fragment) =>
  fragment.textContent.replaceAll(ZWSP, "") !== "" ||
  Boolean(fragment.querySelector?.("img,br,hr,a[data-file-id]"));

/** ancestor 를 node 앞 · node · node 뒤 세 부분으로 나누어 node 가 ancestor 에만 속하게 한다 */
const isolate = (node, ancestor) => {
  const after = document.createRange();
  after.setStartAfter(node);
  after.setEnd(ancestor, ancestor.childNodes.length);
  if (!after.collapsed) {
    const fragment = after.extractContents();
    if (hasMeaningfulContent(fragment)) {
      const clone = ancestor.cloneNode(false);
      clone.appendChild(fragment);
      ancestor.after(clone);
    }
  }

  const before = document.createRange();
  before.setStart(ancestor, 0);
  before.setEndBefore(node);
  if (!before.collapsed) {
    const fragment = before.extractContents();
    if (hasMeaningfulContent(fragment)) {
      const clone = ancestor.cloneNode(false);
      clone.appendChild(fragment);
      ancestor.before(clone);
    }
  }
};

const cleanupInline = (element) => {
  if (element.getAttribute("style") === "") element.removeAttribute("style");
  if (
    (element.tagName === "SPAN" || element.tagName === "FONT") &&
    element.attributes.length === 0
  ) {
    unwrap(element);
  }
};

/** 범위의 경계를 텍스트 노드 경계로 맞춘다 */
const splitRangeBoundaries = (range) => {
  const { endContainer, endOffset } = range;
  if (isText(endContainer) && endOffset > 0 && endOffset < endContainer.length) {
    endContainer.splitText(endOffset);
  }

  const { startContainer, startOffset } = range;
  if (isText(startContainer) && startOffset > 0 && startOffset < startContainer.length) {
    const sameNode = startContainer === range.endContainer;
    const end = range.endOffset;
    const rest = startContainer.splitText(startOffset);
    range.setStart(rest, 0);
    if (sameNode) range.setEnd(rest, end - startOffset);
  }
};

const STRUCTURE_PARENT = /^(UL|OL|TABLE|THEAD|TBODY|TFOOT|TR|DETAILS)$/;

const collectTextNodes = (root, range) => {
  const nodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const selected =
      range.intersectsNode(node) &&
      node.length > 0 &&
      !(node === range.endContainer && range.endOffset === 0) &&
      !(node === range.startContainer && range.startOffset >= node.length);

    const skip =
      !selected ||
      node.parentElement.closest('[contenteditable="false"], pre.editor-code') ||
      (node.data.trim() === "" &&
        (node.parentElement === root ||
          STRUCTURE_PARENT.test(node.parentElement.tagName) ||
          node.parentElement.classList.contains("editor-flex")));

    if (!skip) nodes.push(node);
    node = walker.nextNode();
  }
  return nodes;
};

/**
 * 선택한 텍스트에 CSS 속성을 적용한다. value 가 빈 값이면 해당 속성을 제거(기본값)한다.
 * 문단 · 셀 경계를 넘는 선택도 텍스트 노드 단위로 처리하므로 블록 구조가 깨지지 않는다.
 * @returns 적용 후 선택할 Range
 */
export const applyInlineStyle = (root, range, property, value) => {
  if (range.collapsed) {
    if (!value) return range;
    // 커서만 있는 경우: 스타일 span 을 넣고 그 안에서 이어서 입력
    const span = document.createElement("span");
    span.style.setProperty(property, value);
    const text = document.createTextNode(ZWSP);
    span.appendChild(text);
    range.insertNode(span);
    const next = document.createRange();
    next.setStart(text, 1);
    next.collapse(true);
    return next;
  }

  splitRangeBoundaries(range);
  const textNodes = collectTextNodes(root, range);
  if (textNodes.length === 0) return range;

  textNodes.forEach((textNode) => {
    // 상위 요소의 같은 속성을 걷어내어 텍스트 노드만 영향을 받게 한다
    let ancestor = textNode.parentElement;
    while (ancestor && ancestor !== root && !ancestor.matches(BLOCK_SELECTOR)) {
      const parent = ancestor.parentElement;
      const fontAttribute = FONT_ATTRIBUTE[property];
      const hasStyle = Boolean(ancestor.style?.getPropertyValue(property));
      const hasFontAttribute =
        ancestor.tagName === "FONT" && fontAttribute && ancestor.hasAttribute(fontAttribute);

      if (hasStyle || hasFontAttribute) {
        isolate(textNode, ancestor);
        ancestor.style.removeProperty(property);
        if (hasFontAttribute) ancestor.removeAttribute(fontAttribute);
        cleanupInline(ancestor);
      }
      ancestor = parent;
    }

    if (!value) return;

    const parent = textNode.parentElement;
    if (parent.tagName === "SPAN" && parent.childNodes.length === 1 && parent !== root) {
      parent.style.setProperty(property, value);
    } else {
      const span = document.createElement("span");
      span.style.setProperty(property, value);
      textNode.before(span);
      span.appendChild(textNode);
    }
  });

  const next = document.createRange();
  const first = textNodes[0];
  const last = textNodes[textNodes.length - 1];
  next.setStart(first, 0);
  next.setEnd(last, last.length);
  return next;
};

// ======================================================================
// 블록 삽입
// ======================================================================

/**
 * 커서가 있는 블록(컨테이너의 직계 자식)을 찾는다.
 * @returns { container, block } block 이 null 이면 container 끝에 삽입
 */
export const findInsertionPoint = (root, range) => {
  let node = range.startContainer;
  if (isElement(node) && node.childNodes[range.startOffset] && node === root) {
    return { container: root, block: node.childNodes[range.startOffset] };
  }

  while (node && node !== root) {
    const parent = node.parentNode;
    if (parent === root || (isElement(parent) && parent.matches(CONTAINER_SELECTOR))) {
      if (!root.contains(parent)) break;
      return { container: parent, block: node };
    }
    node = parent;
  }
  return { container: root, block: null };
};

const isEmptyBlock = (block) =>
  isElement(block) &&
  /^(P|DIV|H[1-6])$/.test(block.tagName) &&
  block.textContent.replaceAll(ZWSP, "").trim() === "" &&
  !block.querySelector("img,hr,table,a[data-file-id],pre,details");

/**
 * 커서 위치의 블록 뒤에 node 를 삽입한다 (빈 문단이면 교체).
 * 블록 뒤에 입력을 이어갈 수 있도록 빈 문단을 보장한다.
 */
export const insertBlock = (root, range, node) => {
  const { container, block } = findInsertionPoint(root, range);

  if (block && isEmptyBlock(block)) {
    block.replaceWith(node);
  } else if (block) {
    block.after(node);
  } else {
    container.appendChild(node);
  }

  const next = node.nextSibling;
  if (!next || (isElement(next) && !/^(P|H[1-6]|UL|OL|BLOCKQUOTE)$/.test(next.tagName))) {
    node.after(createParagraph());
  }
  return node;
};

/** 요소 앞 · 뒤에 빈 문단 추가 후 그 문단을 반환 */
export const insertParagraphAfter = (element) => {
  const paragraph = createParagraph();
  element.after(paragraph);
  return paragraph;
};

// ======================================================================
// 코드 블록
// ======================================================================

/** 코드 블록의 텍스트 (br · div 는 줄바꿈으로 변환) */
export const getCodeText = (node) => {
  let text = "";
  node.childNodes.forEach((child) => {
    if (isText(child)) {
      text += child.data;
    } else if (isElement(child)) {
      if (child.tagName === "BR") {
        text += "\n";
      } else {
        const isBlock = /^(DIV|P)$/.test(child.tagName);
        if (isBlock && text !== "" && !text.endsWith("\n")) text += "\n";
        text += getCodeText(child);
      }
    }
  });
  return text.replaceAll(ZWSP, "");
};

/** 커서 위치에 텍스트 삽입 (코드 블록 줄바꿈 · 들여쓰기, 일반 텍스트 붙여넣기) */
export const insertTextAtRange = (range, text) => {
  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  const next = document.createRange();
  next.setStartAfter(node);
  next.collapse(true);
  return { range: next, node };
};

/** 범위 뒤쪽에 (같은 코드 블록 안) 텍스트가 남아 있는지 */
export const hasTextAfter = (range, container) => {
  const after = document.createRange();
  after.setStart(range.endContainer, range.endOffset);
  after.setEnd(container, container.childNodes.length);
  return after.toString() !== "";
};

// ======================================================================
// URL 검증
// ======================================================================

/** http(s) 절대 URL 만 허용. 올바르지 않으면 null */
export const normalizeHttpUrl = (value, { httpsOnly = false } = {}) => {
  const trimmed = (value ?? "").trim();
  if (!trimmed || trimmed.length > 2000) return null;
  try {
    const url = new URL(trimmed);
    const allowed = httpsOnly ? ["https:"] : ["http:", "https:"];
    if (!allowed.includes(url.protocol) || url.username || url.password || !url.hostname) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
};
