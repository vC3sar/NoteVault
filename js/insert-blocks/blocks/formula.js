import { escapeHTML } from "../../utils.js";
import { openBlockModal } from "../modal.js";
import { blockShell, insertRichBlock } from "../block-renderer.js";
import { registerBlockEditor } from "../block-editors.js";

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-copy-formula]");
  if (btn) {
    e.preventDefault();
    e.stopPropagation();
    const formula = btn.getAttribute("data-copy-formula");
    navigator.clipboard.writeText(formula).then(() => {
      import("../../utils.js").then((m) => m.showToast("Fórmula copiada al portapapeles", "success"));
    });
  }
});

function loadKatexAndRender(formula, container) {
  const render = () => {
    try {
      window.katex.render(formula, container, { throwOnError: false, displayMode: true });
    } catch (e) {
      container.innerHTML = `<code class="rich-formula-plain">${escapeHTML(formula)}</code>`;
    }
  };

  if (window.katex) {
    render();
    return;
  }

  if (!document.querySelector('link[href*="katex"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css";
    document.head.appendChild(link);
  }

  if (!window.katexLoading) {
    window.katexLoading = true;
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js";
    script.onload = () => {
      window.katexLoading = false;
      document.dispatchEvent(new CustomEvent("katex-loaded"));
    };
    script.onerror = () => {
      window.katexLoading = false;
    };
    document.body.appendChild(script);
  }

  document.addEventListener("katex-loaded", render, { once: true });
}

export const formulaBlock = {
  id: "formula",
  name: "Fórmula matemática",
  category: "blocks",
  description: "Fórmula LaTeX o Texto Plano.",
  icon: "sigma",
  async insert() {
    const data = await openBlockModal({
      title: "Insertar Fórmula",
      icon: "sigma",
      submitLabel: "Insertar fórmula",
      fields: [
        { name: "formula", label: "Fórmula (Texto plano o LaTeX)", type: "textarea", placeholder: "Ej. E = mc^2 o \\int_{a}^{b} x^2 \\, dx", required: true },
        { name: "title", label: "Etiqueta / Nombre (Opcional)", placeholder: "Ej. Ley de la Relatividad" },
        { name: "desc", label: "Explicación (Opcional)", placeholder: "Ej. Relación entre energía y masa." }
      ]
    });
    if (!data) return false;

    const labelText = data.title.trim() || "Fórmula Matemática";

    const inst = blockShell({
      type: "formula",
      icon: "sigma",
      title: "Fórmula",
      meta: labelText,
      accent: "#8b5cf6",
      editable: false,
      data: {
        formulaCode: data.formula.trim(),
        formulaTitle: (data.title || "").trim(),
        formulaDesc: (data.desc || "").trim()
      },
      body: `
        <div class="rich-formula-card" contenteditable="false">
          <div class="rich-formula-display-container">
            <div class="rich-formula-display-target" data-pending-formula="${escapeHTML(data.formula.trim())}">
              <code class="rich-formula-plain">${escapeHTML(data.formula.trim())}</code>
            </div>
          </div>
          ${data.desc.trim() ? `<p class="rich-formula-desc">${escapeHTML(data.desc.trim())}</p>` : ""}
          <div class="rich-formula-actions">
            <button type="button" class="rich-formula-btn block-modal-secondary" data-copy-formula="${escapeHTML(data.formula.trim())}">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i> Copiar Fórmula
            </button>
          </div>
        </div>
      `
    });

    const inserted = insertRichBlock(inst);
    if (inserted) {
      const target = document.querySelector('[data-pending-formula]');
      if (target) {
        const rawFormula = target.getAttribute("data-pending-formula");
        target.removeAttribute("data-pending-formula");
        const isLatex = rawFormula.includes('\\') || rawFormula.includes('_') || rawFormula.includes('^') || rawFormula.includes('{') || rawFormula.includes('}');
        if (isLatex) {
          loadKatexAndRender(rawFormula, target);
        }
      }
    }
    return inserted;
  }
};

registerBlockEditor("formula", async (block) => {
  if (!block) return false;
  const currentFormula = block.dataset.formulaCode || "";
  const currentTitle = block.dataset.formulaTitle || "";
  const currentDesc = block.dataset.formulaDesc || "";

  const data = await openBlockModal({
    title: "Editar Fórmula",
    icon: "sigma",
    submitLabel: "Guardar cambios",
    fields: [
      { name: "formula", label: "Fórmula", type: "textarea", placeholder: "Ej. E = mc^2", value: currentFormula, required: true },
      { name: "title", label: "Etiqueta / Nombre (Opcional)", placeholder: "Ej. Ley de la Relatividad", value: currentTitle },
      { name: "desc", label: "Explicación (Opcional)", placeholder: "Ej. Relación...", value: currentDesc }
    ]
  });
  if (!data) return false;

  block.dataset.formulaCode = data.formula.trim();
  block.dataset.formulaTitle = (data.title || "").trim();
  block.dataset.formulaDesc = (data.desc || "").trim();

  const labelText = data.title.trim() || "Fórmula Matemática";
  const metaEl = block.querySelector(".rich-block-heading small");
  if (metaEl) metaEl.textContent = labelText;

  const bodyEl = block.querySelector(".rich-block-body");
  if (bodyEl) {
    bodyEl.innerHTML = `
      <div class="rich-formula-card" contenteditable="false">
        <div class="rich-formula-display-container">
          <div class="rich-formula-display-target">
            <code class="rich-formula-plain">${escapeHTML(data.formula.trim())}</code>
          </div>
        </div>
        ${data.desc.trim() ? `<p class="rich-formula-desc">${escapeHTML(data.desc.trim())}</p>` : ""}
        <div class="rich-formula-actions">
          <button type="button" class="rich-formula-btn block-modal-secondary" data-copy-formula="${escapeHTML(data.formula.trim())}">
            <i data-lucide="copy" class="w-3.5 h-3.5"></i> Copiar Fórmula
          </button>
        </div>
      </div>
    `;

    const isLatex = data.formula.trim().includes('\\') || data.formula.trim().includes('_') || data.formula.trim().includes('^') || data.formula.trim().includes('{') || data.formula.trim().includes('}');
    if (isLatex) {
      const target = bodyEl.querySelector(".rich-formula-display-target");
      if (target) loadKatexAndRender(data.formula.trim(), target);
    }
  }

  return true;
});

function scanAndRenderFormulas() {
  document.querySelectorAll(".rich-insert-block[data-block-type='formula']").forEach((block) => {
    const raw = block.dataset.formulaCode;
    const target = block.querySelector(".rich-formula-display-target");
    if (raw && target && !target.dataset.rendered) {
      const isLatex = raw.includes('\\') || raw.includes('_') || raw.includes('^') || raw.includes('{') || raw.includes('}');
      if (isLatex) {
        target.dataset.rendered = "true";
        loadKatexAndRender(raw, target);
      }
    }
  });
}

document.addEventListener("click", () => setTimeout(scanAndRenderFormulas, 200));
document.addEventListener("keyup", () => setTimeout(scanAndRenderFormulas, 200));
window.addEventListener("load", scanAndRenderFormulas);
