import { escapeHTML } from "../../utils.js";
import { openBlockModal } from "../modal.js";
import { blockShell, insertRichBlock } from "../block-renderer.js";
import { registerBlockEditor } from "../block-editors.js";

export const videoBlock = {
  id: "video",
  name: "Video",
  category: "blocks",
  description: "Video incrustado o de enlace.",
  icon: "video",
  async insert() {
    const data = await openBlockModal({
      title: "Insertar Video",
      icon: "video",
      submitLabel: "Insertar video",
      fields: [
        { name: "url", label: "Enlace del Video (YouTube, Vimeo o Directo)", placeholder: "Ej. https://www.youtube.com/watch?v=...", required: true },
        { name: "title", label: "Título del video (Opcional)", placeholder: "Ej. Clase magistral" }
      ]
    });
    if (!data) return false;

    const parsed = parseVideoUrl(data.url.trim());
    const titleText = data.title.trim() || parsed.title || "Video";

    return insertRichBlock(blockShell({
      type: "video",
      icon: "video",
      title: "Video",
      meta: titleText,
      accent: "#f43f5e",
      editable: false,
      data: {
        videoUrl: data.url.trim(),
        videoTitle: (data.title || "").trim()
      },
      body: renderVideoHtml(data.url.trim(), titleText)
    }));
  }
};

function parseVideoUrl(url) {
  let type = "unknown";
  let embedUrl = "";
  let id = "";

  const ytReg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const ytMatch = url.match(ytReg);
  if (ytMatch) {
    type = "youtube";
    id = ytMatch[1];
    embedUrl = `https://www.youtube.com/embed/${id}`;
    return { type, embedUrl, title: "YouTube Video", id };
  }

  const vimReg = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
  const vimMatch = url.match(vimReg);
  if (vimMatch) {
    type = "vimeo";
    id = vimMatch[3];
    embedUrl = `https://player.vimeo.com/video/${id}`;
    return { type, embedUrl, title: "Vimeo Video", id };
  }

  if (url.match(/\.(mp4|webm|ogg)(?:\?|$)/i)) {
    type = "direct";
    return { type, embedUrl: url, title: "Video Directo" };
  }

  return { type, embedUrl: url, title: "Enlace de Video" };
}

function renderVideoHtml(url, title) {
  const parsed = parseVideoUrl(url);

  if (parsed.type === "youtube" || parsed.type === "vimeo") {
    return `
      <div class="rich-video-card" contenteditable="false">
        <div class="rich-video-container">
          <iframe class="rich-video-iframe" src="${escapeHTML(parsed.embedUrl)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
        ${title ? `<div class="rich-video-caption">${escapeHTML(title)}</div>` : ""}
      </div>
    `;
  }

  if (parsed.type === "direct") {
    return `
      <div class="rich-video-card" contenteditable="false">
        <div class="rich-video-container">
          <video class="rich-video-player" src="${escapeHTML(url)}" controls></video>
        </div>
        ${title ? `<div class="rich-video-caption">${escapeHTML(title)}</div>` : ""}
      </div>
    `;
  }

  return `
    <div class="rich-video-card" contenteditable="false">
      <div class="rich-video-fallback">
        <span class="rich-video-fallback-icon"><i data-lucide="video" class="w-6 h-6"></i></span>
        <div>
          <strong>${escapeHTML(title || "Video")}</strong>
          <p class="text-xs text-on-surface-variant mt-1">${escapeHTML(url)}</p>
        </div>
        <a href="${escapeHTML(url)}" target="_blank" class="block-modal-primary mt-3" rel="noopener noreferrer">
          <i data-lucide="external-link" class="w-4 h-4"></i> Ver Video
        </a>
      </div>
    </div>
  `;
}

registerBlockEditor("video", async (block) => {
  if (!block) return false;
  const currentUrl = block.dataset.videoUrl || "";
  const currentTitle = block.dataset.videoTitle || "";

  const data = await openBlockModal({
    title: "Editar Video",
    icon: "video",
    submitLabel: "Guardar cambios",
    fields: [
      { name: "url", label: "Enlace del Video", placeholder: "Ej. https://www.youtube.com...", value: currentUrl, required: true },
      { name: "title", label: "Título del video (Opcional)", placeholder: "Ej. Clase magistral", value: currentTitle }
    ]
  });
  if (!data) return false;

  const parsed = parseVideoUrl(data.url.trim());
  const titleText = data.title.trim() || parsed.title || "Video";

  block.dataset.videoUrl = data.url.trim();
  block.dataset.videoTitle = (data.title || "").trim();

  const metaEl = block.querySelector(".rich-block-heading small");
  if (metaEl) metaEl.textContent = titleText;

  const bodyEl = block.querySelector(".rich-block-body");
  if (bodyEl) {
    bodyEl.innerHTML = renderVideoHtml(data.url.trim(), titleText);
  }
  return true;
});
