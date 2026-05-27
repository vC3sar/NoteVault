import { createId, escapeHTML, showModal, showToast } from "./utils.js";
import { handleInput } from "./editor.js";
const DEBUG_LOGS = (localStorage.getItem("NOTEVAULT_DEBUG") === "1") || (location.search.includes("debug=1"));
const vlog = (...args) => { if (DEBUG_LOGS) console.log("[VOICE]", ...args); };
const verr = (...args) => { if (DEBUG_LOGS) console.error("[VOICE]", ...args); };

const CATEGORY_MAP = {
  recommended: "Recomendados",
  structure: "Estructura",
  lists: "Listas",
  blocks: "Bloques",
};

const RECOMMENDED_IDS = [
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

const isValidHttpUrl = (value) =>
  /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(String(value || "").trim());

const wrapBlock = (kind, inner) =>
  `<div class="insert-block" data-block-id="${kind}" data-block-instance="${createId()}">${inner}</div><p><br></p>`;

const makeListBlock = (title, items) =>
  wrapBlock(
    "list-generic",
    `<h3>${escapeHTML(title)}</h3><ul>${items.map((i) => `<li>${escapeHTML(i)}</li>`).join("")}</ul>`,
  );

const baseTemplate = (title, desc) =>
  wrapBlock(
    "base",
    `
        <div class="insert-block-card">
            <div class="insert-block-title">${escapeHTML(title)}</div>
            <div class="insert-block-desc">${escapeHTML(desc || "Bloque base listo para personalizar.")}</div>
        </div>
    `,
  );

function ensureWrappedBlock(id, html) {
  const raw = String(html || "");
  if (raw.includes("data-block-instance=")) return raw;
  const inner = raw.replace(/(?:\s*<p><br><\/p>\s*)+$/i, "").trim();
  return wrapBlock(id, inner || "<p><br></p>");
}

function getEditor() {
  return document.getElementById("editor");
}

function ensureSelectionInEditor(editor) {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const node =
      sel.anchorNode && sel.anchorNode.nodeType === Node.TEXT_NODE
        ? sel.anchorNode.parentElement
        : sel.anchorNode;
    if (node && editor.contains(node)) return;
  }
  editor.focus();
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function insertHtmlAtCursor(html) {
  const editor = getEditor();
  if (!editor) return false;
  ensureSelectionInEditor(editor);
  document.execCommand("insertHTML", false, html);
  handleInput();
  return true;
}

function formatClock(sec) {
  const total = Math.max(0, Math.floor(Number(sec) || 0));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function parseClockToSec(value) {
  const raw = String(value || "").trim();
  const m = raw.match(/^(\d{1,3}):(\d{2})$/);
  if (!m) return 0;
  const mm = Number(m[1]);
  const ss = Number(m[2]);
  if (!Number.isFinite(mm) || !Number.isFinite(ss)) return 0;
  return Math.max(0, mm * 60 + ss);
}

function normalizeIdleTime(value) {
  const raw = String(value || "").trim();
  if (!raw) return "00:00 / 00:00";
  if (raw.includes("/")) {
    const parts = raw.split("/").map((p) => p.trim()).filter(Boolean);
    if (parts.length === 2) return `${parts[0]} / ${parts[1]}`;
  }
  return `${raw} / ${raw}`;
}

const voiceNoteCleanups = new WeakMap();
const audioInfoCache = new Map();

function parseAudioFileLabel(src) {
  const raw = String(src || "");
  if (!raw) return "Audio";
  try {
    return decodeURIComponent(raw).split("/").pop() || "Audio";
  } catch (_) {
    return raw.split("/").pop() || "Audio";
  }
}

function parseAudioFormat(src) {
  const label = parseAudioFileLabel(src);
  const parts = label.split(".");
  return parts.length > 1 ? String(parts.pop() || "audio").toUpperCase() : "AUDIO";
}

function waitForAudioMetadata(audioEl, timeoutMs = 1200) {
  if (Number.isFinite(audioEl.duration) && audioEl.duration > 0) return Promise.resolve(true);
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      audioEl.removeEventListener("loadedmetadata", onReady);
      audioEl.removeEventListener("durationchange", onReady);
      clearTimeout(timer);
      resolve(ok);
    };
    const onReady = () => finish(true);
    const timer = setTimeout(() => finish(false), timeoutMs);
    audioEl.addEventListener("loadedmetadata", onReady, { once: true });
    audioEl.addEventListener("durationchange", onReady, { once: true });
  });
}

async function collectAudioInfoForUi(audioEl) {
  const src = audioEl.currentSrc || audioEl.getAttribute("src") || "";
  if (audioInfoCache.has(src)) return audioInfoCache.get(src);

  await waitForAudioMetadata(audioEl, 1200);
  const info = {
    format: parseAudioFormat(src),
    durationSec: Math.max(0, Math.floor(Number(audioEl.duration) || 0)),
    sampleRate: 0,
    channels: 0,
  };

  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx && src) {
      const ctx = new Ctx();
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("decode-timeout")), 1800));
      const ab = await Promise.race([fetch(src).then((r) => r.arrayBuffer()), timeout]);
      const decoded = await ctx.decodeAudioData(ab.slice(0));
      info.sampleRate = Math.max(0, Math.floor(Number(decoded.sampleRate) || 0));
      info.channels = Math.max(0, Math.floor(Number(decoded.numberOfChannels) || 0));
      if (!info.durationSec) info.durationSec = Math.max(0, Math.floor(Number(decoded.duration) || 0));
      try { await ctx.close(); } catch (_) {}
    }
  } catch (error) {
    vlog("audio-info-light-fallback", String(error?.message || error));
  }

  audioInfoCache.set(src, info);
  return info;
}

function cleanupWavePlayer(note) {
  if (!note) return;
  const cleanup = voiceNoteCleanups.get(note);
  if (typeof cleanup === "function") cleanup();
  voiceNoteCleanups.delete(note);
  note.dataset.playerReady = "false";
  note.classList.remove("voice-note-playing");
}

function buildVoiceNoteHtml(src, stamp, durationSec = 0) {
  const time = formatClock(durationSec);
  const safeDuration = Math.max(0, Math.floor(Number(durationSec) || 0));
  return wrapBlock(
    "voice-recorder",
    `
        <div class="voice-note" data-audio-src="${escapeHTML(src)}" data-audio-duration="${safeDuration}">
            <div class="voice-note-content">
                <div class="voice-note-title" contenteditable="true">Grabadora de voz</div>
                <div class="voice-note-meta" contenteditable="false">Audio · ${escapeHTML(stamp)}</div>
                <div class="voice-note-player" contenteditable="false">
                    <button class="voice-note-btn" type="button" aria-label="Reproducir" title="Reproducir o pausar">▶</button>
                    <input class="voice-note-seek" type="range" min="0" max="100" value="0" step="0.1">
                    <span class="voice-note-time" data-idle-time="${normalizeIdleTime(time)}">${normalizeIdleTime(time)}</span>
                </div>
                <audio preload="metadata" src="${escapeHTML(src)}" contenteditable="false"></audio>
            </div>
        </div>
    `,
  );
}

function upgradeNativeAudioPlayers(root = document) {
  const audios = root.querySelectorAll(
    'audio[controls]:not([data-voice-upgraded="true"])',
  );
  audios.forEach((audioEl) => {
    const src = audioEl.currentSrc || audioEl.getAttribute("src") || "";
    if (!src) return;

    const host = audioEl.closest(".voice-note");
    if (host) return;

    const wrapper = document.createElement("div");
    wrapper.className = "voice-note";
    wrapper.dataset.audioSrc = src;
    wrapper.innerHTML = `
            <div class="voice-note-content">
                <div class="voice-note-title" contenteditable="true">Grabadora de voz</div>
                <div class="voice-note-meta" contenteditable="false">Audio · ${new Date().toLocaleString("es-MX")}</div>
                <div class="voice-note-player" contenteditable="false">
                    <button class="voice-note-btn" type="button" aria-label="Reproducir" title="Reproducir o pausar">▶</button>
                    <input class="voice-note-seek" type="range" min="0" max="100" value="0" step="0.1">
                    <span class="voice-note-time" data-idle-time="00:00 / 00:00">00:00 / 00:00</span>
                </div>
            </div>
        `;

    const oldParent = audioEl.parentNode;
    if (!oldParent) return;
    oldParent.insertBefore(wrapper, audioEl);
    wrapper.querySelector(".voice-note-content").appendChild(audioEl);
    audioEl.removeAttribute("controls");
    audioEl.setAttribute("contenteditable", "false");
    audioEl.dataset.voiceUpgraded = "true";
  });
}

function normalizeVoiceNoteMarkup(root = document) {
  const notes = root.querySelectorAll(".voice-note");
  notes.forEach((note) => {
    const content = note.querySelector(".voice-note-content");
    if (!content) return;

    let player = note.querySelector(".voice-note-player");
    if (!player) {
      player = document.createElement("div");
      player.className = "voice-note-player";
      player.setAttribute("contenteditable", "false");
      content.appendChild(player);
    }

    let playBtn = player.querySelector(".voice-note-btn");
    if (!playBtn) {
      playBtn = document.createElement("button");
      playBtn.className = "voice-note-btn";
      playBtn.type = "button";
      playBtn.setAttribute("aria-label", "Reproducir");
      playBtn.setAttribute("title", "Reproducir o pausar");
      playBtn.textContent = "▶";
      player.prepend(playBtn);
    }

    let seekEl = player.querySelector(".voice-note-seek");
    if (!seekEl) {
      seekEl = document.createElement("input");
      seekEl.className = "voice-note-seek";
      player.appendChild(seekEl);
    }
    seekEl.type = "range";
    seekEl.min = "0";
    seekEl.max = "100";
    seekEl.step = "0.1";
    if (!seekEl.value) seekEl.value = "0";

    let timeEl = player.querySelector(".voice-note-time");
    if (!timeEl) {
      timeEl = document.createElement("span");
      timeEl.className = "voice-note-time";
      timeEl.textContent = "00:00 / 00:00";
      player.appendChild(timeEl);
    }
    if (!timeEl.dataset.idleTime) {
      timeEl.dataset.idleTime = normalizeIdleTime(timeEl.textContent || "00:00 / 00:00");
    }
    const knownDuration = Math.max(0, Math.floor(Number(note.dataset.audioDuration) || 0));
    if (knownDuration > 0) {
      const fastIdle = `00:00 / ${formatClock(knownDuration)}`;
      timeEl.dataset.idleTime = fastIdle;
      timeEl.textContent = fastIdle;
    }
    timeEl.textContent = normalizeIdleTime(timeEl.textContent || timeEl.dataset.idleTime);

    player.setAttribute("contenteditable", "false");
  });
}

export function initVoiceNotePlayers(root = document) {
  upgradeNativeAudioPlayers(root);
  normalizeVoiceNoteMarkup(root);
  const nodes = root.querySelectorAll(".voice-note[data-audio-src]");
  nodes.forEach((note) => {
    const hasRuntimeCleanup = typeof voiceNoteCleanups.get(note) === "function";
    if (note.dataset.playerReady === "true" && hasRuntimeCleanup) return;
    if (note.dataset.playerReady === "true" && !hasRuntimeCleanup) {
      note.dataset.playerReady = "false";
      note.classList.remove("voice-note-playing");
    }
    const audioEl = note.querySelector("audio");
    const playBtn = note.querySelector(".voice-note-btn");
    const seekEl = note.querySelector(".voice-note-seek");
    const timeEl = note.querySelector(".voice-note-time");
    const metaEl = note.querySelector(".voice-note-meta");
    if (!audioEl || !playBtn || !seekEl || !timeEl) return;
    if (!timeEl.dataset.idleTime) {
      timeEl.dataset.idleTime = normalizeIdleTime(timeEl.textContent || "00:00 / 00:00");
    }
    timeEl.textContent = normalizeIdleTime(timeEl.textContent || timeEl.dataset.idleTime);

    audioEl.controls = false;
    audioEl.setAttribute("playsinline", "true");
    audioEl.style.display = "none";
    note.classList.remove("voice-note-playing");

    let isProcessing = false;
    let processingTimer = null;
    const MAX_PROCESSING_MS = 6000;
    const MAX_RETRIES = 3;
    let retryCount = 0;
    let retryTimer = null;
    let isSeeking = false;
    const dbg = (label, extra = {}) => {
      vlog(label, {
        src: audioEl.currentSrc || audioEl.getAttribute("src") || "",
        readyState: audioEl.readyState,
        networkState: audioEl.networkState,
        duration: audioEl.duration,
        paused: audioEl.paused,
        processing: isProcessing,
        ...extra,
      });
    };

    const setProcessing = (enabled) => {
      isProcessing = !!enabled;
      playBtn.disabled = isProcessing;
      seekEl.disabled = isProcessing;
      if (isProcessing) {
        playBtn.textContent = "…";
        timeEl.textContent = "El recurso se está procesando...";
        note.classList.remove("voice-note-playing");
      } else {
        playBtn.textContent = audioEl.paused ? "▶" : "❚❚";
        updateTime();
      }
      dbg("setProcessing", { enabled: isProcessing });
    };

    const updateTime = () => {
      const current = Number.isFinite(audioEl.currentTime)
        ? audioEl.currentTime
        : 0;
      const total = Number.isFinite(audioEl.duration) ? audioEl.duration : 0;
      const idle = normalizeIdleTime(timeEl.dataset.idleTime || "00:00 / 00:00");
      const idleTotalLabel = idle.split("/")[1]?.trim() || "00:00";
      const idleTotalSec = parseClockToSec(idleTotalLabel);
      if (total <= 0) {
        const currentLabel = formatClock(current);
        if (current <= 0) {
          timeEl.textContent = idle;
        } else if (idleTotalSec > 0) {
          timeEl.textContent = `${currentLabel} / ${formatClock(idleTotalSec)}`;
        } else {
          timeEl.textContent = `${currentLabel} / --:--`;
        }
        if (!isSeeking) seekEl.value = "0";
        return;
      }
      const percent = total > 0 ? (current / total) * 100 : 0;
      if (!isSeeking) seekEl.value = String(Math.max(0, Math.min(100, percent)));
      const totalLabel = formatClock(total);
      const syncedIdle = `00:00 / ${totalLabel}`;
      if (timeEl.dataset.idleTime !== syncedIdle) {
        timeEl.dataset.idleTime = syncedIdle;
      }
      note.dataset.audioDuration = String(Math.max(0, Math.floor(total)));
      timeEl.textContent =
        total > 0
          ? `${formatClock(current)} / ${totalLabel}`
          : `${formatClock(current)} / 00:00`;
    };

    const hasUsableAudio = () => {
      const durationOk = Number.isFinite(audioEl.duration) && audioEl.duration > 0;
      const readyOk = audioEl.readyState >= 2;
      return durationOk || readyOk;
    };

    const clearRetryTimer = () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    };

    const scheduleRetry = (reason) => {
      if (hasUsableAudio()) {
        setProcessing(false);
        updateTime();
        return;
      }
      if (retryCount >= MAX_RETRIES) {
        setProcessing(false);
        playBtn.disabled = true;
        seekEl.disabled = true;
        timeEl.textContent = "No se pudo cargar";
        verr("audio-retry-exhausted", { reason, retries: retryCount });
        return;
      }
      retryCount += 1;
      const delay = 450 * retryCount;
      timeEl.textContent = `Reintentando audio... (${retryCount}/${MAX_RETRIES})`;
      dbg("audio-retry-scheduled", { reason, retryCount, delay });
      clearRetryTimer();
      retryTimer = setTimeout(() => {
        dbg("audio-retry-load", { retryCount });
        setProcessing(true);
        audioEl.load();
      }, delay);
    };

    const onPlayPauseClick = async () => {
      try {
        if (isProcessing) {
          dbg("click-during-processing");
          showToast("El recurso se está procesando...", "neutral");
          return;
        }
        dbg("click-playpause");
        if (metaEl && metaEl.dataset.enriched !== "true") {
          const src = audioEl.currentSrc || audioEl.getAttribute("src") || "";
          const fileLabel = parseAudioFileLabel(src);
          metaEl.textContent = "Leyendo datos del archivo...";
          const info = await collectAudioInfoForUi(audioEl);
          const durationLabel = info.durationSec > 0 ? formatClock(info.durationSec) : "--:--";
          const srLabel = info.sampleRate > 0 ? `${Math.round(info.sampleRate / 1000)}kHz` : "";
          const chLabel = info.channels > 0 ? `${info.channels}ch` : "";
          metaEl.textContent = [fileLabel, info.format, durationLabel, srLabel, chLabel]
            .filter(Boolean)
            .join(" · ");
          metaEl.dataset.enriched = "true";
          dbg("meta-ui-enriched", info);
        }
        if (audioEl.paused) await audioEl.play();
        else audioEl.pause();
      } catch (error) {
        verr("Audio play error:", error);
        showToast("No se pudo reproducir el audio todavía.", "error");
      }
    };
    const onPlay = () => {
      playBtn.textContent = "❚❚";
      note.classList.add("voice-note-playing");
    };
    const onPause = () => {
      playBtn.textContent = "▶";
      note.classList.remove("voice-note-playing");
    };
    const onEnded = () => {
      playBtn.textContent = "▶";
      note.classList.remove("voice-note-playing");
      audioEl.currentTime = 0;
      updateTime();
    };
    const onTimeUpdate = () => updateTime();
    const onLoadedMetadata = () => {
      if (Number.isFinite(audioEl.duration) && audioEl.duration > 0) {
        setProcessing(false);
      } else {
        scheduleRetry("loadedmetadata-without-duration");
      }
      dbg("loadedmetadata");
      updateTime();
    };
    const onSeekInput = () => {
      isSeeking = true;
      const total = Number.isFinite(audioEl.duration) ? audioEl.duration : 0;
      if (total <= 0) return;
      const pct = Math.max(0, Math.min(100, Number(seekEl.value) || 0)) / 100;
      audioEl.currentTime = Math.max(0, Math.min(total, pct * total));
      updateTime();
    };
    const onSeekCommit = () => {
      isSeeking = false;
      updateTime();
    };
    const onAudioError = () => {
      const err = audioEl.error ? { code: audioEl.error.code, message: audioEl.error.message } : null;
      verr("audio-error", err);
      note.classList.remove("voice-note-playing");
      scheduleRetry("audio-error");
    };
    const onCanPlay = () => {
      if (processingTimer) {
        clearTimeout(processingTimer);
        processingTimer = null;
      }
      clearRetryTimer();
      setProcessing(false);
      dbg("canplay");
      updateTime();
    };
    const onLoadedData = () => dbg("loadeddata");
    const onStalled = () => dbg("stalled");
    const onWaiting = () => dbg("waiting");
    const onSuspend = () => dbg("suspend");
    const onDurationChange = () => dbg("durationchange");

    playBtn.addEventListener("click", onPlayPauseClick);
    seekEl.addEventListener("input", onSeekInput);
    seekEl.addEventListener("change", onSeekCommit);
    seekEl.addEventListener("pointerup", onSeekCommit);
    seekEl.addEventListener("touchend", onSeekCommit);
    audioEl.addEventListener("play", onPlay);
    audioEl.addEventListener("pause", onPause);
    audioEl.addEventListener("ended", onEnded);
    audioEl.addEventListener("timeupdate", onTimeUpdate);
    audioEl.addEventListener("loadedmetadata", onLoadedMetadata);
    audioEl.addEventListener("error", onAudioError);
    audioEl.addEventListener("canplay", onCanPlay);
    audioEl.addEventListener("canplaythrough", onCanPlay);
    audioEl.addEventListener("loadeddata", onLoadedData);
    audioEl.addEventListener("stalled", onStalled);
    audioEl.addEventListener("waiting", onWaiting);
    audioEl.addEventListener("suspend", onSuspend);
    audioEl.addEventListener("durationchange", onDurationChange);
    setProcessing(true);
    if (audioEl.readyState === 0) audioEl.load();
    timeEl.textContent = timeEl.dataset.idleTime || "00:00 / 00:00";
    processingTimer = setTimeout(() => {
      if (hasUsableAudio()) {
        setProcessing(false);
        updateTime();
        dbg("processing-timeout-unlock");
      } else {
        dbg("processing-timeout-retry");
        scheduleRetry("processing-timeout");
      }
    }, MAX_PROCESSING_MS);
    dbg("init-player");

    voiceNoteCleanups.set(note, () => {
      if (processingTimer) {
        clearTimeout(processingTimer);
        processingTimer = null;
      }
      clearRetryTimer();
      audioEl.pause();
      playBtn.removeEventListener("click", onPlayPauseClick);
      seekEl.removeEventListener("input", onSeekInput);
      seekEl.removeEventListener("change", onSeekCommit);
      seekEl.removeEventListener("pointerup", onSeekCommit);
      seekEl.removeEventListener("touchend", onSeekCommit);
      audioEl.removeEventListener("play", onPlay);
      audioEl.removeEventListener("pause", onPause);
      audioEl.removeEventListener("ended", onEnded);
      audioEl.removeEventListener("timeupdate", onTimeUpdate);
      audioEl.removeEventListener("loadedmetadata", onLoadedMetadata);
      audioEl.removeEventListener("error", onAudioError);
      audioEl.removeEventListener("canplay", onCanPlay);
      audioEl.removeEventListener("canplaythrough", onCanPlay);
      audioEl.removeEventListener("loadeddata", onLoadedData);
      audioEl.removeEventListener("stalled", onStalled);
      audioEl.removeEventListener("waiting", onWaiting);
      audioEl.removeEventListener("suspend", onSuspend);
      audioEl.removeEventListener("durationchange", onDurationChange);
    });

    note.dataset.playerReady = "true";
  });
}

export function destroyVoiceNotePlayers(root = document) {
  const nodes = root.querySelectorAll(".voice-note[data-audio-src]");
  nodes.forEach((note) => cleanupWavePlayer(note));
}

async function recordAudioFromMic() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast("Tu entorno no soporta grabación de micrófono.", "error");
    return null;
  }

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    showToast("No se pudo acceder al micrófono.", "error");
    return null;
  }

  const pickRecorderMimeType = () => {
    if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") return "";
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
      "audio/mp4"
    ];
    return candidates.find((m) => MediaRecorder.isTypeSupported(m)) || "";
  };

  const selectedMimeType = pickRecorderMimeType();
  let recorder;
  try {
    recorder = selectedMimeType
      ? new MediaRecorder(stream, { mimeType: selectedMimeType })
      : new MediaRecorder(stream);
  } catch (error) {
    recorder = new MediaRecorder(stream);
  }
  const chunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const panel = document.createElement("div");
  panel.className =
    "fixed bottom-6 right-6 z-[140] rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/95 dark:bg-slate-900/95 px-4 py-3.5 shadow-xl backdrop-blur-sm min-w-[300px]";
  panel.innerHTML = `
        <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
                <span id="rec-dot" class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <div class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Grabadora de voz</div>
            </div>
            <div id="rec-timer" class="text-xs font-semibold text-on-surface-variant">00:00</div>
        </div>
        <div id="rec-status" class="text-[11px] text-on-surface-variant mb-2">Lista para grabar</div>
        <div class="flex items-center gap-2">
            <button id="rec-start" class="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">Iniciar</button>
            <button id="rec-stop" class="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold" disabled>Detener</button>
            <button id="rec-close" class="px-3 py-1.5 rounded-md bg-surface-container-high hover:bg-surface-container-highest text-xs font-semibold">Cerrar</button>
        </div>
    `;
  document.body.appendChild(panel);

  const startBtn = panel.querySelector("#rec-start");
  const stopBtn = panel.querySelector("#rec-stop");
  const closeBtn = panel.querySelector("#rec-close");
  const recDot = panel.querySelector("#rec-dot");
  const recStatus = panel.querySelector("#rec-status");
  const recTimer = panel.querySelector("#rec-timer");
  let startedAt = 0;
  let elapsedSecAtStop = 0;
  let timerId = null;

  const getBlobDurationSec = (blob) =>
    new Promise((resolveDur) => {
      const el = document.createElement("audio");
      const url = URL.createObjectURL(blob);
      el.preload = "metadata";
      el.src = url;
      el.onloadedmetadata = () => {
        const d = Number.isFinite(el.duration) ? el.duration : 0;
        URL.revokeObjectURL(url);
        resolveDur(d);
      };
      el.onerror = () => {
        URL.revokeObjectURL(url);
        resolveDur(0);
      };
    });

  return new Promise((resolve) => {
    const cleanup = () => {
      if (timerId) clearInterval(timerId);
      stream.getTracks().forEach((t) => t.stop());
      panel.remove();
    };

    startBtn.onclick = () => {
      chunks.length = 0;
      recorder.start(250);
      startedAt = Date.now();
      recStatus.textContent = "Grabando...";
      recDot.classList.remove("bg-slate-400");
      recDot.classList.add("bg-red-500", "animate-pulse");
      startBtn.disabled = true;
      stopBtn.disabled = false;
      timerId = setInterval(() => {
        const elapsedSec = Math.max(
          0,
          Math.floor((Date.now() - startedAt) / 1000),
        );
        const mm = String(Math.floor(elapsedSec / 60)).padStart(2, "0");
        const ss = String(elapsedSec % 60).padStart(2, "0");
        recTimer.textContent = `${mm}:${ss}`;
      }, 250);
    };

      stopBtn.onclick = () => {
        if (recorder.state === "recording") recorder.stop();
        if (timerId) {
          clearInterval(timerId);
          timerId = null;
        }
        elapsedSecAtStop = Math.max(
          0,
          Math.floor((Date.now() - startedAt) / 1000),
        );
        recStatus.textContent = "Procesando audio...";
        recDot.classList.remove("animate-pulse");
        recDot.classList.remove("bg-red-500");
        recDot.classList.add("bg-amber-500");
      };

    closeBtn.onclick = () => {
      if (recorder.state === "recording") recorder.stop();
      cleanup();
      resolve(null);
    };

    recorder.onstop = async () => {
      if (!chunks.length) {
        cleanup();
        resolve(null);
        return;
      }
      const normalizedMime = String(recorder.mimeType || selectedMimeType || "audio/webm")
        .toLowerCase()
        .split(";")[0]
        .trim();
      const blob = new Blob(chunks, {
        type: normalizedMime || "audio/webm",
      });
      const measuredDurationSec = await getBlobDurationSec(blob);
      const durationSec = Math.max(
        0,
        Math.floor(Number(measuredDurationSec) || 0),
        Math.floor(Number(elapsedSecAtStop) || 0),
      );
      const base64 = await new Promise((res) => {
        const reader = new FileReader();
        reader.onload = (ev) => res(ev.target.result);
        reader.readAsDataURL(blob);
      });
      recStatus.textContent = "Audio listo. Cierra este panel cuando quieras.";
      stopBtn.disabled = true;
      closeBtn.classList.add("bg-primary/15");
      cleanup();
      resolve({ base64, mimeType: blob.type || normalizedMime || "audio/webm", durationSec });
    };
  });
}

const BLOCKS = [
  {
    id: "reminder",
    name: "Recordatorio",
    category: "recommended",
    description: "Recordatorio con fecha.",
    icon: "alarm-clock",
    template: () =>
      wrapBlock(
        "reminder",
        `<div class="insert-block-meta"><strong>Recordatorio:</strong> ${new Date().toLocaleDateString("es-MX")}</div><p>Tarea pendiente...</p>`,
      ),
  },
  {
    id: "current-date",
    name: "Fecha actual",
    category: "recommended",
    description: "Inserta la fecha de hoy.",
    icon: "calendar-days",
    template: () =>
      wrapBlock(
        "current-date",
        `<div class="insert-block-meta">${new Date().toLocaleDateString("es-MX", { dateStyle: "full" })}</div>`,
      ),
  },
  {
    id: "current-time",
    name: "Hora actual",
    category: "recommended",
    description: "Inserta la hora actual.",
    icon: "clock-3",
    template: () =>
      wrapBlock(
        "current-time",
        `<div class="insert-block-meta">${new Date().toLocaleTimeString("es-MX")}</div>`,
      ),
  },
  {
    id: "link",
    name: "Enlace",
    category: "recommended",
    description: "Enlace con validación.",
    icon: "link",
    insert: async () => {
      const url = await showModal(
        "URL del enlace",
        "https://ejemplo.com",
        "https://",
      );
      if (!url) return false;
      if (!isValidHttpUrl(url))
        return showToast("Enlace inválido. Usa http(s).", "error");
      const label = await showModal("Texto del enlace", "Texto visible", url);
      return insertHtmlAtCursor(
        wrapBlock(
          "link",
          `<a href="${escapeHTML(url)}" target="_blank">${escapeHTML((label || url).trim())}</a>`,
        ),
      );
    },
  },
  {
    id: "image",
    name: "Imagen",
    category: "recommended",
    description: "Inserta imagen por URL.",
    icon: "image",
    template: () =>
      `<img src="https://picsum.photos/900/500" alt="Imagen insertada" class="max-w-full h-auto rounded-2xl shadow-lg my-4 border border-outline-variant/20"><p><br></p>`,
  },
  {
    id: "table-3x3",
    name: "Tabla",
    category: "recommended",
    description: "Comparación rápida.",
    icon: "table-2",
    template: () =>
      `<table><thead><tr><th style="text-align: center;">Encabezado 1</th><th style="text-align: center;">Encabezado 2</th><th style="text-align: center;">Encabezado 3</th></tr></thead><tbody><tr><td>Dato 1</td><td>Dato 2</td><td>Dato 3</td></tr><tr><td>Dato 4</td><td>Dato 5</td><td>Dato 6</td></tr></tbody></table><p><br></p>`,
  },
  {
    id: "check-list",
    name: "Checklist",
    category: "recommended",
    description: "Tareas pendientes.",
    icon: "list-checks",
    template: () =>
      `<ul class="editor-check-list"><li><input type="checkbox"> Tarea 1</li><li><input type="checkbox"> Tarea 2</li></ul><p><br></p>`,
  },
  {
    id: "callout",
    name: "Tip / Callout",
    category: "recommended",
    description: "Aviso visual.",
    icon: "lightbulb",
    template: () =>
      `<div class="insert-callout" style="border-left:4px solid #6366f1;padding:.5rem .75rem;background:rgba(99,102,241,.08);border-radius:.4rem;display:flex;align-items:center;gap:.5rem;"><span class="insert-callout-icon-wrap" contenteditable="false"><i data-lucide="lightbulb" class="insert-callout-icon" aria-hidden="true"></i></span><div><strong class="insert-callout-label" contenteditable="false">TIP:</strong> <span class="insert-callout-placeholder" data-callout-placeholder="true">Escribe aquí una nota destacada.</span></div></div><p><br></p>`,
  },

  {
    id: "h2",
    name: "Título H2",
    category: "structure",
    description: "Sección principal.",
    icon: "heading-2",
    template: () => `<h2>Título de Sección</h2><p><br></p>`,
  },
  {
    id: "h3",
    name: "Título H3",
    category: "structure",
    description: "Subsección.",
    icon: "heading-3",
    template: () => `<h3>Subsección</h3><p><br></p>`,
  },
  {
    id: "divider",
    name: "Separador",
    category: "structure",
    description: "Línea horizontal.",
    icon: "minus",
    template: () => `<hr><p><br></p>`,
  },
  {
    id: "collapsible-section",
    name: "Sección plegable",
    category: "structure",
    description: "Abrir/cerrar contenido.",
    icon: "chevrons-up-down",
    template: () =>
      `<details><summary>Sección plegable</summary><p>Contenido ocultable...</p></details><p><br></p>`,
  },
  {
    id: "columns-2",
    name: "Columnas 2",
    category: "structure",
    description: "Layout en 2 columnas.",
    icon: "columns-2",
    template: () =>
      wrapBlock(
        "columns-2",
        `<div class="insert-columns insert-columns-2"><div><h4>Columna 1</h4><p>Contenido...</p></div><div><h4>Columna 2</h4><p>Contenido...</p></div></div>`,
      ),
  },
  {
    id: "metadata",
    name: "Metadatos",
    category: "structure",
    description: "Info técnica.",
    icon: "database",
    template: () =>
      wrapBlock(
        "metadata",
        `<div class="insert-block-meta">Creado: ${new Date().toLocaleString("es-MX")} | Autor: Usuario</div>`,
      ),
  },

  {
    id: "bullet-list",
    name: "Lista con viñetas",
    category: "lists",
    description: "Puntos rápidos.",
    icon: "list",
    template: () =>
      `<ul><li>Punto 1</li><li>Punto 2</li><li>Punto 3</li></ul><p><br></p>`,
  },
  {
    id: "number-list",
    name: "Lista numerada",
    category: "lists",
    description: "Pasos o ranking.",
    icon: "list-ordered",
    template: () =>
      `<ol><li>Paso 1</li><li>Paso 2</li><li>Paso 3</li></ol><p><br></p>`,
  },
  {
    id: "priority-list",
    name: "Lista de prioridades",
    category: "lists",
    description: "Orden de prioridad.",
    icon: "arrow-up-wide-narrow",
    template: () => makeListBlock("Prioridades", ["Alta", "Media", "Baja"]),
  },
  {
    id: "shopping-list",
    name: "Lista de compras",
    category: "lists",
    description: "Compras pendientes.",
    icon: "shopping-cart",
    template: () => makeListBlock("Compras", ["Producto 1", "Producto 2"]),
  },
  {
    id: "reading-list",
    name: "Lista de lectura",
    category: "lists",
    description: "Lecturas pendientes.",
    icon: "book-open",
    template: () => makeListBlock("Lecturas", ["Artículo 1", "Libro 1"]),
  },
  {
    id: "due-list",
    name: "Pendientes por fecha",
    category: "lists",
    description: "Tareas por fecha.",
    icon: "calendar-range",
    template: () =>
      makeListBlock("Pendientes por fecha", [
        new Date().toLocaleDateString("es-MX") + " - Tarea",
      ]),
  },

  {
    id: "blockquote",
    name: "Cita",
    category: "blocks",
    description: "Bloque destacado.",
    icon: "quote",
    template: () =>
      `<blockquote>Cita o referencia importante...</blockquote><p><br></p>`,
  },
  {
    id: "code-block",
    name: "Bloque de código",
    category: "blocks",
    description: "Código con fondo.",
    icon: "code-2",
    template: () =>
      `<pre><code>// Escribe tu código aquí</code></pre><p><br></p>`,
  },
  {
    id: "gallery",
    name: "Galería",
    category: "blocks",
    description: "Galería de imágenes.",
    icon: "images",
    template: () =>
      wrapBlock(
        "gallery",
        `<div class="insert-columns insert-columns-3"><div class="insert-block-card">Imagen 1</div><div class="insert-block-card">Imagen 2</div><div class="insert-block-card">Imagen 3</div></div>`,
      ),
  },
  {
    id: "video",
    name: "Video",
    category: "blocks",
    description: "Video por enlace.",
    icon: "video",
    template: () =>
      wrapBlock(
        "video",
        `<div class="insert-block-card"><strong>Video:</strong> <a href="https://ejemplo.com/video" target="_blank">Abrir video</a></div>`,
      ),
  },
  {
    id: "pdf",
    name: "PDF",
    category: "blocks",
    description: "PDF por enlace.",
    icon: "file-text",
    template: () =>
      wrapBlock(
        "pdf",
        `<div class="insert-block-card"><strong>PDF:</strong> <a href="https://ejemplo.com/archivo.pdf" target="_blank">Abrir PDF</a></div>`,
      ),
  },
  {
    id: "timeline",
    name: "Timeline",
    category: "blocks",
    description: "Línea de tiempo.",
    icon: "history",
    template: () =>
      wrapBlock("timeline", `<ol><li>Hito 1</li><li>Hito 2</li></ol>`),
  },
  {
    id: "formula",
    name: "Bloque de fórmula",
    category: "blocks",
    description: "Fórmulas.",
    icon: "sigma",
    template: () => wrapBlock("formula", `<pre><code>E = mc^2</code></pre>`),
  },
  {
    id: "contact-block",
    name: "Bloque de contacto",
    category: "blocks",
    description: "Datos de contacto.",
    icon: "contact",
    template: () =>
      wrapBlock(
        "contact-block",
        `<div class="insert-block-card"><strong>Nombre:</strong> ...<br><strong>Email:</strong> ...</div>`,
      ),
  },
  {
    id: "reference-block",
    name: "Bloque de referencia",
    category: "blocks",
    description: "Referencia externa.",
    icon: "book-marked",
    template: () =>
      wrapBlock(
        "reference-block",
        `<div class="insert-block-card"><strong>Referencia:</strong> Fuente / enlace</div>`,
      ),
  },
  {
    id: "voice-recorder",
    name: "Grabadora de voz",
    category: "blocks",
    description: "Graba audio con micrófono.",
    icon: "mic",
    insert: async () => {
      const recorded = await recordAudioFromMic();
      if (!recorded) return false;
      const res = await window.api.saveRecordedAudio(recorded);
      if (!res || !res.success || !res.path) {
        showToast("No se pudo guardar el audio grabado.", "error");
        return false;
      }
      const duration = Math.max(
        0,
        Math.floor(Number(recorded.durationSec) || 0),
      );
      const stamp = new Date().toLocaleString("es-MX");
      const inserted = insertHtmlAtCursor(
        buildVoiceNoteHtml(res.path, stamp, duration),
      );
      if (inserted) {
        const editor = getEditor();
        if (editor) initVoiceNotePlayers(editor);
      }
      return inserted;
    },
  },
];

export function renderInsertBlocks() {
  const panels = {
    recommended: document.querySelector('[data-insert-panel="recommended"]'),
    structure: document.querySelector('[data-insert-panel="structure"]'),
    lists: document.querySelector('[data-insert-panel="lists"]'),
    blocks: document.querySelector('[data-insert-panel="blocks"]'),
  };
  Object.values(panels).forEach((p) => {
    if (p) p.innerHTML = "";
  });

  BLOCKS.forEach((block) => {
    const panel = panels[block.category];
    if (!panel) return;
    if (block.category === "recommended" && !RECOMMENDED_IDS.includes(block.id))
      return;

    const btn = document.createElement("button");
    btn.className = "insert-card";
    btn.setAttribute("data-insert-action", block.id);
    btn.innerHTML = `
            <i data-lucide="${block.icon}" class="w-5 h-5 text-primary"></i>
            <div>
                <div class="font-bold">${escapeHTML(block.name)}</div>
                <div class="text-xs text-on-surface-variant">${escapeHTML(block.description || CATEGORY_MAP[block.category])}</div>
            </div>
        `;
    panel.appendChild(btn);
  });
}

export async function insertBlockById(id) {
  const block = BLOCKS.find((b) => b.id === id);
  if (!block) return false;
  if (typeof block.insert === "function") {
    return !!(await block.insert());
  }
  const rawTemplate = block.template
    ? block.template()
    : baseTemplate(block.name, block.description);
  return insertHtmlAtCursor(ensureWrappedBlock(block.id, rawTemplate));
}

export function hasInsertBlock(id) {
  return BLOCKS.some((b) => b.id === id);
}

export function getInsertBlockSummary() {
  return BLOCKS.map(({ id, name, category }) => ({ id, name, category }));
}
