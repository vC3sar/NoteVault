import { escapeHTML } from "../../utils.js";
import { openBlockModal } from "../modal.js";
import { blockShell, insertRichBlock } from "../block-renderer.js";

function clampNumber(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function buildTable(rows, columns, includeHeaders) {
  const header = includeHeaders
    ? `<thead><tr>${Array.from({ length: columns }, (_, i) => `<th>Encabezado ${i + 1}</th>`).join("")}</tr></thead>`
    : "";
  const bodyRows = Array.from({ length: rows }, (_, row) => `
    <tr>${Array.from({ length: columns }, (_, col) => `<td>Dato ${row + 1}.${col + 1}</td>`).join("")}</tr>
  `).join("");
  return `<table class="rich-table">${header}<tbody>${bodyRows}</tbody></table>`;
}

export const tableBlock = {
  id: "table-3x3",
  name: "Tabla",
  category: "recommended",
  description: "Comparacion rapida.",
  icon: "table-2",
  async insert() {
    const data = await openBlockModal({
      title: "Tabla",
      icon: "table-2",
      submitLabel: "Insertar tabla",
      fields: [
        { name: "title", label: "Titulo", placeholder: "Comparacion" },
        { name: "rows", label: "Filas", type: "number", value: "3", min: 1, max: 12, required: true },
        { name: "columns", label: "Columnas", type: "number", value: "3", min: 1, max: 8, required: true },
        {
          name: "headers",
          label: "Encabezados",
          type: "select",
          value: "yes",
          options: [
            { value: "yes", label: "Con encabezados" },
            { value: "no", label: "Sin encabezados" },
          ],
        },
      ],
    });
    if (!data) return false;
    const rows = clampNumber(data.rows, 1, 12, 3);
    const columns = clampNumber(data.columns, 1, 8, 3);
    const title = data.title?.trim() || "Tabla";

    return insertRichBlock(blockShell({
      type: "table",
      icon: "table-2",
      title: escapeHTML(title),
      meta: `${rows} x ${columns}`,
      accent: "#7c3aed",
      body: buildTable(rows, columns, data.headers !== "no"),
    }));
  },
};
