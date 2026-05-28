import { escapeHTML, refreshIcons, showModal, showToast } from "../utils.js";
import { getEditor, insertHtmlAtCursor } from "./editor-dom.js";
import { initVoiceNotePlayers, buildVoiceNoteHtml } from "./voice-note.js";
import { recordAudioFromMic } from "./voice-recorder.js";
import {
  CATEGORY_MAP,
  RECOMMENDED_IDS,
  baseTemplate,
  ensureWrappedBlock,
  isValidHttpUrl,
  makeListBlock,
  sanitizeDurationSec,
  wrapBlock,
} from "./shared.js";

const BLOCKS = [
  {
    id: "reminder",
    name: "Recordatorio",
    category: "recommended",
    description: "Recordatorio con fecha.",
    icon: "alarm-clock",
    template: () =>
      wrapBlock(
        "reminder",
        `<div class="insert-block-meta"><strong>Recordatorio:</strong> ${new Date().toLocaleDateString("es-MX")}</div><p>Tarea pendiente...</p>`,
      ),
  },
  {
    id: "current-date",
    name: "Fecha actual",
    category: "recommended",
    description: "Inserta la fecha de hoy.",
    icon: "calendar-days",
    template: () =>
      wrapBlock(
        "current-date",
        `<div class="insert-block-meta">${new Date().toLocaleDateString("es-MX", { dateStyle: "full" })}</div>`,
      ),
  },
  {
    id: "current-time",
    name: "Hora actual",
    category: "recommended",
    description: "Inserta la hora actual.",
    icon: "clock-3",
    template: () =>
      wrapBlock(
        "current-time",
        `<div class="insert-block-meta">${new Date().toLocaleTimeString("es-MX")}</div>`,
      ),
  },
  {
    id: "link",
    name: "Enlace",
    category: "recommended",
    description: "Enlace con validación.",
    icon: "link",
    insert: async () => {
      const url = await showModal("URL del enlace", "https://ejemplo.com", "https://");
      if (!url) return false;
      if (!isValidHttpUrl(url)) return showToast("Enlace inválido. Usa http(s).", "error");
      const label = await showModal("Texto del enlace", "Texto visible", url);
      return insertHtmlAtCursor(
        wrapBlock(
          "link",
          `<a href="${escapeHTML(url)}" target="_blank">${escapeHTML((label || url).trim())}</a>`,
        ),
      );
    },
  },
  {
    id: "image",
    name: "Imagen",
    category: "recommended",
    description: "Inserta imagen por URL.",
    icon: "image",
    template: () =>
      `<img src="https://picsum.photos/900/500" alt="Imagen insertada" class="max-w-full h-auto rounded-2xl shadow-lg my-4 border border-outline-variant/20"><p><br></p>`,
  },
  {
    id: "table-3x3",
    name: "Tabla",
    category: "recommended",
    description: "Comparación rápida.",
    icon: "table-2",
    template: () =>
      `<table><thead><tr><th style="text-align: center;">Encabezado 1</th><th style="text-align: center;">Encabezado 2</th><th style="text-align: center;">Encabezado 3</th></tr></thead><tbody><tr><td>Dato 1</td><td>Dato 2</td><td>Dato 3</td></tr><tr><td>Dato 4</td><td>Dato 5</td><td>Dato 6</td></tr></tbody></table><p><br></p>`,
  },
  {
    id: "check-list",
    name: "Checklist",
    category: "recommended",
    description: "Tareas pendientes.",
    icon: "list-checks",
    template: () =>
      `<ul class="editor-check-list"><li><input type="checkbox"> Tarea 1</li><li><input type="checkbox"> Tarea 2</li></ul><p><br></p>`,
  },
  {
    id: "callout",
    name: "Tip / Callout",
    category: "recommended",
    description: "Aviso visual.",
    icon: "lightbulb",
    template: () =>
      `<div class="insert-callout" style="border-left:4px solid #6366f1;padding:.5rem .75rem;background:rgba(99,102,241,.08);border-radius:.4rem;display:flex;align-items:center;gap:.5rem;"><span class="insert-callout-icon-wrap" contenteditable="false"><i data-lucide="lightbulb" class="insert-callout-icon" aria-hidden="true"></i></span><div><strong class="insert-callout-label" contenteditable="false">TIP:</strong> <span class="insert-callout-placeholder" data-callout-placeholder="true">Escribe aquí una nota destacada.</span></div></div><p><br></p>`,
  },
  { id: "h2", name: "Título H2", category: "structure", description: "Sección principal.", icon: "heading-2", template: () => `<h2>Título de Sección</h2><p><br></p>` },
  { id: "h3", name: "Título H3", category: "structure", description: "Subsección.", icon: "heading-3", template: () => `<h3>Subsección</h3><p><br></p>` },
  { id: "divider", name: "Separador", category: "structure", description: "Línea horizontal.", icon: "minus", template: () => `<hr><p><br></p>` },
  {
    id: "collapsible-section",
    name: "Sección plegable",
    category: "structure",
    description: "Abrir/cerrar contenido.",
    icon: "chevrons-up-down",
    template: () => `<details><summary>Sección plegable</summary><p>Contenido ocultable...</p></details><p><br></p>`,
  },
  {
    id: "columns-2",
    name: "Columnas 2",
    category: "structure",
    description: "Layout en 2 columnas.",
    icon: "columns-2",
    template: () =>
      wrapBlock(
        "columns-2",
        `<div class="insert-columns insert-columns-2"><div><h4>Columna 1</h4><p>Contenido...</p></div><div><h4>Columna 2</h4><p>Contenido...</p></div></div>`,
      ),
  },
  {
    id: "metadata",
    name: "Metadatos",
    category: "structure",
    description: "Info técnica.",
    icon: "database",
    template: () =>
      wrapBlock(
        "metadata",
        `<div class="insert-block-meta">Creado: ${new Date().toLocaleString("es-MX")} | Autor: Usuario</div>`,
      ),
  },
  { id: "bullet-list", name: "Lista con viñetas", category: "lists", description: "Puntos rápidos.", icon: "list", template: () => `<ul><li>Punto 1</li><li>Punto 2</li><li>Punto 3</li></ul><p><br></p>` },
  { id: "number-list", name: "Lista numerada", category: "lists", description: "Pasos o ranking.", icon: "list-ordered", template: () => `<ol><li>Paso 1</li><li>Paso 2</li><li>Paso 3</li></ol><p><br></p>` },
  { id: "priority-list", name: "Lista de prioridades", category: "lists", description: "Orden de prioridad.", icon: "arrow-up-wide-narrow", template: () => makeListBlock("Prioridades", ["Alta", "Media", "Baja"]) },
  { id: "shopping-list", name: "Lista de compras", category: "lists", description: "Compras pendientes.", icon: "shopping-cart", template: () => makeListBlock("Compras", ["Producto 1", "Producto 2"]) },
  { id: "reading-list", name: "Lista de lectura", category: "lists", description: "Lecturas pendientes.", icon: "book-open", template: () => makeListBlock("Lecturas", ["Artículo 1", "Libro 1"]) },
  {
    id: "due-list",
    name: "Pendientes por fecha",
    category: "lists",
    description: "Tareas por fecha.",
    icon: "calendar-range",
    template: () => makeListBlock("Pendientes por fecha", [`${new Date().toLocaleDateString("es-MX")} - Tarea`]),
  },
  { id: "blockquote", name: "Cita", category: "blocks", description: "Bloque destacado.", icon: "quote", template: () => `<blockquote>Cita o referencia importante...</blockquote><p><br></p>` },
  { id: "code-block", name: "Bloque de código", category: "blocks", description: "Código con fondo.", icon: "code-2", template: () => `<pre><code>// Escribe tu código aquí</code></pre><p><br></p>` },
  {
    id: "gallery",
    name: "Galería",
    category: "blocks",
    description: "Galería de imágenes.",
    icon: "images",
    template: () =>
      wrapBlock(
        "gallery",
        `<div class="insert-columns insert-columns-3"><div class="insert-block-card">Imagen 1</div><div class="insert-block-card">Imagen 2</div><div class="insert-block-card">Imagen 3</div></div>`,
      ),
  },
  { id: "video", name: "Video", category: "blocks", description: "Video por enlace.", icon: "video", template: () => wrapBlock("video", `<div class="insert-block-card"><strong>Video:</strong> <a href="https://ejemplo.com/video" target="_blank">Abrir video</a></div>`) },
  { id: "pdf", name: "PDF", category: "blocks", description: "PDF por enlace.", icon: "file-text", template: () => wrapBlock("pdf", `<div class="insert-block-card"><strong>PDF:</strong> <a href="https://ejemplo.com/archivo.pdf" target="_blank">Abrir PDF</a></div>`) },
  { id: "timeline", name: "Timeline", category: "blocks", description: "Línea de tiempo.", icon: "history", template: () => wrapBlock("timeline", `<ol><li>Hito 1</li><li>Hito 2</li></ol>`) },
  { id: "formula", name: "Bloque de fórmula", category: "blocks", description: "Fórmulas.", icon: "sigma", template: () => wrapBlock("formula", `<pre><code>E = mc^2</code></pre>`) },
  { id: "contact-block", name: "Bloque de contacto", category: "blocks", description: "Datos de contacto.", icon: "contact", template: () => wrapBlock("contact-block", `<div class="insert-block-card"><strong>Nombre:</strong> ...<br><strong>Email:</strong> ...</div>`) },
  { id: "reference-block", name: "Bloque de referencia", category: "blocks", description: "Referencia externa.", icon: "book-marked", template: () => wrapBlock("reference-block", `<div class="insert-block-card"><strong>Referencia:</strong> Fuente / enlace</div>`) },
  {
    id: "voice-recorder",
    name: "Grabadora de voz",
    category: "blocks",
    description: "Graba audio con micrófono.",
    icon: "mic",
    insert: async () => {
      const recorded = await recordAudioFromMic();
      if (!recorded) return false;
      if (!recorded.success || !recorded.fileName) {
        showToast("No se pudo guardar el audio grabado.", "error");
        return false;
      }
      const inserted = insertHtmlAtCursor(
        buildVoiceNoteHtml(recorded.meta || {
          id: recorded.id,
          fileName: recorded.fileName,
          mime: recorded.mimeType,
          durationSec: recorded.durationSec,
          startedAt: Date.now() - sanitizeDurationSec(recorded.durationSec) * 1000,
          endedAt: Date.now(),
          status: "ready",
        }),
      );
      if (inserted) {
        const editor = getEditor();
        if (editor) initVoiceNotePlayers(editor);
      }
      return inserted;
    },
  },
];

export function renderInsertBlocks() {
  const panels = {
    recommended: document.querySelector('[data-insert-panel="recommended"]'),
    structure: document.querySelector('[data-insert-panel="structure"]'),
    lists: document.querySelector('[data-insert-panel="lists"]'),
    blocks: document.querySelector('[data-insert-panel="blocks"]'),
  };
  Object.values(panels).forEach((panel) => {
    if (panel) panel.innerHTML = "";
  });

  BLOCKS.forEach((block) => {
    const panel = panels[block.category];
    if (!panel) return;
    if (block.category === "recommended" && !RECOMMENDED_IDS.includes(block.id)) return;

    const btn = document.createElement("button");
    btn.className = "insert-card";
    btn.setAttribute("data-insert-action", block.id);
    btn.innerHTML = `
            <i data-lucide="${block.icon}" class="w-5 h-5 text-primary"></i>
            <div>
                <div class="font-bold">${escapeHTML(block.name)}</div>
                <div class="text-xs text-on-surface-variant">${escapeHTML(block.description || CATEGORY_MAP[block.category])}</div>
            </div>
        `;
    panel.appendChild(btn);
  });
  refreshIcons();
}

export async function insertBlockById(id) {
  const block = BLOCKS.find((candidate) => candidate.id === id);
  if (!block) return false;
  if (typeof block.insert === "function") return !!(await block.insert());
  const rawTemplate = block.template ? block.template() : baseTemplate(block.name, block.description);
  return insertHtmlAtCursor(ensureWrappedBlock(block.id, rawTemplate));
}

export function hasInsertBlock(id) {
  return BLOCKS.some((block) => block.id === id);
}

export function getInsertBlockSummary() {
  return BLOCKS.map(({ id, name, category }) => ({ id, name, category }));
}
