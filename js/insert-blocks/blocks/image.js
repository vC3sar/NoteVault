import { escapeHTML, showToast } from "../../utils.js";
import { openBlockModal } from "../modal.js";
import { blockShell, insertRichBlock } from "../block-renderer.js";
import { registerBlockEditor } from "../block-editors.js";
import { isValidHttpUrl } from "../shared.js";

export const imageBlock = {
  id: "image",
  name: "Imagen",
  category: "recommended",
  description: "Inserta imagen por URL.",
  icon: "image",
  async insert() {
    const data = await openBlockModal({
      title: "Imagen",
      icon: "image",
      submitLabel: "Insertar imagen",
      fields: [
        { name: "url", label: "URL de imagen", type: "url", placeholder: "https://...", required: true },
        { name: "alt", label: "Texto alternativo", placeholder: "Descripcion de la imagen" },
        { name: "caption", label: "Pie de imagen", placeholder: "Caption opcional" },
        {
          name: "size",
          label: "Tamano",
          type: "select",
          value: "medium",
          options: [
            { value: "small", label: "Pequena" },
            { value: "medium", label: "Mediana" },
            { value: "full", label: "Completa" },
          ],
        },
      ],
    });
    if (!data) return false;
    const url = data.url.trim();
    if (!isValidHttpUrl(url)) {
      showToast("URL de imagen invalida.", "error");
      return false;
    }

    const caption = data.caption?.trim();
    const title = caption || data.alt?.trim() || "Imagen";

    return insertRichBlock(blockShell({
      type: "image",
      icon: "image",
      title: escapeHTML(title),
      meta: "Imagen por URL",
      accent: "#0ea5e9",
      editable: false,
      data: {
        imageUrl: url,
        imageAlt: data.alt?.trim() || "",
        imageCaption: caption || "",
        imageSize: data.size || "medium",
      },
      body: `
        <figure class="rich-image-block rich-image-${escapeHTML(data.size || "medium")}">
          <img src="${escapeHTML(url)}" alt="${escapeHTML(data.alt || "")}" loading="lazy">
          <div class="rich-image-fallback" contenteditable="false"><i data-lucide="image-off" class="w-5 h-5"></i>Imagen no disponible</div>
          ${caption ? `<figcaption contenteditable="true">${escapeHTML(caption)}</figcaption>` : ""}
        </figure>
      `,
    }));
  },
};

registerBlockEditor("image", async (block) => {
  if (!block) return false;
  const image = block.querySelector(".rich-image-block img");
  const captionEl = block.querySelector(".rich-image-block figcaption");
  const currentUrl = block.dataset.imageUrl || image?.getAttribute("src") || "";
  const currentAlt = block.dataset.imageAlt || image?.getAttribute("alt") || "";
  const currentCaption = block.dataset.imageCaption || captionEl?.textContent?.trim() || "";
  const sizeMatch = Array.from(block.querySelector(".rich-image-block")?.classList || []).find((className) => className.startsWith("rich-image-"));
  const currentSize = block.dataset.imageSize || sizeMatch?.replace("rich-image-", "") || "medium";

  const data = await openBlockModal({
    title: "Editar imagen",
    icon: "image",
    submitLabel: "Guardar cambios",
    fields: [
      { name: "url", label: "URL de imagen", type: "url", placeholder: "https://...", value: currentUrl, required: true },
      { name: "alt", label: "Texto alternativo", placeholder: "Descripcion de la imagen", value: currentAlt },
      { name: "caption", label: "Pie de imagen", placeholder: "Caption opcional", value: currentCaption },
      {
        name: "size",
        label: "Tamano",
        type: "select",
        value: currentSize,
        options: [
          { value: "small", label: "Pequena" },
          { value: "medium", label: "Mediana" },
          { value: "full", label: "Completa" },
        ],
      },
    ],
  });
  if (!data) return false;

  const url = data.url.trim();
  if (!isValidHttpUrl(url)) {
    showToast("URL de imagen invalida.", "error");
    return false;
  }

  const caption = data.caption?.trim();
  const title = caption || data.alt?.trim() || "Imagen";

  block.dataset.imageUrl = url;
  block.dataset.imageAlt = data.alt?.trim() || "";
  block.dataset.imageCaption = caption || "";
  block.dataset.imageSize = data.size || "medium";

  const titleEl = block.querySelector(".rich-block-heading strong");
  if (titleEl) titleEl.textContent = title;

  const figure = block.querySelector(".rich-image-block");
  if (figure) {
    figure.classList.remove("rich-image-small", "rich-image-medium", "rich-image-full", "is-broken");
    figure.classList.add(`rich-image-${data.size || "medium"}`);
  }

  if (image) {
    image.setAttribute("src", url);
    image.setAttribute("alt", data.alt?.trim() || "");
  }

  if (caption) {
    if (captionEl) {
      captionEl.textContent = caption;
    } else {
      figure?.insertAdjacentHTML("beforeend", `<figcaption contenteditable="true">${escapeHTML(caption)}</figcaption>`);
    }
  } else {
    captionEl?.remove();
  }

  return true;
});
