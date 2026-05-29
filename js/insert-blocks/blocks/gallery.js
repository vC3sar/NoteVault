import { escapeHTML } from "../../utils.js";
import { openBlockModal } from "../modal.js";
import { blockShell, insertRichBlock } from "../block-renderer.js";
import { registerBlockEditor } from "../block-editors.js";

document.addEventListener("click", (e) => {
  const img = e.target.closest(".rich-gallery-img");
  if (img) {
    e.preventDefault();
    e.stopPropagation();
    const lightbox = document.createElement("div");
    lightbox.className = "rich-gallery-lightbox";
    lightbox.innerHTML = `
      <div class="rich-gallery-lightbox-content">
        <img src="${escapeHTML(img.src)}" alt="Imagen ampliada">
        <button type="button" class="rich-gallery-lightbox-close"><i data-lucide="x" class="w-6 h-6"></i></button>
      </div>
    `;
    document.body.appendChild(lightbox);
    import("../../utils.js").then((m) => m.refreshIcons());

    const close = () => lightbox.remove();
    lightbox.addEventListener("click", close);
    lightbox.querySelector(".rich-gallery-lightbox-close").addEventListener("click", close);
  }
});

export const galleryBlock = {
  id: "gallery",
  name: "Galería de imágenes",
  category: "blocks",
  description: "Mosaico o cuadrícula de imágenes.",
  icon: "images",
  async insert() {
    const data = await openBlockModal({
      title: "Insertar Galería",
      icon: "images",
      submitLabel: "Insertar galería",
      fields: [
        { name: "title", label: "Título de la Galería", placeholder: "Ej. Fotos del campus", required: true },
        {
          name: "layout",
          label: "Diseño de cuadrícula",
          type: "select",
          value: "grid-3",
          options: [
            { value: "grid-2", label: "2 Columnas" },
            { value: "grid-3", label: "3 Columnas" },
            { value: "grid-4", label: "4 Columnas" },
            { value: "masonry", label: "Mosaico (Masonry)" }
          ]
        },
        {
          name: "fit",
          label: "Ajuste de imagen",
          type: "select",
          value: "cover-adaptable",
          options: [
            { value: "cover-adaptable", label: "Cubrir espacio adaptable" },
            { value: "contain", label: "Mostrar completa (sin recorte)" }
          ]
        },
        { name: "urls", label: "URLs de Imágenes", type: "items", items: [""], placeholder: "https://ejemplo.com/imagen.jpg" }
      ]
    });
    if (!data) return false;

    const urls = data.urls.filter(Boolean);
    if (!urls.length) return false;

    return insertRichBlock(blockShell({
      type: "gallery",
      icon: "images",
      title: "Galería",
      meta: `${urls.length} imágenes | ${data.title.trim()}`,
      accent: "#f59e0b",
      editable: false,
      data: {
        galleryTitle: data.title.trim(),
        galleryLayout: data.layout,
        galleryFit: data.fit || "cover-adaptable",
        galleryUrls: JSON.stringify(urls)
      },
      body: renderGalleryHtml(data.title.trim(), data.layout, data.fit || "cover-adaptable", urls)
    }));
  }
};

function renderGalleryHtml(title, layout, fit, urls) {
  const fitClass = fit === "contain" ? "rich-gallery-fit-contain" : "rich-gallery-fit-cover-adaptable";
  return `
    <div class="rich-gallery-card" data-layout="${escapeHTML(layout)}" data-fit="${escapeHTML(fit)}" contenteditable="false">
      <div class="rich-gallery-header">
        <h4 class="rich-gallery-title">${escapeHTML(title)}</h4>
      </div>
      <div class="rich-gallery-grid rich-gallery-${escapeHTML(layout)} ${fitClass}">
        ${urls.map((url, i) => `
          <div class="rich-gallery-item">
            <img class="rich-gallery-img" src="${escapeHTML(url)}" alt="Imagen ${i + 1} de la galería">
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

registerBlockEditor("gallery", async (block) => {
  if (!block) return false;
  const currentTitle = block.dataset.galleryTitle || "";
  const currentLayout = block.dataset.galleryLayout || "grid-3";
  const currentFit = block.dataset.galleryFit || "cover-adaptable";
  let currentUrls = [];
  try {
    currentUrls = JSON.parse(block.dataset.galleryUrls || "[]");
  } catch (e) {}

  const data = await openBlockModal({
    title: "Editar Galería",
    icon: "images",
    submitLabel: "Guardar cambios",
    fields: [
      { name: "title", label: "Título de la Galería", placeholder: "Ej. Fotos del campus", value: currentTitle, required: true },
      {
        name: "layout",
        label: "Diseño de cuadrícula",
        type: "select",
        value: currentLayout,
        options: [
          { value: "grid-2", label: "2 Columnas" },
          { value: "grid-3", label: "3 Columnas" },
          { value: "grid-4", label: "4 Columnas" },
          { value: "masonry", label: "Mosaico (Masonry)" }
        ]
      },
      {
        name: "fit",
        label: "Ajuste de imagen",
        type: "select",
        value: currentFit,
        options: [
          { value: "cover-adaptable", label: "Cubrir espacio adaptable" },
          { value: "contain", label: "Mostrar completa (sin recorte)" }
        ]
      },
      { name: "urls", label: "URLs de Imágenes", type: "items", items: currentUrls, placeholder: "https://ejemplo.com/imagen.jpg" }
    ]
  });
  if (!data) return false;

  const urls = data.urls.filter(Boolean);
  if (!urls.length) return false;

  block.dataset.galleryTitle = data.title.trim();
  block.dataset.galleryLayout = data.layout;
  block.dataset.galleryFit = data.fit || "cover-adaptable";
  block.dataset.galleryUrls = JSON.stringify(urls);

  const metaEl = block.querySelector(".rich-block-heading small");
  if (metaEl) metaEl.textContent = `${urls.length} imágenes | ${data.title.trim()}`;

  const bodyEl = block.querySelector(".rich-block-body");
  if (bodyEl) {
    bodyEl.innerHTML = renderGalleryHtml(data.title.trim(), data.layout, data.fit || "cover-adaptable", urls);
  }
  return true;
});
