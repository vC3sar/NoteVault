import { escapeHTML, refreshIcons } from "../../utils.js";
import { insertHtmlAtCursor } from "../editor-dom.js";

function insertChip(type, icon, label) {
  const html = `&nbsp;<span class="rich-inline-chip" data-block-type="${type}" data-chip-icon="${icon}" contenteditable="false"><i data-lucide="${icon}" class="w-3.5 h-3.5" aria-hidden="true"></i><span>${escapeHTML(label)}</span></span>&nbsp;`;
  const inserted = insertHtmlAtCursor(html);
  if (inserted) refreshIcons();
  return inserted;
}

export const currentDateBlock = {
  id: "current-date",
  name: "Fecha actual",
  category: "recommended",
  description: "Inserta la fecha de hoy.",
  icon: "calendar-days",
  insert() {
    const label = new Date().toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return insertChip("current-date", "calendar-days", label);
  },
};

export const currentTimeBlock = {
  id: "current-time",
  name: "Hora actual",
  category: "recommended",
  description: "Inserta la hora actual.",
  icon: "clock-3",
  insert() {
    return insertChip("current-time", "clock-3", new Date().toLocaleTimeString("es-MX", { timeStyle: "short" }));
  },
};
