import { createId, escapeHTML } from "../utils.js";
import {
  buildVoiceMetaText,
  extractAttachmentFileName,
  formatBytes,
  formatClock,
  getAudioStatusLabel,
  getSafeDuration,
  getVoiceNoteFallbackDuration,
  parseAudioFormat,
  sanitizeAttachmentFileName,
  sanitizeDurationSec,
  verr,
  wrapBlock,
} from "./shared.js";

const voiceNoteCleanups = new WeakMap();

export function buildVoiceNoteHtml(meta = {}) {
  const durationSec = sanitizeDurationSec(meta.durationSec ?? Math.floor((Number(meta.durationMs) || 0) / 1000));
  const durationMs = Math.max(0, Math.floor(Number(meta.durationMs) || durationSec * 1000));
  const time = formatClock(durationSec);
  const safeFile = sanitizeAttachmentFileName(meta.fileName);
  const safeId = String(meta.id || (safeFile ? safeFile.replace(/\.[^.]+$/, "") : createId()));
  const safeMime = String(meta.mime || "audio/webm").trim();
  const safeFormat = String(meta.extension || parseAudioFormat(safeFile || safeMime)).replace(/^\./, "").toUpperCase();
  const createdAt = Number(meta.startedAt || meta.createdAt || Date.now());
  const status = String(meta.status || "ready");

  return wrapBlock(
    "voice-recorder",
    `
        <div class="voice-note" data-audio-file="${escapeHTML(safeFile)}" data-audio-id="${escapeHTML(safeId)}" data-audio-duration="${durationSec}" data-audio-duration-ms="${durationMs}" data-audio-mime="${escapeHTML(safeMime)}" data-audio-format="${escapeHTML(safeFormat)}" data-audio-size="${Math.max(0, Number(meta.sizeBytes) || 0)}" data-audio-created-at="${createdAt}" data-audio-status="${escapeHTML(status)}">
            <div class="voice-note-content">
                <div class="voice-note-header" contenteditable="false">
                    <span class="voice-note-badge">Nota de voz</span>
                    <span class="voice-note-status">${escapeHTML(getAudioStatusLabel(status))}</span>
                </div>
                <div class="voice-note-title" contenteditable="true">Nota de voz</div>
                <div class="voice-note-meta" contenteditable="false">${escapeHTML([
                  safeFormat,
                  durationSec > 0 ? time : "--:--",
                  formatBytes(meta.sizeBytes),
                  new Date(createdAt).toLocaleString("es-MX"),
                ].filter(Boolean).join(" · "))}</div>
                <audio class="voice-note-native-audio" controls preload="metadata" contenteditable="false" playsinline></audio>
            </div>
        </div>
    `,
  );
}

function cleanupVoiceNotePlayer(note) {
  if (!note) return;
  const cleanup = voiceNoteCleanups.get(note);
  if (typeof cleanup === "function") cleanup();
  voiceNoteCleanups.delete(note);
  note.__voicePlayerReady = false;
  note.removeAttribute("data-player-ready");
  note.classList.remove("voice-note-playing");
}

function upgradeNativeAudioPlayers(root = document) {
  const audios = root.querySelectorAll('audio[controls]:not([data-voice-upgraded="true"])');
  audios.forEach((audioEl) => {
    const src = audioEl.currentSrc || audioEl.getAttribute("src") || "";
    if (!src || audioEl.closest(".voice-note")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "voice-note";
    const fileName = extractAttachmentFileName(src);
    if (fileName) wrapper.dataset.audioFile = fileName;
    wrapper.dataset.audioSrc = src;
    wrapper.dataset.audioStatus = fileName ? "ready" : "error";
    wrapper.innerHTML = `
            <div class="voice-note-content">
                <div class="voice-note-header" contenteditable="false">
                    <span class="voice-note-badge">Nota de voz</span>
                    <span class="voice-note-status">Listo</span>
                </div>
                <div class="voice-note-title" contenteditable="true">Nota de voz</div>
                <div class="voice-note-meta" contenteditable="false">${parseAudioFormat(fileName || src)} · --:-- · ${new Date().toLocaleString("es-MX")}</div>
            </div>
        `;

    const oldParent = audioEl.parentNode;
    if (!oldParent) return;
    oldParent.insertBefore(wrapper, audioEl);
    wrapper.querySelector(".voice-note-content").appendChild(audioEl);
    audioEl.classList.add("voice-note-native-audio");
    audioEl.setAttribute("controls", "");
    audioEl.setAttribute("preload", "metadata");
    audioEl.setAttribute("playsinline", "");
    audioEl.setAttribute("contenteditable", "false");
    audioEl.dataset.voiceUpgraded = "true";
  });
}

function normalizeVoiceNoteMarkup(root = document) {
  root.querySelectorAll(".voice-note").forEach((note) => {
    const content = note.querySelector(".voice-note-content");
    if (!content) return;

    const audioEl = note.querySelector("audio");
    const legacySrc = note.dataset.audioSrc || audioEl?.getAttribute("src") || audioEl?.currentSrc || "";
    if (!note.dataset.audioFile && legacySrc) {
      const legacyFile = extractAttachmentFileName(legacySrc);
      if (legacyFile) {
        note.dataset.audioFile = legacyFile;
        note.dataset.audioId = legacyFile.replace(/\.[^.]+$/, "");
      }
    }
    if (!note.dataset.audioId && note.dataset.audioFile) {
      note.dataset.audioId = note.dataset.audioFile.replace(/\.[^.]+$/, "");
    }
    if (!note.dataset.audioStatus) note.dataset.audioStatus = note.dataset.audioFile ? "ready" : "error";

    let header = note.querySelector(".voice-note-header");
    if (!header) {
      header = document.createElement("div");
      header.className = "voice-note-header";
      header.setAttribute("contenteditable", "false");
      header.innerHTML = `<span class="voice-note-badge">Nota de voz</span><span class="voice-note-status">${getAudioStatusLabel(note.dataset.audioStatus)}</span>`;
      content.prepend(header);
    }
    const badgeEl = header.querySelector(".voice-note-badge");
    if (badgeEl) badgeEl.textContent = "Nota de voz";

    let titleEl = note.querySelector(".voice-note-title");
    if (!titleEl) {
      titleEl = document.createElement("div");
      titleEl.className = "voice-note-title";
      titleEl.setAttribute("contenteditable", "true");
      titleEl.textContent = "Nota de voz";
      header.insertAdjacentElement("afterend", titleEl);
    } else if (!titleEl.textContent.trim() || titleEl.textContent.trim() === "Clase grabada") {
      titleEl.textContent = "Nota de voz";
    }

    let metaEl = note.querySelector(".voice-note-meta");
    if (!metaEl) {
      metaEl = document.createElement("div");
      metaEl.className = "voice-note-meta";
      metaEl.setAttribute("contenteditable", "false");
      titleEl.insertAdjacentElement("afterend", metaEl);
    }
    metaEl.textContent = buildVoiceMetaText(note);
    const statusEl = note.querySelector(".voice-note-status");
    if (statusEl) statusEl.textContent = getAudioStatusLabel(note.dataset.audioStatus);

    note.querySelectorAll(".voice-note-player").forEach((player) => {
      player.querySelectorAll("audio").forEach((legacyAudio) => content.appendChild(legacyAudio));
      player.remove();
    });

    let nativeAudio = note.querySelector("audio.voice-note-native-audio") || note.querySelector("audio");
    if (!nativeAudio) {
      nativeAudio = document.createElement("audio");
      content.appendChild(nativeAudio);
    }
    nativeAudio.classList.add("voice-note-native-audio");
    nativeAudio.setAttribute("controls", "");
    nativeAudio.setAttribute("preload", "metadata");
    nativeAudio.setAttribute("playsinline", "");
    nativeAudio.setAttribute("contenteditable", "false");
    nativeAudio.removeAttribute("data-player-ready");
  });
}

function initVoiceNotePlayer(voiceNote) {
  const note = voiceNote;
  if (!note) return;
  const runtimeCleanup = voiceNoteCleanups.get(note);
  if (note.__voicePlayerReady === true && typeof runtimeCleanup === "function") return;
  if (typeof runtimeCleanup === "function") runtimeCleanup();
  note.__voicePlayerReady = false;
  note.removeAttribute("data-player-ready");
  note.classList.remove("voice-note-playing");

  const audioEl = note.querySelector("audio.voice-note-native-audio") || note.querySelector("audio");
  const metaEl = note.querySelector(".voice-note-meta");
  if (!audioEl) return;

  audioEl.classList.add("voice-note-native-audio");
  audioEl.controls = true;
  audioEl.preload = "metadata";
  audioEl.setAttribute("playsinline", "");
  audioEl.setAttribute("contenteditable", "false");
  audioEl.removeAttribute("data-player-ready");

  const markStatus = (status) => {
    note.dataset.audioStatus = status;
    const statusEl = note.querySelector(".voice-note-status");
    if (statusEl) statusEl.textContent = getAudioStatusLabel(status);
    if (metaEl) metaEl.textContent = buildVoiceMetaText(note);
  };

  const resolveAudioSrc = async () => {
    const fileName = sanitizeAttachmentFileName(note.dataset.audioFile);
    if (!fileName) {
      const legacySrc = note.dataset.audioSrc || audioEl.getAttribute("src") || "";
      if (legacySrc) {
        audioEl.src = legacySrc;
        return true;
      }
      markStatus("error");
      return false;
    }
    const api = window.noteVault || window.api;
    if (!api || typeof api.resolveAttachmentUrl !== "function") {
      markStatus("error");
      return false;
    }
    const info = await api.resolveAttachmentUrl(fileName);
    if (!info || !info.success || !info.exists || !info.url) {
      markStatus("missing");
      audioEl.removeAttribute("src");
      return false;
    }
    if (audioEl.getAttribute("src") !== info.url) audioEl.src = info.url;
    if (info.sizeBytes) note.dataset.audioSize = String(info.sizeBytes);
    if (info.meta) {
      note.dataset.audioId = info.meta.id || note.dataset.audioId || "";
      note.dataset.audioMime = info.meta.mime || note.dataset.audioMime || "";
      note.dataset.audioDuration = String(sanitizeDurationSec(info.meta.durationSec || note.dataset.audioDuration));
      note.dataset.audioDurationMs = String(Math.max(0, Math.floor(Number(info.meta.durationMs) || 0)));
      note.dataset.audioSize = String(info.meta.sizeBytes || info.sizeBytes || 0);
      note.dataset.audioCreatedAt = String(info.meta.startedAt || note.dataset.audioCreatedAt || "");
      note.dataset.audioStatus = info.meta.status || note.dataset.audioStatus || "ready";
      if (info.meta.extension) note.dataset.audioFormat = String(info.meta.extension).replace(/^\./, "").toUpperCase();
    }
    markStatus(note.dataset.audioStatus || "ready");
    audioEl.load();
    return true;
  };

  const onPlay = () => {
    const editorRoot = note.closest("#editor") || document;
    editorRoot.querySelectorAll(".voice-note audio.voice-note-native-audio").forEach((otherAudio) => {
      if (otherAudio !== audioEl && !otherAudio.paused) otherAudio.pause();
    });
    note.classList.add("voice-note-playing");
  };

  const onPause = () => {
    note.classList.remove("voice-note-playing");
  };

  const onLoadedMetadata = () => {
    const durationSec = sanitizeDurationSec(getSafeDuration(audioEl, getVoiceNoteFallbackDuration(note)));
    if (durationSec > 0) note.dataset.audioDuration = String(durationSec);
    if (metaEl) metaEl.textContent = buildVoiceMetaText(note);
  };

  const onAudioError = () => {
    verr("voice-native-audio-error", audioEl.error ? { code: audioEl.error.code, message: audioEl.error.message } : null);
    markStatus("error");
  };

  audioEl.addEventListener("play", onPlay);
  audioEl.addEventListener("pause", onPause);
  audioEl.addEventListener("ended", onPause);
  audioEl.addEventListener("loadedmetadata", onLoadedMetadata);
  audioEl.addEventListener("durationchange", onLoadedMetadata);
  audioEl.addEventListener("error", onAudioError);

  resolveAudioSrc().catch((error) => {
    verr("resolve native audio failed", error);
    markStatus("error");
  });

  voiceNoteCleanups.set(note, () => {
    audioEl.pause();
    audioEl.removeEventListener("play", onPlay);
    audioEl.removeEventListener("pause", onPause);
    audioEl.removeEventListener("ended", onPause);
    audioEl.removeEventListener("loadedmetadata", onLoadedMetadata);
    audioEl.removeEventListener("durationchange", onLoadedMetadata);
    audioEl.removeEventListener("error", onAudioError);
    note.__voicePlayerReady = false;
    note.removeAttribute("data-player-ready");
    note.classList.remove("voice-note-playing");
  });

  note.__voicePlayerReady = true;
  note.removeAttribute("data-player-ready");
}

export function initVoiceNotePlayers(root = document) {
  upgradeNativeAudioPlayers(root);
  normalizeVoiceNoteMarkup(root);
  root.querySelectorAll(".voice-note").forEach((note) => initVoiceNotePlayer(note));
}

export function destroyVoiceNotePlayers(root = document) {
  root.querySelectorAll(".voice-note").forEach((note) => cleanupVoiceNotePlayer(note));
}
