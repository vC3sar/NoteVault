import { state, saveAll } from "../state.js";
import { cleanHTML, showToast } from "../utils.js";
import { getEditor, insertHtmlAtCursor } from "./editor-dom.js";
import { buildVoiceNoteHtml, initVoiceNotePlayers } from "./voice-note.js";
import { formatBytes, formatClock, sanitizeDurationSec, verr } from "./shared.js";

async function appendVoiceNoteHtmlToNote(noteId, html) {
  if (!noteId || !html) return false;
  const current = await window.api.loadNote(noteId).catch(() => null);
  const nextContent = cleanHTML(`${current || ""}${html}`);
  const saved = await window.api.saveNoteContent(noteId, nextContent);
  if (!saved || !saved.success) return false;

  for (const notebook of state.notebooks || []) {
    const note = Array.isArray(notebook.notes) ? notebook.notes.find((n) => n.id === noteId) : null;
    if (note) {
      note.content = nextContent;
      note.lastEdited = Date.now();
      await saveAll();
      break;
    }
  }
  return true;
}

export async function checkRecoverableRecordings() {
  if (!window.api?.listRecoverableRecordings) return;
  const res = await window.api.listRecoverableRecordings();
  const sessions = Array.isArray(res?.sessions)
    ? res.sessions.filter((session) => session.tempExists && Number(session.sizeBytes || 0) > 0)
    : [];
  if (!sessions.length) return;

  const shouldRecover = window.confirm(
    `NoteVault encontró ${sessions.length} grabación(es) incompleta(s). ¿Quieres intentar recuperarlas?`,
  );

  for (const session of sessions) {
    if (!shouldRecover) {
      await window.api.discardRecordingSession(session.id);
      continue;
    }
    const recovered = await window.api.recoverRecordingSession(session.id);
    if (!recovered?.success || !recovered.meta) {
      showToast("No se pudo recuperar una grabación.", "error");
      continue;
    }
    const html = buildVoiceNoteHtml({ ...recovered.meta, status: "recoverable" });
    if (state.activeNoteId && state.activeNoteId === recovered.meta.noteId) {
      insertHtmlAtCursor(html);
      const editor = getEditor();
      if (editor) initVoiceNotePlayers(editor);
      continue;
    }
    if (recovered.meta.noteId) {
      const appended = await appendVoiceNoteHtmlToNote(recovered.meta.noteId, html);
      showToast(appended ? "Grabación recuperada en su nota." : "Grabación recuperada en adjuntos.", appended ? "success" : "neutral");
    } else {
      showToast("Grabación recuperada en adjuntos.", "neutral");
    }
  }
}

function pickRecorderMimeType() {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4",
    "audio/mpeg",
  ];
  return candidates.find((mime) => MediaRecorder.isTypeSupported(mime)) || "";
}

function createRecorderPanel() {
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
  return panel;
}

export async function recordAudioFromMic() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    showToast("Tu entorno no soporta grabación de micrófono.", "error");
    return null;
  }
  if (!window.api?.beginRecordingSession || !window.api?.appendRecordingChunk || !window.api?.finishRecordingSession) {
    showToast("La API de grabación no está disponible.", "error");
    return null;
  }

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    showToast("No se pudo acceder al micrófono.", "error");
    return null;
  }

  const selectedMimeType = pickRecorderMimeType();
  let recorder;
  try {
    recorder = selectedMimeType
      ? new MediaRecorder(stream, { mimeType: selectedMimeType })
      : new MediaRecorder(stream);
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop());
    showToast("No se pudo iniciar MediaRecorder.", "error");
    return null;
  }

  const panel = createRecorderPanel();
  const startBtn = panel.querySelector("#rec-start");
  const stopBtn = panel.querySelector("#rec-stop");
  const closeBtn = panel.querySelector("#rec-close");
  const recDot = panel.querySelector("#rec-dot");
  const recStatus = panel.querySelector("#rec-status");
  const recTimer = panel.querySelector("#rec-timer");

  let startedAt = 0;
  let endedAt = 0;
  let timerId = null;
  let session = null;
  let chunkWriteChain = Promise.resolve();
  let chunksCount = 0;
  let totalBytes = 0;
  let chunkWriteFailed = false;
  let resolved = false;

  const cleanup = () => {
    if (timerId) clearInterval(timerId);
    stream.getTracks().forEach((track) => track.stop());
    panel.remove();
  };

  const resolveOnce = (resolve, value) => {
    if (resolved) return;
    resolved = true;
    cleanup();
    resolve(value);
  };

  recorder.ondataavailable = (event) => {
    if (!session || !event.data || event.data.size <= 0) return;
    const blob = event.data;
    chunkWriteChain = chunkWriteChain.then(async () => {
      const buffer = await blob.arrayBuffer();
      const res = await window.api.appendRecordingChunk({ id: session.id, chunk: buffer });
      if (!res || !res.success) throw new Error(res?.error || "No se pudo escribir chunk de audio");
      chunksCount = Number(res.chunksCount || chunksCount + 1);
      totalBytes = Number(res.sizeBytes || totalBytes + blob.size);
      recStatus.textContent = `Grabando... guardado seguro (${formatBytes(totalBytes) || "0 B"})`;
    }).catch((error) => {
      chunkWriteFailed = true;
      verr("append recording chunk failed", error);
      recStatus.textContent = "Error guardando el audio. Se intentará recuperar.";
      recDot.classList.remove("bg-red-500", "animate-pulse");
      recDot.classList.add("bg-amber-500");
    });
  };

  return new Promise((resolve) => {
    startBtn.onclick = async () => {
      startBtn.disabled = true;
      startedAt = Date.now();
      const begin = await window.api.beginRecordingSession({
        mimeType: recorder.mimeType || selectedMimeType || "audio/webm",
        startedAt,
        noteId: state.activeNoteId || "",
        originalName: "Nota de voz",
      });
      if (!begin || !begin.success) {
        showToast("No se pudo preparar el archivo de audio.", "error");
        resolveOnce(resolve, null);
        return;
      }

      session = begin;
      chunksCount = 0;
      totalBytes = 0;

      try {
        recorder.start(5000);
      } catch (error) {
        await window.api.discardRecordingSession(session.id).catch(() => {});
        showToast("No se pudo iniciar la grabación.", "error");
        resolveOnce(resolve, null);
        return;
      }

      recStatus.textContent = "Grabando...";
      recDot.classList.remove("bg-slate-400");
      recDot.classList.add("bg-red-500", "animate-pulse");
      stopBtn.disabled = false;
      timerId = setInterval(() => {
        const elapsedSec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
        recTimer.textContent = formatClock(elapsedSec);
      }, 250);
    };

    stopBtn.onclick = () => {
      endedAt = Date.now();
      try {
        if (recorder.state === "recording") recorder.requestData();
      } catch (_) {}
      if (recorder.state === "recording") recorder.stop();
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
      recStatus.textContent = "Cerrando archivo y guardando metadata...";
      recDot.classList.remove("animate-pulse", "bg-red-500");
      recDot.classList.add("bg-amber-500");
      stopBtn.disabled = true;
    };

    closeBtn.onclick = () => {
      if (recorder.state === "recording") {
        endedAt = Date.now();
        recStatus.textContent = "Deteniendo y guardando...";
        try {
          recorder.requestData();
        } catch (_) {}
        recorder.stop();
        return;
      }
      if (session) window.api.discardRecordingSession(session.id).catch(() => {});
      resolveOnce(resolve, null);
    };

    recorder.onstop = async () => {
      if (!session) {
        resolveOnce(resolve, null);
        return;
      }
      try {
        endedAt = endedAt || Date.now();
        await chunkWriteChain;
        if (chunkWriteFailed) {
          showToast("La grabación quedó como recuperable.", "error");
          resolveOnce(resolve, null);
          return;
        }
        if (chunksCount <= 0 && totalBytes <= 0) {
          await window.api.discardRecordingSession(session.id).catch(() => {});
          resolveOnce(resolve, null);
          return;
        }
        const durationMs = Math.max(0, endedAt - startedAt);
        const res = await window.api.finishRecordingSession({
          id: session.id,
          endedAt,
          durationMs,
          noteId: state.activeNoteId || session.noteId || "",
          mimeType: recorder.mimeType || selectedMimeType || session.mime || "audio/webm",
        });
        if (!res || !res.success) throw new Error(res?.error || "No se pudo finalizar la grabación");
        resolveOnce(resolve, {
          ...res,
          mimeType: res.meta?.mime || recorder.mimeType || selectedMimeType || "audio/webm",
          durationSec: sanitizeDurationSec(res.meta?.durationSec || Math.floor(durationMs / 1000)),
        });
      } catch (error) {
        verr("finish recording failed", error);
        showToast("La grabación quedó como recuperable.", "error");
        resolveOnce(resolve, null);
      }
    };
  });
}
