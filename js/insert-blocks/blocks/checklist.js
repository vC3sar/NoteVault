import { escapeHTML } from "../../utils.js";
import { openBlockModal } from "../modal.js";
import { blockShell, insertRichBlock, updateBlockElement } from "../block-renderer.js";
import { registerBlockEditor } from "../block-editors.js";

function buildChecklistBody(items) {
  return `
    <div class="rich-checklist-progress" contenteditable="false">
      <span class="rich-checklist-progress-track"><span class="rich-checklist-progress-bar" style="width:0%"></span></span>
      <span class="rich-checklist-count">0/${items.length}</span>
    </div>
    <div class="rich-checklist-items">
      ${items.map((item) => `
        <label class="rich-checklist-item">
          <input type="checkbox" contenteditable="false" ${item.checked ? "checked" : ""}>
          <span contenteditable="true">${escapeHTML(item.text)}</span>
        </label>
      `).join("")}
    </div>
  `;
}

export const checklistBlock = {
  id: "check-list",
  name: "Checklist",
  category: "recommended",
  description: "Tareas pendientes.",
  icon: "list-checks",
  async insert() {
    const data = await openBlockModal({
      title: "Checklist",
      icon: "list-checks",
      submitLabel: "Insertar checklist",
      fields: [
        { name: "title", label: "Titulo", placeholder: "Pendientes", value: "Checklist", required: true },
        { name: "items", label: "Items", type: "items", placeholder: "Tarea" },
      ],
    });
    if (!data) return false;
    const items = (data.items?.length ? data.items : ["Tarea 1"]).map((text) => ({ text, checked: false }));

    return insertRichBlock(blockShell({
      type: "check-list",
      icon: "list-checks",
      title: escapeHTML(data.title.trim()),
      meta: `${items.length} items`,
      accent: "#16a34a",
      data: {
        checklistTitle: data.title.trim(),
      },
      body: buildChecklistBody(items),
    }));
  },
};

registerBlockEditor("check-list", async (block) => {
  if (!block) return false;
  const title = block.querySelector(".rich-block-heading strong")?.textContent?.trim() || "Checklist";
  const items = Array.from(block.querySelectorAll(".rich-checklist-item")).map((item) => ({
    text: item.querySelector("span")?.textContent?.trim() || "",
    checked: !!item.querySelector('input[type="checkbox"]')?.checked,
  }));

  const data = await openBlockModal({
    title: "Editar checklist",
    icon: "list-checks",
    submitLabel: "Guardar cambios",
    fields: [
      { name: "title", label: "Titulo", placeholder: "Pendientes", value: title, required: true },
      { name: "items", label: "Items", type: "items", placeholder: "Tarea", items: items.map((item) => item.text || "Tarea") },
    ],
  });
  if (!data) return false;

  const nextItems = (data.items?.length ? data.items : ["Tarea 1"]).map((text, index) => ({
    text,
    checked: items[index]?.checked || false,
  }));

  block.dataset.checklistTitle = data.title.trim();
  const titleEl = block.querySelector(".rich-block-heading strong");
  if (titleEl) titleEl.textContent = data.title.trim();

  const body = block.querySelector(".rich-block-body");
  if (body) body.innerHTML = buildChecklistBody(nextItems);
  updateBlockElement(block);
  return true;
});
