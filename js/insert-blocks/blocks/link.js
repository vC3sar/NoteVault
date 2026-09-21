import { escapeHTML, showToast } from "../../utils.js";
import { openBlockModal } from "../modal.js";
import { blockShell, insertRichBlock } from "../block-renderer.js";
import { registerBlockEditor } from "../block-editors.js";
import { isValidHttpUrl } from "../shared.js";

function getFavicon(url) {
  const parsed = new URL(url);
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(parsed.hostname)}&sz=64`;
}

export const linkBlock = {
  id: "link",
  name: "Enlace",
  category: "recommended",
  description: "Enlace con validacion.",
  icon: "link",
  async insert() {
    const data = await openBlockModal({
      title: "Enlace",
      icon: "link",
      submitLabel: "Insertar enlace",
      fields: [
        { name: "url", label: "URL", type: "url", placeholder: "https://ejemplo.com", required: true },
        { name: "label", label: "Titulo visible", placeholder: "Nombre del recurso" },
        { name: "description", label: "Descripcion", type: "textarea", placeholder: "Resumen opcional", rows: 3 },
      ],
    });
    if (!data) return false;
    const url = data.url.trim();
    if (!isValidHttpUrl(url)) {
      showToast("Enlace invalido. Usa http(s).", "error");
      return false;
    }

    const parsed = new URL(url);
    const title = data.label?.trim() || parsed.hostname;
    const description = data.description?.trim() || "Abrir enlace";

    return insertRichBlock(blockShell({
      type: "link",
      icon: "link",
      title: escapeHTML(title),
      meta: escapeHTML(parsed.hostname),
      accent: "#2563eb",
      editable: false,
      body: `
        <a class="rich-link-preview" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">
          <img src="${escapeHTML(getFavicon(url))}" alt="" loading="lazy" contenteditable="false">
          <span>
            <strong>${escapeHTML(title)}</strong>
            <small>${escapeHTML(url)}</small>
            <em>${escapeHTML(description)}</em>
          </span>
        </a>
      `,
    }));
  },
};

registerBlockEditor("link", async (block) => {
  if (!block) return false;
  const link = block.querySelector(".rich-link-preview");
  const currentUrl = link?.getAttribute("href") || "";
  const titleEl = block.querySelector(".rich-link-preview strong");
  const currentLabel = titleEl?.textContent?.trim() || "";
  const descEl = block.querySelector(".rich-link-preview em");
  const currentDescription = descEl?.textContent?.trim() || "";

  const data = await openBlockModal({
    title: "Editar Enlace",
    icon: "link",
    submitLabel: "Guardar cambios",
    fields: [
      { name: "url", label: "URL", type: "url", placeholder: "https://ejemplo.com", value: currentUrl, required: true },
      { name: "label", label: "Titulo visible", placeholder: "Nombre del recurso", value: currentLabel },
      { name: "description", label: "Descripcion", type: "textarea", placeholder: "Resumen opcional", rows: 3, value: currentDescription },
    ],
  });
  if (!data) return false;
  
  const url = data.url.trim();
  if (!isValidHttpUrl(url)) {
    showToast("Enlace invalido. Usa http(s).", "error");
    return false;
  }

  const parsed = new URL(url);
  const title = data.label?.trim() || parsed.hostname;
  const description = data.description?.trim() || "Abrir enlace";

  const metaEl = block.querySelector(".rich-block-heading small");
  if (metaEl) metaEl.textContent = parsed.hostname;
  
  const titleH = block.querySelector(".rich-block-heading strong");
  if (titleH) titleH.textContent = title;

  const bodyEl = block.querySelector(".rich-block-body");
  if (bodyEl) {
    bodyEl.innerHTML = `
      <a class="rich-link-preview" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">
        <img src="${escapeHTML(getFavicon(url))}" alt="" loading="lazy" contenteditable="false">
        <span>
          <strong>${escapeHTML(title)}</strong>
          <small>${escapeHTML(url)}</small>
          <em>${escapeHTML(description)}</em>
        </span>
      </a>
    `;
  }
  return true;
});

