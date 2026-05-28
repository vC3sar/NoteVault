import { escapeHTML } from "../../utils.js";
import { openBlockModal } from "../modal.js";
import { blockShell, insertRichBlock } from "../block-renderer.js";
import { registerBlockEditor } from "../block-editors.js";

const PRIORITIES = {
  low: { label: "Baja", color: "#22c55e" },
  medium: { label: "Media", color: "#f59e0b" },
  high: { label: "Alta", color: "#ef4444" },
};

export const reminderBlock = {
  id: "reminder",
  name: "Recordatorio",
  category: "recommended",
  description: "Recordatorio con fecha.",
  icon: "alarm-clock",
  async insert() {
    const now = new Date(Date.now() + 30 * 60 * 1000);
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000).toISOString().slice(0, 16);
    const data = await openBlockModal({
      title: "Recordatorio",
      icon: "bell-ring",
      submitLabel: "Insertar recordatorio",
      fields: [
        { name: "title", label: "Titulo", placeholder: "Ej. Entregar actividad", required: true },
        { name: "date", label: "Fecha y hora", type: "datetime-local", value: localDateTime, required: true },
        {
          name: "priority",
          label: "Prioridad",
          type: "select",
          value: "medium",
          options: [
            { value: "low", label: "Baja" },
            { value: "medium", label: "Media" },
            { value: "high", label: "Alta" },
          ],
        },
      ],
    });
    if (!data) return false;

    const priority = PRIORITIES[data.priority] || PRIORITIES.medium;
    const date = new Date(data.date);
    const formattedDate = Number.isNaN(date.getTime())
      ? "Fecha no definida"
      : date.toLocaleString("es-MX", { dateStyle: "full", timeStyle: "short" });

    return insertRichBlock(blockShell({
      type: "reminder",
      icon: "bell-ring",
      title: escapeHTML(data.title.trim()),
      meta: `Prioridad ${priority.label}`,
      accent: priority.color,
      data: {
        reminderTitle: data.title.trim(),
        reminderDate: data.date,
        reminderPriority: data.priority,
      },
      body: `
        <div class="rich-reminder-card" data-priority="${escapeHTML(data.priority)}">
          <span class="rich-reminder-date" contenteditable="false"><i data-lucide="calendar-clock" class="w-4 h-4"></i>${escapeHTML(formattedDate)}</span>
        </div>
      `,
    }));
  },
};

registerBlockEditor("reminder", async (block) => {
  if (!block) return false;
  const currentTitle = block.querySelector(".rich-block-heading strong")?.textContent?.trim() || block.dataset.reminderTitle || "";
  const currentDate = block.dataset.reminderDate || "";
  const currentPriority = block.dataset.reminderPriority || "medium";

  const data = await openBlockModal({
    title: "Editar recordatorio",
    icon: "bell-ring",
    submitLabel: "Guardar cambios",
    fields: [
      { name: "title", label: "Titulo", placeholder: "Ej. Entregar actividad", value: currentTitle, required: true },
      { name: "date", label: "Fecha y hora", type: "datetime-local", value: currentDate, required: true },
      {
        name: "priority",
        label: "Prioridad",
        type: "select",
        value: currentPriority,
        options: [
          { value: "low", label: "Baja" },
          { value: "medium", label: "Media" },
          { value: "high", label: "Alta" },
        ],
      },
    ],
  });
  if (!data) return false;

  const priority = PRIORITIES[data.priority] || PRIORITIES.medium;
  const date = new Date(data.date);
  const formattedDate = Number.isNaN(date.getTime())
    ? "Fecha no definida"
    : date.toLocaleString("es-MX", { dateStyle: "full", timeStyle: "short" });

  block.dataset.reminderTitle = data.title.trim();
  block.dataset.reminderDate = data.date;
  block.dataset.reminderPriority = data.priority;
  block.style.setProperty("--block-accent", priority.color);

  const titleEl = block.querySelector(".rich-block-heading strong");
  if (titleEl) titleEl.textContent = data.title.trim();

  const metaEl = block.querySelector(".rich-block-heading small");
  if (metaEl) metaEl.textContent = `Prioridad ${priority.label}`;

  const card = block.querySelector(".rich-reminder-card");
  if (card) card.dataset.priority = data.priority;

  const dateEl = block.querySelector(".rich-reminder-date");
  if (dateEl) {
    dateEl.innerHTML = `<i data-lucide="calendar-clock" class="w-4 h-4"></i>${escapeHTML(formattedDate)}`;
  }

  return true;
});
