import { createId, escapeHTML } from "../utils.js";

export const DEBUG_LOGS = (localStorage.getItem("NOTEVAULT_DEBUG") === "1") || location.search.includes("debug=1");
export const vlog = (...args) => { if (DEBUG_LOGS) console.log("[VOICE]", ...args); };
export const verr = (...args) => { if (DEBUG_LOGS) console.error("[VOICE]", ...args); };

export const CATEGORY_MAP = {
  recommended: "Recomendados",
  structure: "Estructura",
  lists: "Listas",
  blocks: "Bloques",
};

export const RECOMMENDED_IDS = [
  "reminder",
  "current-date",
  "current-time",
  "link",
  "image",
  "table-3x3",
  "check-list",
  "callout",
  "voice-recorder",
];

export const isValidHttpUrl = (value) =>
  /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(String(value || "").trim());

export const wrapBlock = (kind, inner) =>
  `<div class="insert-block" data-block-id="${kind}" data-block-instance="${createId()}">${inner}</div><p><br></p>`;

export const makeListBlock = (title, items) =>
  wrapBlock(
    "list-generic",
    `<h3>${escapeHTML(title)}</h3><ul>${items.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul>`,
  );

export const baseTemplate = (title, desc) =>
  wrapBlock(
    "base",
    `
        <div class="insert-block-card">
            <div class="insert-block-title">${escapeHTML(title)}</div>
            <div class="insert-block-desc">${escapeHTML(desc || "Bloque base listo para personalizar.")}</div>
        </div>
    `,
  );

export function ensureWrappedBlock(id, html) {
  const raw = String(html || "");
  if (raw.includes("data-block-instance=")) return raw;
  const inner = raw.replace(/(?:\s*<p><br><\/p>\s*)+$/i, "").trim();
  return wrapBlock(id, inner || "<p><br></p>");
}

export function formatClock(sec) {
  const n = Number(sec);
  if (!Number.isFinite(n) || n < 0) return "00:00";
  const total = Math.floor(n);
  if (total >= 3600) {
    const hh = String(Math.floor(total / 3600)).padStart(2, "0");
    const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const ss = String(total % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function sanitizeDurationSec(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.max(0, Math.floor(n));
}

export function getSafeDuration(audioEl, fallbackSeconds = 0) {
  const fallback = sanitizeDurationSec(fallbackSeconds);
  const raw = Number(audioEl?.duration);
  if (Number.isFinite(raw) && raw > 0) return raw;
  return fallback;
}

export function formatBytes(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = n;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value >= 10 || idx === 0 ? Math.round(value) : value.toFixed(1)} ${units[idx]}`;
}

export function sanitizeAttachmentFileName(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const fileName = raw.split(/[\\/]/).pop() || "";
  if (!/^[a-zA-Z0-9._-]+$/.test(fileName) || fileName.includes("..")) return "";
  return fileName;
}

export function extractAttachmentFileName(src) {
  const raw = String(src || "").trim();
  if (!raw) return "";
  try {
    const decoded = decodeURIComponent(raw);
    return sanitizeAttachmentFileName(decoded.split(/[\\/]/).pop() || "");
  } catch (_) {
    return sanitizeAttachmentFileName(raw.split(/[\\/]/).pop() || "");
  }
}

export function getVoiceNoteFallbackDuration(note) {
  const fromMs = Math.floor((Number(note?.dataset?.audioDurationMs) || 0) / 1000);
  return sanitizeDurationSec(fromMs || note?.dataset?.audioDuration || 0);
}

export function getAudioStatusLabel(status) {
  const map = {
    ready: "Listo",
    recording: "Grabando",
    paused: "Pausado",
    processing: "Procesando",
    recoverable: "Recuperable",
    error: "Error",
    missing: "Archivo no encontrado",
  };
  return map[String(status || "ready")] || "Listo";
}

export function parseAudioFileLabel(src) {
  const raw = String(src || "");
  if (!raw) return "Audio";
  try {
    return decodeURIComponent(raw).split("/").pop() || "Audio";
  } catch (_) {
    return raw.split("/").pop() || "Audio";
  }
}

export function parseAudioFormat(src) {
  const label = parseAudioFileLabel(src);
  const parts = label.split(".");
  return parts.length > 1 ? String(parts.pop() || "audio").toUpperCase() : "AUDIO";
}

export function buildVoiceMetaText(note) {
  const fileName = note?.dataset?.audioFile || "";
  const mime = note?.dataset?.audioMime || "";
  const format = (note?.dataset?.audioFormat || parseAudioFormat(fileName || mime)).toUpperCase();
  const duration = getVoiceNoteFallbackDuration(note);
  const size = formatBytes(note?.dataset?.audioSize);
  const createdAt = Number(note?.dataset?.audioCreatedAt || 0);
  const createdLabel = createdAt ? new Date(createdAt).toLocaleString("es-MX") : "";
  return [
    format,
    duration > 0 ? formatClock(duration) : "--:--",
    size,
    createdLabel,
  ].filter(Boolean).join(" · ");
}
