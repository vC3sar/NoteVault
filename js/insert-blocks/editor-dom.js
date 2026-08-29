import { handleInput } from "../editor.js";

export function getEditor() {
  return document.getElementById("editor");
}

let lastKnownRange = null;

document.addEventListener("selectionchange", () => {
  const editor = getEditor();
  if (!editor) return;
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const node = sel.anchorNode && sel.anchorNode.nodeType === Node.TEXT_NODE
      ? sel.anchorNode.parentElement
      : sel.anchorNode;
    if (node && editor.contains(node)) {
      lastKnownRange = sel.getRangeAt(0).cloneRange();
    }
  }
});

export function ensureSelectionInEditor(editor) {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const node =
      sel.anchorNode && sel.anchorNode.nodeType === Node.TEXT_NODE
        ? sel.anchorNode.parentElement
        : sel.anchorNode;
    if (node && editor.contains(node)) {
      lastKnownRange = sel.getRangeAt(0).cloneRange();
      return;
    }
  }

  const rangeToRestore = lastKnownRange;

  editor.focus({ preventScroll: true });
  
  const selection = window.getSelection();
  selection.removeAllRanges();

  if (rangeToRestore) {
    selection.addRange(rangeToRestore);
    lastKnownRange = rangeToRestore;
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);
  selection.addRange(range);
}

export function insertHtmlAtCursor(html) {
  const editor = getEditor();
  if (!editor) return false;
  ensureSelectionInEditor(editor);
  document.execCommand("insertHTML", false, html);
  handleInput();
  return true;
}
