import { escapeHTML, refreshIcons } from "../utils.js";

const modalState = {
  active: null,
};

function createField(field, form) {
  const id = `block-field-${field.name}`;
  const required = field.required ? "required" : "";
  const value = field.value ?? "";

  if (field.type === "select") {
    return `
      <label class="block-modal-field">
        <span>${escapeHTML(field.label)}</span>
        <select id="${id}" name="${escapeHTML(field.name)}" ${required}>
          ${(field.options || []).map((option) => `
            <option value="${escapeHTML(option.value)}" ${option.value === value ? "selected" : ""}>${escapeHTML(option.label)}</option>
          `).join("")}
        </select>
      </label>
    `;
  }

  if (field.type === "textarea") {
    return `
      <label class="block-modal-field">
        <span>${escapeHTML(field.label)}</span>
        <textarea id="${id}" name="${escapeHTML(field.name)}" rows="${field.rows || 3}" placeholder="${escapeHTML(field.placeholder || "")}" ${required}>${escapeHTML(value)}</textarea>
      </label>
    `;
  }

  if (field.type === "items") {
    const items = field.items?.length ? field.items : ["Tarea 1", "Tarea 2"];
    return `
      <div class="block-modal-field block-modal-items" data-items-field="${escapeHTML(field.name)}">
        <span>${escapeHTML(field.label)}</span>
        <div class="block-modal-items-list">
          ${items.map((item) => `
            <div class="block-modal-item-row">
              <input type="text" value="${escapeHTML(item)}" placeholder="${escapeHTML(field.placeholder || "Elemento")}">
              <button type="button" data-remove-item title="Eliminar"><i data-lucide="x" class="w-4 h-4"></i></button>
            </div>
          `).join("")}
        </div>
        <button type="button" class="block-modal-secondary" data-add-item><i data-lucide="plus" class="w-4 h-4"></i>Agregar item</button>
      </div>
    `;
  }

  if (field.type === "timeline-events") {
    const items = field.items?.length ? field.items : [{ date: "", label: "", desc: "" }];
    return `
      <div class="block-modal-field block-modal-timeline" data-timeline-field="${escapeHTML(field.name)}">
        <span>${escapeHTML(field.label)}</span>
        <div class="block-modal-timeline-list space-y-2">
          ${items.map((item) => `
            <div class="block-modal-timeline-row flex gap-2 border border-outline-variant/15 p-2 rounded-lg bg-surface-container-low relative">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1">
                <input type="text" data-timeline-date value="${escapeHTML(item.date || "")}" placeholder="Fecha (Ej. 1945)">
                <input type="text" data-timeline-label value="${escapeHTML(item.label || "")}" placeholder="Evento (Ej. Fin de la Guerra)">
                <input type="text" data-timeline-desc value="${escapeHTML(item.desc || "")}" placeholder="Descripción (Ej. Opcional)">
              </div>
              <button type="button" class="p-2 self-center rounded-lg hover:bg-surface-container-high text-on-surface-variant shrink-0" data-remove-timeline-item title="Eliminar"><i data-lucide="x" class="w-4 h-4"></i></button>
            </div>
          `).join("")}
        </div>
        <button type="button" class="block-modal-secondary mt-2" data-add-timeline-item><i data-lucide="plus" class="w-4 h-4"></i>Agregar hito</button>
      </div>
    `;
  }

  const min = field.min != null ? `min="${escapeHTML(String(field.min))}"` : "";
  const max = field.max != null ? `max="${escapeHTML(String(field.max))}"` : "";
  return `
    <label class="block-modal-field">
      <span>${escapeHTML(field.label)}</span>
      <input id="${id}" name="${escapeHTML(field.name)}" type="${escapeHTML(field.type || "text")}" value="${escapeHTML(value)}" placeholder="${escapeHTML(field.placeholder || "")}" ${min} ${max} ${required}>
      ${field.help ? `<small>${escapeHTML(field.help)}</small>` : ""}
    </label>
  `;
}

function collectFormData(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  form.querySelectorAll("[data-items-field]").forEach((field) => {
    const name = field.getAttribute("data-items-field");
    data[name] = Array.from(field.querySelectorAll(".block-modal-item-row input"))
      .map((input) => input.value.trim())
      .filter(Boolean);
  });
  form.querySelectorAll("[data-timeline-field]").forEach((field) => {
    const name = field.getAttribute("data-timeline-field");
    data[name] = Array.from(field.querySelectorAll(".block-modal-timeline-row"))
      .map((row) => ({
        date: row.querySelector("[data-timeline-date]").value.trim(),
        label: row.querySelector("[data-timeline-label]").value.trim(),
        desc: row.querySelector("[data-timeline-desc]").value.trim(),
      }))
      .filter((item) => item.date || item.label);
  });
  return data;
}

export function openBlockModal({ title, icon = "square-plus", fields = [], submitLabel = "Insertar" }) {
  closeBlockModal();

  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "block-config-modal";
    overlay.innerHTML = `
      <div class="block-config-dialog" role="dialog" aria-modal="true">
        <div class="block-config-header">
          <div class="block-config-title">
            <span><i data-lucide="${escapeHTML(icon)}" class="w-5 h-5"></i></span>
            <strong>${escapeHTML(title)}</strong>
          </div>
          <button type="button" class="block-config-close" data-close-block-modal title="Cerrar"><i data-lucide="x" class="w-4 h-4"></i></button>
        </div>
        <form class="block-config-form">
          <div class="block-config-fields">${fields.map((field) => createField(field)).join("")}</div>
          <div class="block-config-error" hidden></div>
          <div class="block-config-actions">
            <button type="button" class="block-modal-secondary" data-close-block-modal>Cancelar</button>
            <button type="submit" class="block-modal-primary">${escapeHTML(submitLabel)}</button>
          </div>
        </form>
      </div>
    `;

    const form = overlay.querySelector("form");
    const error = overlay.querySelector(".block-config-error");

    const finish = (value) => {
      overlay.remove();
      modalState.active = null;
      resolve(value);
    };

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay || event.target.closest("[data-close-block-modal]")) finish(null);

      const addButton = event.target.closest("[data-add-item]");
      if (addButton) {
        const list = addButton.closest("[data-items-field]").querySelector(".block-modal-items-list");
        list.insertAdjacentHTML("beforeend", `
          <div class="block-modal-item-row">
            <input type="text" value="" placeholder="Elemento">
            <button type="button" data-remove-item title="Eliminar"><i data-lucide="x" class="w-4 h-4"></i></button>
          </div>
        `);
        refreshIcons();
      }

      const removeButton = event.target.closest("[data-remove-item]");
      if (removeButton) removeButton.closest(".block-modal-item-row")?.remove();

      const addTimeline = event.target.closest("[data-add-timeline-item]");
      if (addTimeline) {
        const list = addTimeline.closest("[data-timeline-field]").querySelector(".block-modal-timeline-list");
        list.insertAdjacentHTML("beforeend", `
          <div class="block-modal-timeline-row flex gap-2 border border-outline-variant/15 p-2 rounded-lg bg-surface-container-low relative">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1">
              <input type="text" data-timeline-date value="" placeholder="Fecha">
              <input type="text" data-timeline-label value="" placeholder="Evento">
              <input type="text" data-timeline-desc value="" placeholder="Descripción">
            </div>
            <button type="button" class="p-2 self-center rounded-lg hover:bg-surface-container-high text-on-surface-variant shrink-0" data-remove-timeline-item title="Eliminar"><i data-lucide="x" class="w-4 h-4"></i></button>
          </div>
        `);
        refreshIcons();
      }

      const removeTimeline = event.target.closest("[data-remove-timeline-item]");
      if (removeTimeline) removeTimeline.closest(".block-modal-timeline-row")?.remove();
    });

    form.addEventListener("input", () => {
      error.hidden = true;
      error.textContent = "";
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      finish(collectFormData(form));
    });

    document.body.appendChild(overlay);
    modalState.active = overlay;
    refreshIcons();
    form.querySelector("input, textarea, select")?.focus();
  });
}

export function closeBlockModal() {
  if (!modalState.active) return;
  modalState.active.remove();
  modalState.active = null;
}
