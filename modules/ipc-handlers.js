/**
 * modules/ipc-handlers.js — Contratos IPC (proceso principal).
 *
 * Este módulo es la frontera de confianza entre renderer y sistema de archivos.
 * Todas las operaciones sensibles (persistencia, borrado, import/export, menús)
 * deben implementarse aquí para poder validar entradas y controlar permisos.
 *
 * Principios:
 * - No confiar en el renderer: validar ids, normalizar rutas y limitar directorios.
 * - Persistencia atómica para minimizar corrupción ante cierres inesperados.
 * - Mantener las APIs IPC estables; cambios aquí impactan `preload.js` y `js/ipc.js`.
 */

const { ipcMain, Menu, BrowserWindow, app } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const fsp = fs.promises;

/**
 * Registra todos los handlers de IPC del proceso principal.
 * @param {{ DATA_PATH: string, NOTES_DIR: string, COVERS_DIR: string, ATTACHMENTS_DIR: string }} paths
 */
function registerIpcHandlers({ DATA_PATH, NOTES_DIR, COVERS_DIR, ATTACHMENTS_DIR }) {
  const DATA_BACKUP_PATH = `${DATA_PATH}.bak`;

  function normalizePath(input) {
    const raw = String(input ?? '');
    const withoutScheme = raw.startsWith('file:///') ? raw.replace('file:///', '') : raw;
    return path.resolve(decodeURIComponent(withoutScheme.replace(/\//g, path.sep)));
  }

  function isInsideDir(baseDir, candidate) {
    const base = path.resolve(baseDir);
    const target = path.resolve(candidate);
    const relative = path.relative(base, target);
    return !!relative && !relative.startsWith('..') && !path.isAbsolute(relative);
  }

  function sanitizeFileId(id) {
    const safe = String(id ?? '').trim();
    return safe && safe === path.basename(safe) && !safe.includes(path.sep) && !safe.includes('/') && !safe.includes('\\') ? safe : null;
  }

  function sanitizeAttachmentFileName(fileName) {
    const safe = String(fileName ?? '').trim();
    if (!safe || safe !== path.basename(safe)) return null;
    if (safe.includes('/') || safe.includes('\\') || safe.includes('..')) return null;
    return /^[a-zA-Z0-9._-]+$/.test(safe) ? safe : null;
  }

  function normalizeAudioMime(mimeType) {
    return String(mimeType || 'audio/webm')
      .toLowerCase()
      .split(';')[0]
      .trim() || 'audio/webm';
  }

  function audioExtensionForMime(mimeType) {
    const extMap = {
      'audio/webm': '.webm',
      'audio/ogg': '.ogg',
      'audio/mp4': '.m4a',
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav'
    };
    return extMap[normalizeAudioMime(mimeType)] || '.webm';
  }

  function createAudioId() {
    return `aud_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  }

  function getAudioIdFromFileName(fileName) {
    const safe = sanitizeAttachmentFileName(fileName);
    if (!safe) return null;
    return path.basename(safe, path.extname(safe));
  }

  function getAttachmentPath(fileName) {
    const safe = sanitizeAttachmentFileName(fileName);
    if (!safe) return null;
    const filePath = path.join(ATTACHMENTS_DIR, safe);
    return isInsideDir(ATTACHMENTS_DIR, filePath) ? filePath : null;
  }

  function getAudioMetaPathFromId(id) {
    const rawId = String(id ?? '').trim();
    if (!rawId || !/^[a-zA-Z0-9_-]+$/.test(rawId)) return null;
    const safeId = sanitizeAttachmentFileName(`${rawId}.meta.json`);
    if (!safeId) return null;
    return path.join(ATTACHMENTS_DIR, safeId);
  }

  function getRecordingSessionPath(id) {
    const rawId = String(id ?? '').trim();
    if (!rawId || !/^[a-zA-Z0-9_-]+$/.test(rawId)) return null;
    const safeId = sanitizeAttachmentFileName(`${rawId}.recording-session.json`);
    if (!safeId) return null;
    return path.join(ATTACHMENTS_DIR, safeId);
  }

  async function writeJsonAtomicLocal(filePath, data) {
    const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    await fsp.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    try {
      await fsp.rename(tempPath, filePath);
    } catch (error) {
      await fsp.copyFile(tempPath, filePath);
      await fsp.unlink(tempPath).catch(() => {});
    }
  }

  async function readAudioMeta(fileName) {
    const id = getAudioIdFromFileName(fileName);
    if (!id) return null;
    const metaPath = getAudioMetaPathFromId(id);
    if (!metaPath || !(await pathExists(metaPath))) return null;
    return await readJsonFile(metaPath);
  }

  async function buildAttachmentInfo(fileName) {
    const safe = sanitizeAttachmentFileName(fileName);
    const filePath = safe ? getAttachmentPath(safe) : null;
    if (!safe || !filePath) return { success: false, error: 'Invalid attachment file name' };

    const exists = await pathExists(filePath);
    const stat = exists ? await fsp.stat(filePath) : null;
    const meta = await readAudioMeta(safe).catch(() => null);
    return {
      success: true,
      exists,
      url: exists ? pathToFileURL(filePath).href : '',
      fileName: safe,
      sizeBytes: stat ? stat.size : 0,
      meta
    };
  }

  async function readJsonFile(filePath) {
    const content = await fsp.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }

  async function pathExists(filePath) {
    try {
      await fsp.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  async function loadPersistedData() {
    let loadError = '';
    try {
      if (await pathExists(DATA_PATH)) {
        return await readJsonFile(DATA_PATH);
      }
    } catch (error) {
      loadError = error.message;
    }

    try {
      if (await pathExists(DATA_BACKUP_PATH)) {
        const backup = await readJsonFile(DATA_BACKUP_PATH);
        if (loadError) backup.loadError = loadError;
        return backup;
      }
    } catch (error) {
      loadError = loadError || error.message;
    }

    return { notebooks: [], trash: [], settings: {}, profile: {}, calendar: {}, loadError };
  }

  async function writeAtomicJson(filePath, data) {
    const dir = path.dirname(filePath);
    const tempPath = path.join(dir, `${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
    const payload = JSON.stringify(data, null, 2);

    await fsp.writeFile(tempPath, payload, 'utf-8');
    try {
      if (await pathExists(filePath)) {
        await fsp.copyFile(filePath, DATA_BACKUP_PATH);
      }
    } catch (error) {
      // El backup es best-effort: no debe bloquear el guardado principal.
    }

    try {
      await fsp.rename(tempPath, filePath);
    } catch (error) {
      await fsp.copyFile(tempPath, filePath);
      await fsp.unlink(tempPath).catch(() => {});
    }

    await fsp.copyFile(filePath, DATA_BACKUP_PATH).catch(() => {});
  }

  async function safeDeleteInsideDir(baseDir, candidatePath) {
    const resolved = normalizePath(candidatePath);
    if (!isInsideDir(baseDir, resolved)) {
      return { success: false, error: 'Path outside allowed directory' };
    }

    try {
      await fsp.unlink(resolved);
      return { success: true };
    } catch (error) {
      if (error.code === 'ENOENT') return { success: true };
      return { success: false, error: error.message };
    }
  }

  // Persistencia de metadata: estructura de libretas/notas/ajustes (sin HTML completo).

  ipcMain.handle('save-data', async (event, data) => {
    try {
      await writeAtomicJson(DATA_PATH, data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('load-data', async () => {
    try {
      return await loadPersistedData();
    } catch (error) {
      return { notebooks: [], trash: [], settings: {}, profile: {}, calendar: {}, loadError: error.message };
    }
  });

  // Persistencia de contenido: HTML por nota en archivos individuales.

  ipcMain.handle('save-note-content', async (event, { id, content }) => {
    try {
      const safeId = sanitizeFileId(id);
      if (!safeId) return { success: false, error: 'Invalid note id' };
      const filePath = path.join(NOTES_DIR, `${safeId}.html`);
      await fsp.writeFile(filePath, content, 'utf-8');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('load-note-content', async (event, id) => {
    try {
      const safeId = sanitizeFileId(id);
      if (!safeId) return null;
      const filePath = path.join(NOTES_DIR, `${safeId}.html`);
      if (await pathExists(filePath)) {
        return await fsp.readFile(filePath, 'utf-8');
      }
      return null;
    } catch (error) {
      return null;
    }
  });

  ipcMain.handle('delete-note-file', async (event, id) => {
    try {
      const safeId = sanitizeFileId(id);
      if (!safeId) return { success: false, error: 'Invalid note id' };
      const filePath = path.join(NOTES_DIR, `${safeId}.html`);
      if (await pathExists(filePath)) {
        const content = await fsp.readFile(filePath, 'utf-8');
        // Eliminar adjuntos locales referenciados por la nota para evitar orfandad.
        const attachmentRegex = /(src|href)="file:\/\/\/([^"]+attachments\/[^"]+)"/g;
        let match;
        while ((match = attachmentRegex.exec(content)) !== null) {
          const fullPath = normalizePath(match[2]);
          if (isInsideDir(ATTACHMENTS_DIR, fullPath) && await pathExists(fullPath)) {
            await fsp.unlink(fullPath).catch(() => {});
          }
        }
        const portableAttachmentRegex = /data-audio-file="([^"]+)"/g;
        while ((match = portableAttachmentRegex.exec(content)) !== null) {
          const audioPath = getAttachmentPath(match[1]);
          if (audioPath && await pathExists(audioPath)) {
            await fsp.unlink(audioPath).catch(() => {});
            const metaPath = getAudioMetaPathFromId(getAudioIdFromFileName(match[1]));
            if (metaPath) await fsp.unlink(metaPath).catch(() => {});
          }
        }
        await fsp.unlink(filePath);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Portadas de libretas (covers): archivos de imagen administrados por la app.

  ipcMain.handle('upload-cover', async (event, filePath) => {
    try {
      const ext = path.extname(filePath);
      const fileName = `${Date.now()}${ext}`;
      const destPath = path.join(COVERS_DIR, fileName);
      await fsp.copyFile(filePath, destPath);
      return { success: true, path: pathToFileURL(destPath).href };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-cover', async (event, coverPath) => {
    try {
      return await safeDeleteInsideDir(COVERS_DIR, coverPath);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Adjuntos (imágenes pegadas): almacenamiento local para assets dentro de notas.

  ipcMain.handle('save-pasted-image', async (event, { url, base64 }) => {
    try {
      const fileName = `img_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
      const destPath = path.join(ATTACHMENTS_DIR, fileName);

      if (base64) {
        const parts = String(base64).split(',');
        const payload = parts[1] || parts[0] || '';
        const buffer = Buffer.from(payload, 'base64');
        await fsp.writeFile(destPath, buffer);
      } else if (url) {
        if (url.startsWith('file:///')) {
          // Copiar archivo local para que la nota sea autocontenida y no dependa de rutas externas.
          const srcPath = normalizePath(url);
          if (await pathExists(srcPath)) {
            await fsp.copyFile(srcPath, destPath);
            return { success: true, path: pathToFileURL(destPath).href };
          }
        }

        if (!url.startsWith('http')) {
          return { success: false, error: 'Protocol not supported for download' };
        }

        const { net } = require('electron');
        return new Promise((resolve) => {
          try {
            const request = net.request(url);
            request.on('response', (response) => {
              const chunks = [];
              response.on('data', (chunk) => chunks.push(chunk));
              response.on('end', () => {
                const buffer = Buffer.concat(chunks);
                fsp.writeFile(destPath, buffer)
                  .then(() => resolve({ success: true, path: pathToFileURL(destPath).href }))
                  .catch((err) => resolve({ success: false, error: err.message }));
              });
            });
            request.on('error', (err) => resolve({ success: false, error: err.message }));
            request.end();
          } catch (e) {
            resolve({ success: false, error: e.message });
          }
        });
      }

      return { success: true, path: pathToFileURL(destPath).href };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('resolve-attachment-url', async (event, fileName) => {
    try {
      return await buildAttachmentInfo(fileName);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-attachment-metadata', async (event, fileName) => {
    try {
      return await buildAttachmentInfo(fileName);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('begin-recording-session', async (event, data = {}) => {
    try {
      const id = createAudioId();
      const mime = normalizeAudioMime(data.mimeType || 'audio/webm');
      const ext = audioExtensionForMime(mime);
      const fileName = `${id}${ext}`;
      const tempFileName = `${fileName}.part`;
      const tempPath = getAttachmentPath(tempFileName);
      const sessionPath = getRecordingSessionPath(id);
      const startedAt = Number(data.startedAt) || Date.now();
      if (!tempPath || !sessionPath) return { success: false, error: 'Invalid recording session' };

      await fsp.writeFile(tempPath, Buffer.alloc(0));
      const session = {
        schemaVersion: 1,
        appVersion: app.getVersion(),
        id,
        fileName,
        tempFileName,
        originalName: data.originalName || 'Nota de voz',
        mime,
        codec: mime.includes('webm') ? 'opus' : '',
        extension: ext,
        startedAt,
        endedAt: null,
        sizeBytes: 0,
        chunksCount: 0,
        noteId: sanitizeFileId(data.noteId) || '',
        status: 'recording'
      };
      await writeJsonAtomicLocal(sessionPath, session);
      return { success: true, ...session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('append-recording-chunk', async (event, { id, chunk }) => {
    try {
      const sessionPath = getRecordingSessionPath(id);
      if (!sessionPath || !(await pathExists(sessionPath))) {
        return { success: false, error: 'Recording session not found' };
      }
      const session = await readJsonFile(sessionPath);
      const tempPath = getAttachmentPath(session.tempFileName);
      if (!tempPath) return { success: false, error: 'Invalid temp path' };

      const buffer = Buffer.from(chunk);
      if (!buffer.length) return { success: true, sizeBytes: session.sizeBytes || 0, chunksCount: session.chunksCount || 0 };

      await fsp.appendFile(tempPath, buffer);
      const nextSession = {
        ...session,
        sizeBytes: Number(session.sizeBytes || 0) + buffer.length,
        chunksCount: Number(session.chunksCount || 0) + 1,
        lastChunkAt: Date.now()
      };
      await writeJsonAtomicLocal(sessionPath, nextSession);
      return { success: true, sizeBytes: nextSession.sizeBytes, chunksCount: nextSession.chunksCount };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  async function finalizeRecordingSession(id, data = {}, recovered = false) {
    const sessionPath = getRecordingSessionPath(id);
    if (!sessionPath || !(await pathExists(sessionPath))) {
      return { success: false, error: 'Recording session not found' };
    }

    const session = await readJsonFile(sessionPath);
    const tempPath = getAttachmentPath(session.tempFileName);
    const finalPath = getAttachmentPath(session.fileName);
    if (!tempPath || !finalPath || !(await pathExists(tempPath))) {
      return { success: false, error: 'Recording data not found' };
    }

    try {
      await fsp.rename(tempPath, finalPath);
    } catch (error) {
      await fsp.copyFile(tempPath, finalPath);
      await fsp.unlink(tempPath).catch(() => {});
    }

    const stat = await fsp.stat(finalPath);
    const endedAt = Number(data.endedAt) || Date.now();
    const durationMs = Math.max(0, Math.floor(Number(data.durationMs) || (endedAt - Number(session.startedAt || endedAt))));
    const durationSec = Math.max(0, Math.floor(durationMs / 1000));
    const meta = {
      schemaVersion: 1,
      appVersion: app.getVersion(),
      id: session.id,
      fileName: session.fileName,
      originalName: session.originalName || 'Nota de voz',
      mime: normalizeAudioMime(data.mimeType || session.mime),
      codec: session.codec || '',
      extension: session.extension || path.extname(session.fileName),
      durationMs,
      durationSec,
      startedAt: Number(session.startedAt) || 0,
      endedAt,
      sizeBytes: stat.size,
      chunksCount: Number(session.chunksCount || 0),
      waveform: null,
      peaks: null,
      status: recovered ? 'recoverable' : 'ready',
      checksum: '',
      noteId: sanitizeFileId(data.noteId || session.noteId) || '',
      audioDurationSec: Math.max(0, Math.floor(Number(data.audioDurationSec) || 0))
    };

    const metaPath = getAudioMetaPathFromId(session.id);
    if (metaPath) await writeJsonAtomicLocal(metaPath, meta);
    await fsp.unlink(sessionPath).catch(() => {});
    return {
      success: true,
      id: meta.id,
      fileName: meta.fileName,
      path: pathToFileURL(finalPath).href,
      url: pathToFileURL(finalPath).href,
      meta
    };
  }

  ipcMain.handle('finish-recording-session', async (event, { id, ...data } = {}) => {
    try {
      return await finalizeRecordingSession(id, data, false);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('list-recoverable-recordings', async () => {
    try {
      const entries = await fsp.readdir(ATTACHMENTS_DIR);
      const sessions = [];
      for (const entry of entries) {
        if (!entry.endsWith('.recording-session.json')) continue;
        const sessionPath = path.join(ATTACHMENTS_DIR, entry);
        if (!isInsideDir(ATTACHMENTS_DIR, sessionPath)) continue;
        const session = await readJsonFile(sessionPath).catch(() => null);
        if (!session || !session.id || !session.tempFileName) continue;
        const tempPath = getAttachmentPath(session.tempFileName);
        const tempExists = !!(tempPath && await pathExists(tempPath));
        const stat = tempExists ? await fsp.stat(tempPath) : null;
        sessions.push({
          ...session,
          tempExists,
          sizeBytes: stat ? stat.size : Number(session.sizeBytes || 0),
          durationMs: Math.max(0, Date.now() - Number(session.startedAt || Date.now()))
        });
      }
      return { success: true, sessions };
    } catch (error) {
      return { success: false, error: error.message, sessions: [] };
    }
  });

  ipcMain.handle('recover-recording-session', async (event, id) => {
    try {
      return await finalizeRecordingSession(id, { endedAt: Date.now() }, true);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('discard-recording-session', async (event, id) => {
    try {
      const sessionPath = getRecordingSessionPath(id);
      if (!sessionPath || !(await pathExists(sessionPath))) return { success: true };
      const session = await readJsonFile(sessionPath).catch(() => null);
      if (session?.tempFileName) {
        const tempPath = getAttachmentPath(session.tempFileName);
        if (tempPath) await fsp.unlink(tempPath).catch(() => {});
      }
      await fsp.unlink(sessionPath).catch(() => {});
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('save-recorded-audio', async (event, { base64, mimeType, durationSec = 0, noteId = '' }) => {
    try {
      const mime = normalizeAudioMime(mimeType || 'audio/webm');
      const ext = audioExtensionForMime(mime);
      const id = createAudioId();
      const fileName = `${id}${ext}`;
      const destPath = path.join(ATTACHMENTS_DIR, fileName);

      const parts = String(base64 || '').split(',');
      const payload = parts[1] || parts[0] || '';
      if (!payload) return { success: false, error: 'Empty audio payload' };

      const buffer = Buffer.from(payload, 'base64');
      await fsp.writeFile(destPath, buffer);
      const stat = await fsp.stat(destPath);
      const now = Date.now();
      const meta = {
        schemaVersion: 1,
        appVersion: app.getVersion(),
        id,
        fileName,
        originalName: 'Nota de voz',
        mime,
        codec: mime.includes('webm') ? 'opus' : '',
        extension: ext,
        durationMs: Math.max(0, Math.floor(Number(durationSec) || 0) * 1000),
        durationSec: Math.max(0, Math.floor(Number(durationSec) || 0)),
        startedAt: now - Math.max(0, Math.floor(Number(durationSec) || 0) * 1000),
        endedAt: now,
        sizeBytes: stat.size,
        chunksCount: 1,
        waveform: null,
        peaks: null,
        status: 'ready',
        checksum: '',
        noteId: sanitizeFileId(noteId) || ''
      };
      const metaPath = getAudioMetaPathFromId(id);
      if (metaPath) await writeJsonAtomicLocal(metaPath, meta);
      return { success: true, path: pathToFileURL(destPath).href, url: pathToFileURL(destPath).href, fileName, id, meta };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-attachment', async (event, fileUrl) => {
    try {
      const portableName = sanitizeAttachmentFileName(fileUrl);
      const filePath = portableName ? getAttachmentPath(portableName) : normalizePath(fileUrl);
      if (!isInsideDir(ATTACHMENTS_DIR, filePath) || !(await pathExists(filePath))) {
        return { success: false, error: 'Not an attachment or file not found' };
      }

      // Seguridad: escanear notas para evitar borrar un adjunto referenciado por otra nota.
      const notes = await fsp.readdir(NOTES_DIR);
      let isUsed = false;
      for (const noteFile of notes) {
        if (noteFile.endsWith('.html')) {
          const content = await fsp.readFile(path.join(NOTES_DIR, noteFile), 'utf-8');
          if (content.includes(path.basename(filePath))) {
            isUsed = true;
            break;
          }
        }
      }

      if (!isUsed) {
        await fsp.unlink(filePath);
        const metaPath = getAudioMetaPathFromId(getAudioIdFromFileName(path.basename(filePath)));
        if (metaPath) await fsp.unlink(metaPath).catch(() => {});
        return { success: true, deleted: true };
      }

      return { success: true, deleted: false, message: 'File still in use by other notes' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Ciclo de vida: handshake de cierre seguro coordinado desde el proceso principal.

  ipcMain.on('safe-close-ready', () => {
    app.isQuitting = true;
    app.quit();
  });

  // Menús contextuales: se construyen en main para integrarse con el SO y evitar
  // replicar lógica de menús en el renderer.

  ipcMain.on('show-notebook-menu', (event, { id, isFavorite }) => {
    const template = [
      {
        label: isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos',
        click: () => { event.sender.send('notebook-action', { action: 'toggle-favorite', id }); }
      },
      { type: 'separator' },
      {
        label: 'Editar libreta (Nombre o Portada)',
        click: () => { event.sender.send('notebook-action', { action: 'edit', id }); }
      },
      { type: 'separator' },
      {
        label: 'Eliminar libreta',
        click: () => { event.sender.send('notebook-action', { action: 'delete', id }); }
      }
    ];
    const menu = Menu.buildFromTemplate(template);
    menu.popup(BrowserWindow.fromWebContents(event.sender));
  });

  ipcMain.on('show-note-menu', (event, { id, isPinned }) => {
    const template = [
      {
        label: isPinned ? 'Desfijar de arriba' : 'Fijar arriba',
        click: () => { event.sender.send('note-action', { action: 'pin', id }); }
      },
      {
        label: 'Clonar nota',
        click: () => { event.sender.send('note-action', { action: 'clone', id }); }
      },
      { type: 'separator' },
      {
        label: 'Eliminar nota',
        click: () => { event.sender.send('note-action', { action: 'delete', id }); }
      }
    ];
    const menu = Menu.buildFromTemplate(template);
    menu.popup(BrowserWindow.fromWebContents(event.sender));
  });

  ipcMain.on('show-edit-menu', (event) => {
    const template = [
      { label: 'Negrita', click: () => event.sender.send('edit-action', 'bold') },
      { label: 'Cursiva', click: () => event.sender.send('edit-action', 'italic') },
      { label: 'Subrayado', click: () => event.sender.send('edit-action', 'underline') },
      { label: 'Tachado', click: () => event.sender.send('edit-action', 'strikethrough') },
      { type: 'separator' },
      {
        label: 'Tamaño de fuente',
        submenu: [
          { label: 'Pequeño (12px)', click: () => event.sender.send('edit-action', { command: 'fontSize', value: '12px' }) },
          { label: 'Normal (18px)', click: () => event.sender.send('edit-action', { command: 'fontSize', value: '18px' }) },
          { label: 'Mediano (20px)', click: () => event.sender.send('edit-action', { command: 'fontSize', value: '20px' }) },
          { label: 'Grande (28px)', click: () => event.sender.send('edit-action', { command: 'fontSize', value: '28px' }) },
          { label: 'Muy grande (36px)', click: () => event.sender.send('edit-action', { command: 'fontSize', value: '36px' }) },
        ]
      },
      {
        label: 'Resaltar texto',
        submenu: [
          { label: '🟡 Amarillo', click: () => event.sender.send('edit-action', { command: 'highlight', value: 'yellow' }) },
          { label: '🟢 Verde', click: () => event.sender.send('edit-action', { command: 'highlight', value: 'green' }) },
          { label: '🔵 Azul', click: () => event.sender.send('edit-action', { command: 'highlight', value: 'blue' }) },
          { label: '🔴 Rojo', click: () => event.sender.send('edit-action', { command: 'highlight', value: 'red' }) },
          { label: '⬜ Quitar resaltado', click: () => event.sender.send('edit-action', { command: 'highlight', value: 'none' }) },
        ]
      },
      { type: 'separator' },
      {
        label: 'Color de texto',
        submenu: [
          { label: 'Rojo', click: () => event.sender.send('edit-action', { command: 'foreColor', value: '#e74c3c' }) },
          { label: 'Azul', click: () => event.sender.send('edit-action', { command: 'foreColor', value: '#2383e2' }) },
          { label: 'Verde', click: () => event.sender.send('edit-action', { command: 'foreColor', value: '#2ecc71' }) },
          { label: 'Naranja', click: () => event.sender.send('edit-action', { command: 'foreColor', value: '#f39c12' }) },
          { label: 'Morado', click: () => event.sender.send('edit-action', { command: 'foreColor', value: '#9b59b6' }) },
          { type: 'separator' },
          { label: 'Predeterminado (quitar color)', click: () => event.sender.send('edit-action', { command: 'removeColor' }) }
        ]
      },
      { type: 'separator' },
      { label: '🧹 Limpiar todo el formato', click: () => event.sender.send('edit-action', 'removeFormat') }
    ];
    const menu = Menu.buildFromTemplate(template);
    menu.popup(BrowserWindow.fromWebContents(event.sender));
  });

  ipcMain.on('show-image-menu', (event) => {
    const template = [
      { label: 'Imagen Pequeña (25%)', click: () => event.sender.send('image-action', '25%') },
      { label: 'Imagen Mediana (50%)', click: () => event.sender.send('image-action', '50%') },
      { label: 'Imagen Grande (75%)', click: () => event.sender.send('image-action', '75%') },
      { label: 'Tamaño Original (100%)', click: () => event.sender.send('image-action', '100%') },
      { type: 'separator' },
      { label: 'Centrar Imagen', click: () => event.sender.send('image-action', 'center') },
      { label: 'Alinear a la izquierda', click: () => event.sender.send('image-action', 'left') },
      { type: 'separator' },
      { label: 'Eliminar Imagen', click: () => event.sender.send('image-action', 'delete') }
    ];
    const menu = Menu.buildFromTemplate(template);
    menu.popup(BrowserWindow.fromWebContents(event.sender));
  });
}

module.exports = { registerIpcHandlers };
