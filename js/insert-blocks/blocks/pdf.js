import { escapeHTML } from "../../utils.js";
import { openBlockModal } from "../modal.js";
import { blockShell, insertRichBlock } from "../block-renderer.js";
import { registerBlockEditor } from "../block-editors.js";

export const pdfBlock = {
  id: "pdf",
  name: "Documento PDF",
  category: "blocks",
  description: "PDF por enlace o incrustado.",
  icon: "file-text",
  async insert() {
    const data = await openBlockModal({
      title: "Insertar PDF",
      icon: "file-text",
      submitLabel: "Insertar PDF",
      fields: [
        { name: "url", label: "Enlace del PDF (URL)", placeholder: "Ej. https://ejemplo.com/archivo.pdf", required: true },
        { name: "title", label: "Título del documento", placeholder: "Ej. Guía de estudio", required: true },
        { name: "desc", label: "Descripción / Notas", placeholder: "Ej. Lectura obligatoria para la unidad 1" },
        {
          name: "mode",
          label: "Método de visualización",
          type: "select",
          value: "card",
          options: [
            { value: "card", label: "Tarjeta de enlace" },
            { value: "embed", label: "Visor interactivo (Iframe)" }
          ]
        }
      ]
    });
    if (!data) return false;

    return insertRichBlock(blockShell({
      type: "pdf",
      icon: "file-text",
      title: "PDF",
      meta: data.title.trim(),
      accent: "#ef4444",
      editable: false,
      data: {
        pdfUrl: data.url.trim(),
        pdfTitle: data.title.trim(),
        pdfDesc: (data.desc || "").trim(),
        pdfMode: data.mode
      },
      body: renderPdfHtml(data.url.trim(), data.title.trim(), (data.desc || "").trim(), data.mode)
    }));
  }
};

function renderPdfHtml(url, title, desc, mode) {
  const isEmbed = mode === "embed";
  return `
    <div class="rich-pdf-card" data-mode="${escapeHTML(mode)}">
      <div class="rich-pdf-info" contenteditable="false">
        <span class="rich-pdf-icon"><i data-lucide="file-text" class="w-6 h-6"></i></span>
        <div class="rich-pdf-details">
          <strong class="rich-pdf-title">${escapeHTML(title)}</strong>
          ${desc ? `<p class="rich-pdf-desc">${escapeHTML(desc)}</p>` : ""}
        </div>
        <a href="${escapeHTML(url)}" target="_blank" class="rich-pdf-btn block-modal-primary" rel="noopener noreferrer">
          <i data-lucide="external-link" class="w-4 h-4"></i> Abrir PDF
        </a>
      </div>
      ${isEmbed ? `
        <div class="rich-pdf-embed-wrapper" contenteditable="false">
          <iframe class="rich-pdf-iframe" src="${escapeHTML(url)}#toolbar=0" type="application/pdf" width="100%" height="450px"></iframe>
        </div>
      ` : ""}
    </div>
  `;
}

registerBlockEditor("pdf", async (block) => {
  if (!block) return false;
  const currentUrl = block.dataset.pdfUrl || "";
  const currentTitle = block.dataset.pdfTitle || "";
  const currentDesc = block.dataset.pdfDesc || "";
  const currentMode = block.dataset.pdfMode || "card";

  const data = await openBlockModal({
    title: "Editar PDF",
    icon: "file-text",
    submitLabel: "Guardar cambios",
    fields: [
      { name: "url", label: "Enlace del PDF (URL)", placeholder: "Ej. https://ejemplo.com/archivo.pdf", value: currentUrl, required: true },
      { name: "title", label: "Título del documento", placeholder: "Ej. Guía de estudio", value: currentTitle, required: true },
      { name: "desc", label: "Descripción / Notas", placeholder: "Ej. Lectura obligatoria", value: currentDesc },
      {
        name: "mode",
        label: "Método de visualización",
        type: "select",
        value: currentMode,
        options: [
          { value: "card", label: "Tarjeta de enlace" },
          { value: "embed", label: "Visor interactivo (Iframe)" }
        ]
      }
    ]
  });
  if (!data) return false;

  block.dataset.pdfUrl = data.url.trim();
  block.dataset.pdfTitle = data.title.trim();
  block.dataset.pdfDesc = (data.desc || "").trim();
  block.dataset.pdfMode = data.mode;

  const metaEl = block.querySelector(".rich-block-heading small");
  if (metaEl) metaEl.textContent = data.title.trim();

  const bodyEl = block.querySelector(".rich-block-body");
  if (bodyEl) {
    bodyEl.innerHTML = renderPdfHtml(data.url.trim(), data.title.trim(), (data.desc || "").trim(), data.mode);
  }
  return true;
});
