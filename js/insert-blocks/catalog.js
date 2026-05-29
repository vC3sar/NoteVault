import { escapeHTML, refreshIcons, showToast } from "../utils.js";
import { getEditor, insertHtmlAtCursor } from "./editor-dom.js";
import { initVoiceNotePlayers, buildVoiceNoteHtml } from "./voice-note.js";
import { recordAudioFromMic } from "./voice-recorder.js";
import { initRichBlocks } from "./block-renderer.js";
import { reminderBlock } from "./blocks/reminder.js";
import { currentDateBlock, currentTimeBlock } from "./blocks/date-time.js";
import { linkBlock } from "./blocks/link.js";
import { imageBlock } from "./blocks/image.js";
import { tableBlock } from "./blocks/table.js";
import { checklistBlock } from "./blocks/checklist.js";
import { quoteBlock } from "./blocks/quote.js";
import { pdfBlock } from "./blocks/pdf.js";
import { contactBlock } from "./blocks/contact.js";
import { referenceBlock } from "./blocks/reference.js";
import { videoBlock } from "./blocks/video.js";
import { formulaBlock } from "./blocks/formula.js";
import { galleryBlock } from "./blocks/gallery.js";
import { timelineBlock } from "./blocks/timeline.js";
import {
  CATEGORY_MAP,
  RECOMMENDED_IDS,
  baseTemplate,
  ensureWrappedBlock,
  makeListBlock,
  sanitizeDurationSec,
  wrapBlock,
} from "./shared.js";

const BLOCKS = [
  reminderBlock,
  currentDateBlock,
  currentTimeBlock,
  linkBlock,
  imageBlock,
  tableBlock,
  checklistBlock,
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

  quoteBlock,
  { id: "code-block", name: "Bloque de código", category: "blocks", description: "Código con fondo.", icon: "code-2", template: () => `<pre><code>// Escribe tu código aquí</code></pre><p><br></p>` },
  galleryBlock,
  videoBlock,
  pdfBlock,
  timelineBlock,
  formulaBlock,
  contactBlock,
  referenceBlock,
  {
    id: "voice-recorder",
    name: "Nota de voz",
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
  initRichBlocks(document);
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
