import { handleInput } from "../editor.js";

export function getEditor() {
  return document.getElementById("editor");
}

export function ensureSelectionInEditor(editor) {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const node =
      sel.anchorNode && sel.anchorNode.nodeType === Node.TEXT_NODE
        ? sel.anchorNode.parentElement
        : sel.anchorNode;
    if (node && editor.contains(node)) return;
  }

  editor.focus();
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
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
