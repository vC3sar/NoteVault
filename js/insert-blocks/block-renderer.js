import { createId, refreshIcons } from "../utils.js";
import { handleInput } from "../editor.js";
import { getEditor, insertHtmlAtCursor } from "./editor-dom.js";
import { getBlockEditor } from "./block-editors.js";

let initialized = false;
let dragState = null;

function buildDataAttrs(data = {}) {
  const toKebab = (value) => String(value).replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
  return Object.entries(data)
    .filter(([, value]) => value != null && value !== "")
    .map(([key, value]) => `data-${toKebab(key)}="${String(value).replace(/"/g, "&quot;")}"`)
    .join(" ");
}

export function blockShell({ type, icon, title, meta = "", body = "", accent = "#6366f1", editable = true, data = {} }) {
  const dataAttrs = buildDataAttrs({ blockType: type, blockIcon: icon, ...data });
  return `
    <div class="rich-insert-block-wrap" data-block-instance="${createId()}">
      <section class="rich-insert-block" ${dataAttrs} style="--block-accent:${accent}">
        <div class="rich-block-accent" contenteditable="false"></div>
        <div class="rich-block-main">
          <div class="rich-block-header" contenteditable="false">
            <div class="rich-block-heading">
              <span class="rich-block-icon"><i data-lucide="${icon}" class="w-4 h-4"></i></span>
              <div>
                <strong>${title}</strong>
                ${meta ? `<small>${meta}</small>` : ""}
              </div>
            </div>
            <div class="rich-block-actions" contenteditable="false">
              <button type="button" data-rich-block-edit title="Editar" contenteditable="false"><i data-lucide="pencil" class="w-4 h-4"></i></button>
              <button type="button" data-rich-block-delete title="Eliminar" contenteditable="false"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
              <span title="Arrastrar" data-rich-block-drag contenteditable="false"><i data-lucide="grip-vertical" class="w-4 h-4"></i></span>
            </div>
          </div>
          <div class="rich-block-body" contenteditable="${editable ? "true" : "false"}">${body}</div>
        </div>
      </section>
      <p><br></p>
    </div>
  `;
}

export function insertRichBlock(html) {
  const inserted = insertHtmlAtCursor(html);
  if (inserted) {
    initRichBlocks(getEditor());
    refreshIcons();
  }
  return inserted;
}

export function updateBlockElement(block) {
  if (!block) return;
  ensureActionIcons(block);
  updateChecklistProgress(block);
}

function updateChecklistProgress(block) {
  if (block?.dataset.blockType !== "check-list") return;
  const checkboxes = Array.from(block.querySelectorAll('.rich-checklist-item input[type="checkbox"]'));
  const total = checkboxes.length;
  const done = checkboxes.filter((checkbox) => checkbox.checked).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const bar = block.querySelector(".rich-checklist-progress-bar");
  const label = block.querySelector(".rich-checklist-count");
  if (bar) bar.style.width = `${percent}%`;
  if (label) label.textContent = `${done}/${total}`;
  const meta = block.querySelector(".rich-block-heading small");
  if (meta) meta.textContent = `${total} items`;
  block.querySelectorAll(".rich-checklist-item").forEach((item) => {
    const checkbox = item.querySelector('input[type="checkbox"]');
    const checked = !!checkbox?.checked;
    if (checkbox) {
      if (checked) checkbox.setAttribute("checked", "");
      else checkbox.removeAttribute("checked");
    }
    item.classList.toggle("is-checked", checked);
  });
}

function ensureActionIcons(block) {
  if (!block.dataset.blockType) {
    const legacyType = block.getAttribute("data-blocktype");
    if (legacyType) block.setAttribute("data-block-type", legacyType);
  }
  if (!block.dataset.blockIcon) {
    const legacyIcon = block.getAttribute("data-blockicon");
    if (legacyIcon) block.setAttribute("data-block-icon", legacyIcon);
  }
  const headingIcon = block.querySelector(".rich-block-icon");
  const blockIcon = block.dataset.blockIcon;
  if (headingIcon && blockIcon && !headingIcon.querySelector("[data-lucide]")) {
    headingIcon.innerHTML = `<i data-lucide="${blockIcon}" class="w-4 h-4"></i>`;
  }
  const actions = block.querySelector(".rich-block-actions");
  actions?.setAttribute("contenteditable", "false");
  const editButton = block.querySelector("[data-rich-block-edit]");
  editButton?.setAttribute("contenteditable", "false");
  if (editButton && !editButton.querySelector("[data-lucide]")) {
    editButton.innerHTML = '<i data-lucide="pencil" class="w-4 h-4"></i>';
  }
  const deleteButton = block.querySelector("[data-rich-block-delete]");
  deleteButton?.setAttribute("contenteditable", "false");
  if (deleteButton && !deleteButton.querySelector("[data-lucide]")) {
    deleteButton.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i>';
  }
  const dragHandle = block.querySelector("[data-rich-block-drag]") || block.querySelector(".rich-block-actions span");
  dragHandle?.setAttribute("contenteditable", "false");
  dragHandle?.setAttribute("data-rich-block-drag", "");
  dragHandle?.removeAttribute("draggable");
  if (dragHandle && !dragHandle.querySelector("[data-lucide]")) {
    dragHandle.innerHTML = '<i data-lucide="grip-vertical" class="w-4 h-4"></i>';
  }
}

function closestElement(target, selector) {
  return target instanceof Element ? target.closest(selector) : null;
}

function getOwnedBlockContext(target) {
  const action = target instanceof Element ? target : null;
  if (!action) return null;
  const wrapper = action.closest(".rich-insert-block-wrap");
  if (!wrapper) return null;
  const block = wrapper.querySelector(":scope > .rich-insert-block") || wrapper.querySelector(".rich-insert-block");
  if (!block || !block.contains(action)) return null;
  const editor = getEditor();
  if (!editor || !editor.contains(wrapper)) return null;
  return { editor, wrapper, block };
}

function getActiveRichBlockFromSelection() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  let node = selection.anchorNode;
  if (!node) return null;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
  return closestElement(node, ".rich-insert-block");
}

function syncActiveCaretBlock() {
  const editor = getEditor();
  if (!editor) return;
  const activeBlock = getActiveRichBlockFromSelection();
  editor.querySelectorAll(".rich-insert-block.is-active-caret").forEach((block) => {
    if (block !== activeBlock) block.classList.remove("is-active-caret");
  });
  if (activeBlock && editor.contains(activeBlock)) {
    activeBlock.classList.add("is-active-caret");
  }
}

function finishDrag() {
  if (!dragState) return;
  try {
    dragState.dragHandle?.releasePointerCapture(dragState.pointerId);
  } catch (e) {}
  dragState.card.classList.remove("is-dragging");
  document.body.classList.remove("rich-block-dragging");
  dragState = null;
  handleInput();
}

function normalizeRichBlockWrappers(root = document) {
  root.querySelectorAll?.(".rich-insert-block").forEach((card) => {
    if (card.closest(".rich-insert-block-wrap")) return;
    const wrapper = document.createElement("div");
    wrapper.className = "rich-insert-block-wrap";
    wrapper.setAttribute("data-block-instance", createId());
    const spacer = card.nextElementSibling?.tagName === "P" ? card.nextElementSibling : null;
    card.parentNode.insertBefore(wrapper, card);
    wrapper.appendChild(card);
    if (spacer) wrapper.appendChild(spacer);
    else wrapper.insertAdjacentHTML("beforeend", "<p><br></p>");
  });
}

function focusEditableBody(block) {
  const body = block?.querySelector(".rich-block-body");
  if (!body) return;
  block.classList.add("is-editing");
  body.setAttribute("contenteditable", "true");
  body.focus();
  const range = document.createRange();
  range.selectNodeContents(body);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

async function runBlockEditor(block) {
  const editor = getBlockEditor(block?.dataset.blockType || "");
  if (editor) {
    const changed = await editor(block);
    if (changed) {
      ensureActionIcons(block);
      refreshIcons();
      handleInput();
    }
    return changed;
  }
  focusEditableBody(block);
  handleInput();
  return true;
}

export function initRichBlocks(root = document) {
  normalizeRichBlockWrappers(root);
  root.querySelectorAll?.(".rich-insert-block").forEach((block) => {
    updateBlockElement(block);
  });
  root.querySelectorAll?.(".rich-image-block img").forEach((img) => {
    if (img.__richImageReady) return;
    img.__richImageReady = true;
    img.addEventListener("error", () => img.closest(".rich-image-block")?.classList.add("is-broken"));
    img.addEventListener("load", () => img.closest(".rich-image-block")?.classList.remove("is-broken"));
  });
  refreshIcons();
  if (initialized) return;
  initialized = true;

  document.addEventListener("pointerdown", (event) => {
    const dragHandle = closestElement(event.target, "[data-rich-block-drag]");
    if (dragHandle) {
      const block = dragHandle.closest(".rich-insert-block");
      const wrapper = block?.closest(".rich-insert-block-wrap");
      if (!block || !wrapper) return;
      event.preventDefault();
      event.stopPropagation();
      dragState = {
        pointerId: event.pointerId,
        wrapper,
        card: block,
        dragHandle
      };
      try {
        dragHandle.setPointerCapture(event.pointerId);
      } catch (e) {}
      dragState.card.classList.add("is-dragging");
      document.body.classList.add("rich-block-dragging");
      return;
    }

    if (!closestElement(event.target, ".rich-block-actions")) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  document.addEventListener("click", (event) => {
    const deleteButton = closestElement(event.target, "[data-rich-block-delete]");
    if (deleteButton) {
      event.preventDefault();
      event.stopPropagation();
      const context = getOwnedBlockContext(deleteButton);
      if (!context) return;
      context.wrapper.remove();
      syncActiveCaretBlock();
      handleInput();
      return;
    }

    const editButton = closestElement(event.target, "[data-rich-block-edit]");
    if (editButton) {
      event.preventDefault();
      event.stopPropagation();
      const context = getOwnedBlockContext(editButton);
      if (!context) return;
      void runBlockEditor(context.block);
    }
  }, true);

  document.addEventListener("change", (event) => {
    const checkbox = event.target.closest('.rich-checklist-item input[type="checkbox"]');
    if (!checkbox) return;
    updateBlockElement(checkbox.closest(".rich-insert-block"));
    handleInput();
  });

  document.addEventListener("focusout", (event) => {
    const body = closestElement(event.target, ".rich-block-body");
    if (!body) return;
    const block = body.closest(".rich-insert-block");
    requestAnimationFrame(() => {
      if (!block || block.contains(document.activeElement)) return;
      block.classList.remove("is-editing");
      syncActiveCaretBlock();
    });
  }, true);

  document.addEventListener("selectionchange", () => {
    syncActiveCaretBlock();
  });

  document.addEventListener("pointermove", (event) => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    event.preventDefault();
    const targetWrapper = closestElement(document.elementFromPoint(event.clientX, event.clientY), ".rich-insert-block-wrap");
    if (!targetWrapper || targetWrapper === dragState.wrapper) return;
    const targetCard = targetWrapper.querySelector(".rich-insert-block");
    if (!targetCard) return;
    const rect = targetCard.getBoundingClientRect();
    const before = event.clientY < rect.top + rect.height / 2;
    if (before) {
      targetWrapper.parentNode.insertBefore(dragState.wrapper, targetWrapper);
    } else {
      targetWrapper.parentNode.insertBefore(dragState.wrapper, targetWrapper.nextSibling);
    }
  }, true);

  document.addEventListener("pointerup", finishDrag, true);
  document.addEventListener("pointercancel", finishDrag, true);
}
