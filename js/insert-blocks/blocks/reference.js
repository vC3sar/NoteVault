import { escapeHTML } from "../../utils.js";
import { openBlockModal } from "../modal.js";
import { blockShell, insertRichBlock } from "../block-renderer.js";
import { registerBlockEditor } from "../block-editors.js";

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-copy-citation]");
  if (btn) {
    e.preventDefault();
    e.stopPropagation();
    const citation = btn.getAttribute("data-copy-citation");
    navigator.clipboard.writeText(citation).then(() => {
      import("../../utils.js").then((m) => m.showToast("Cita copiada al portapapeles", "success"));
    });
  }
});

export const referenceBlock = {
  id: "reference-block",
  name: "Referencia",
  category: "blocks",
  description: "Referencia bibliográfica.",
  icon: "book-marked",
  async insert() {
    const data = await openBlockModal({
      title: "Insertar Referencia",
      icon: "book-marked",
      submitLabel: "Insertar referencia",
      fields: [
        { name: "title", label: "Título del artículo/libro", placeholder: "Ej. Delirium and cognitive decline", required: true },
        { name: "authors", label: "Autor(es)", placeholder: "Ej. Inouye, S. K., Westendorp, R. G.", required: true },
        { name: "source", label: "Revista / Diario / Editorial", placeholder: "Ej. JAMA Neurology", required: true },
        { name: "year", label: "Año de publicación", placeholder: "Ej. 2014", required: true },
        { name: "url", label: "URL (Opcional)", placeholder: "Ej. https://doi.org/10.1001/jamaneurol" },
        { name: "notes", label: "Notas (Opcional)", type: "textarea", placeholder: "Ej. Relevante para el capítulo 3" }
      ]
    });
    if (!data) return false;

    const citationText = `${data.authors.trim()} (${data.year.trim()}). ${data.title.trim()}. ${data.source.trim()}.`;

    return insertRichBlock(blockShell({
      type: "reference",
      icon: "book-marked",
      title: "Referencia",
      meta: data.title.trim(),
      accent: "#10b981",
      editable: false,
      data: {
        refTitle: data.title.trim(),
        refAuthors: data.authors.trim(),
        refSource: data.source.trim(),
        refYear: data.year.trim(),
        refUrl: (data.url || "").trim(),
        refNotes: (data.notes || "").trim()
      },
      body: renderReferenceHtml(
        data.title.trim(),
        data.authors.trim(),
        data.source.trim(),
        data.year.trim(),
        (data.url || "").trim(),
        (data.notes || "").trim(),
        citationText
      )
    }));
  }
};

function renderReferenceHtml(title, authors, source, year, url, notes, citation) {
  return `
    <div class="rich-reference-card" contenteditable="false">
      <div class="rich-reference-citation">
        <span class="rich-reference-authors">${escapeHTML(authors)}</span> 
        <span class="rich-reference-year">(${escapeHTML(year)}).</span> 
        <span class="rich-reference-title">“${escapeHTML(title)}”</span>. 
        <em class="rich-reference-source">${escapeHTML(source)}</em>.
      </div>
      
      ${notes ? `<p class="rich-reference-notes">${escapeHTML(notes)}</p>` : ""}

      <div class="rich-reference-actions">
        ${url ? `
          <a href="${escapeHTML(url)}" target="_blank" class="rich-reference-btn block-modal-primary" rel="noopener noreferrer">
            <i data-lucide="external-link" class="w-3.5 h-3.5"></i> Visitar Enlace
          </a>
        ` : ""}
        <button type="button" class="rich-reference-btn block-modal-secondary" data-copy-citation="${escapeHTML(citation)}">
          <i data-lucide="copy" class="w-3.5 h-3.5"></i> Copiar Cita APA
        </button>
      </div>
    </div>
  `;
}

registerBlockEditor("reference", async (block) => {
  if (!block) return false;
  const currentTitle = block.dataset.refTitle || "";
  const currentAuthors = block.dataset.refAuthors || "";
  const currentSource = block.dataset.refSource || "";
  const currentYear = block.dataset.refYear || "";
  const currentUrl = block.dataset.refUrl || "";
  const currentNotes = block.dataset.refNotes || "";

  const data = await openBlockModal({
    title: "Editar Referencia",
    icon: "book-marked",
    submitLabel: "Guardar cambios",
    fields: [
      { name: "title", label: "Título del artículo/libro", placeholder: "Ej. Delirium and cognitive decline", value: currentTitle, required: true },
      { name: "authors", label: "Autor(es)", placeholder: "Ej. Inouye, S. K.", value: currentAuthors, required: true },
      { name: "source", label: "Revista / Diario / Editorial", placeholder: "Ej. JAMA Neurology", value: currentSource, required: true },
      { name: "year", label: "Año de publicación", placeholder: "Ej. 2014", value: currentYear, required: true },
      { name: "url", label: "URL (Opcional)", placeholder: "Ej. https://doi.org...", value: currentUrl },
      { name: "notes", label: "Notas (Opcional)", type: "textarea", placeholder: "Ej. Relevante...", value: currentNotes }
    ]
  });
  if (!data) return false;

  const citationText = `${data.authors.trim()} (${data.year.trim()}). ${data.title.trim()}. ${data.source.trim()}.`;

  block.dataset.refTitle = data.title.trim();
  block.dataset.refAuthors = data.authors.trim();
  block.dataset.refSource = data.source.trim();
  block.dataset.refYear = data.year.trim();
  block.dataset.refUrl = (data.url || "").trim();
  block.dataset.refNotes = (data.notes || "").trim();

  const metaEl = block.querySelector(".rich-block-heading small");
  if (metaEl) metaEl.textContent = data.title.trim();

  const bodyEl = block.querySelector(".rich-block-body");
  if (bodyEl) {
    bodyEl.innerHTML = renderReferenceHtml(
      data.title.trim(),
      data.authors.trim(),
      data.source.trim(),
      data.year.trim(),
      (data.url || "").trim(),
      (data.notes || "").trim(),
      citationText
    );
  }
  return true;
});
