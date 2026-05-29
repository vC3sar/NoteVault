import { escapeHTML } from "../../utils.js";
import { openBlockModal } from "../modal.js";
import { blockShell, insertRichBlock } from "../block-renderer.js";
import { registerBlockEditor } from "../block-editors.js";

export const timelineBlock = {
  id: "timeline",
  name: "Línea de tiempo",
  category: "blocks",
  description: "Cronograma de hitos históricos.",
  icon: "history",
  async insert() {
    const data = await openBlockModal({
      title: "Insertar Línea de Tiempo",
      icon: "history",
      submitLabel: "Insertar timeline",
      fields: [
        { name: "title", label: "Título del Timeline", placeholder: "Ej. Evolución Histórica", required: true },
        {
          name: "layout",
          label: "Diseño del Timeline",
          type: "select",
          value: "linear",
          options: [
            { value: "linear", label: "Lineal (Izquierda a Derecha)" },
            { value: "alternating", label: "Alterno (Izquierda y Derecha)" }
          ]
        },
        { name: "events", label: "Hitos y Eventos", type: "timeline-events", items: [{ date: "", label: "", desc: "" }] }
      ]
    });
    if (!data) return false;

    const events = data.events || [];
    if (!events.length) return false;

    return insertRichBlock(blockShell({
      type: "timeline",
      icon: "history",
      title: "Línea de Tiempo",
      meta: `${events.length} hitos | ${data.title.trim()}`,
      accent: "#ec4899",
      editable: false,
      data: {
        timelineTitle: data.title.trim(),
        timelineLayout: data.layout,
        timelineEvents: JSON.stringify(events)
      },
      body: renderTimelineHtml(data.title.trim(), data.layout, events)
    }));
  }
};

function renderTimelineHtml(title, layout, events) {
  return `
    <div class="rich-timeline-card" data-layout="${escapeHTML(layout)}" contenteditable="false">
      <div class="rich-timeline-header">
        <h4 class="rich-timeline-title">${escapeHTML(title)}</h4>
      </div>
      <div class="rich-timeline-container rich-timeline-${escapeHTML(layout)}">
        <div class="rich-timeline-line"></div>
        ${events.map((event, index) => {
          const isEven = index % 2 === 0;
          return `
            <div class="rich-timeline-item ${isEven ? "rich-timeline-item-even" : "rich-timeline-item-odd"}">
              <div class="rich-timeline-dot-container">
                <div class="rich-timeline-dot"></div>
              </div>
              <div class="rich-timeline-content-wrap">
                <span class="rich-timeline-date">${escapeHTML(event.date)}</span>
                <strong class="rich-timeline-label">${escapeHTML(event.label)}</strong>
                ${event.desc ? `<p class="rich-timeline-desc">${escapeHTML(event.desc)}</p>` : ""}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

registerBlockEditor("timeline", async (block) => {
  if (!block) return false;
  const currentTitle = block.dataset.timelineTitle || "";
  const currentLayout = block.dataset.timelineLayout || "linear";
  let currentEvents = [];
  try {
    currentEvents = JSON.parse(block.dataset.timelineEvents || "[]");
  } catch (e) {}

  const data = await openBlockModal({
    title: "Editar Línea de Tiempo",
    icon: "history",
    submitLabel: "Guardar cambios",
    fields: [
      { name: "title", label: "Título del Timeline", placeholder: "Ej. Evolución Histórica", value: currentTitle, required: true },
      {
        name: "layout",
        label: "Diseño del Timeline",
        type: "select",
        value: currentLayout,
        options: [
          { value: "linear", label: "Lineal (Izquierda a Derecha)" },
          { value: "alternating", label: "Alterno (Izquierda y Derecha)" }
        ]
      },
      { name: "events", label: "Hitos y Eventos", type: "timeline-events", items: currentEvents }
    ]
  });
  if (!data) return false;

  const events = data.events || [];
  if (!events.length) return false;

  block.dataset.timelineTitle = data.title.trim();
  block.dataset.timelineLayout = data.layout;
  block.dataset.timelineEvents = JSON.stringify(events);

  const metaEl = block.querySelector(".rich-block-heading small");
  if (metaEl) metaEl.textContent = `${events.length} hitos | ${data.title.trim()}`;

  const bodyEl = block.querySelector(".rich-block-body");
  if (bodyEl) {
    bodyEl.innerHTML = renderTimelineHtml(data.title.trim(), data.layout, events);
  }
  return true;
});
