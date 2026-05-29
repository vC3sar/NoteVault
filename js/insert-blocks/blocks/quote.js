import { escapeHTML } from "../../utils.js";
import { openBlockModal } from "../modal.js";
import { blockShell, insertRichBlock } from "../block-renderer.js";
import { registerBlockEditor } from "../block-editors.js";

export const quoteBlock = {
  id: "quote",
  name: "Cita",
  category: "blocks",
  description: "Bloque de cita destacado.",
  icon: "quote",
  async insert() {
    const data = await openBlockModal({
      title: "Insertar Cita",
      icon: "quote",
      submitLabel: "Insertar cita",
      fields: [
        { name: "text", label: "Texto de la cita", type: "textarea", placeholder: "Escribe la cita aquí...", required: true },
        { name: "author", label: "Autor", placeholder: "Ej. Albert Einstein", required: true },
        { name: "source", label: "Fuente / Libro / Origen (Opcional)", placeholder: "Ej. Teoría de la Relatividad" }
      ]
    });
    if (!data) return false;

    return insertRichBlock(blockShell({
      type: "quote",
      icon: "quote",
      title: "Cita",
      meta: data.author.trim(),
      accent: "#4f46e5",
      editable: false,
      data: {
        quoteText: data.text.trim(),
        quoteAuthor: data.author.trim(),
        quoteSource: (data.source || "").trim()
      },
      body: renderQuoteHtml(data.text.trim(), data.author.trim(), (data.source || "").trim())
    }));
  }
};

function renderQuoteHtml(text, author, source) {
  return `
    <div class="rich-quote-card">
      <span class="rich-quote-mark" contenteditable="false">“</span>
      <blockquote class="rich-quote-text">${escapeHTML(text)}</blockquote>
      <div class="rich-quote-attribution" contenteditable="false">
        <span class="rich-quote-author">— ${escapeHTML(author)}</span>
        ${source ? `<cite class="rich-quote-source">${escapeHTML(source)}</cite>` : ""}
      </div>
    </div>
  `;
}

registerBlockEditor("quote", async (block) => {
  if (!block) return false;
  const currentText = block.dataset.quoteText || "";
  const currentAuthor = block.dataset.quoteAuthor || "";
  const currentSource = block.dataset.quoteSource || "";

  const data = await openBlockModal({
    title: "Editar Cita",
    icon: "quote",
    submitLabel: "Guardar cambios",
    fields: [
      { name: "text", label: "Texto de la cita", type: "textarea", placeholder: "Escribe la cita aquí...", value: currentText, required: true },
      { name: "author", label: "Autor", placeholder: "Ej. Albert Einstein", value: currentAuthor, required: true },
      { name: "source", label: "Fuente / Libro (Opcional)", placeholder: "Ej. Teoría de la Relatividad", value: currentSource }
    ]
  });
  if (!data) return false;

  block.dataset.quoteText = data.text.trim();
  block.dataset.quoteAuthor = data.author.trim();
  block.dataset.quoteSource = (data.source || "").trim();

  const metaEl = block.querySelector(".rich-block-heading small");
  if (metaEl) metaEl.textContent = data.author.trim();

  const bodyEl = block.querySelector(".rich-block-body");
  if (bodyEl) {
    bodyEl.innerHTML = renderQuoteHtml(data.text.trim(), data.author.trim(), (data.source || "").trim());
  }
  return true;
});
