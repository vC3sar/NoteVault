/**
 * preload.js — Bridge seguro entre renderer y proceso principal.
 *
 * Principios:
 * - `contextIsolation` está habilitado: el renderer no tiene acceso a Node.js.
 * - El único canal permitido hacia el proceso principal es este objeto `window.api`.
 * - Mantener esta superficie pequeña, estable y explícita para reducir riesgos.
 *
 * Contrato:
 * - `ipcRenderer.invoke(...)` se usa para operaciones request/response (persistencia).
 * - `ipcRenderer.send(...)` se usa para comandos de una vía (menús/controles).
 * - `ipcRenderer.on(...)` define eventos que el proceso principal emite al renderer.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Persistencia de metadata (estructura de libretas/notas/ajustes). El contenido
    // HTML completo de cada nota vive en archivos separados en disco.
    saveData: (data) => ipcRenderer.invoke('save-data', data),
    loadData: () => ipcRenderer.invoke('load-data'),

    // Persistencia del contenido HTML por nota.
    saveNoteContent: (id, content) => ipcRenderer.invoke('save-note-content', { id, content }),
    loadNote: (id) => ipcRenderer.invoke('load-note-content', id),

    // Assets asociados a libretas y notas.
    uploadCover: (path) => ipcRenderer.invoke('upload-cover', path),
    savePastedImage: (data) => ipcRenderer.invoke('save-pasted-image', data),
    saveRecordedAudio: (data) => ipcRenderer.invoke('save-recorded-audio', data),
    beginRecordingSession: (data) => ipcRenderer.invoke('begin-recording-session', data),
    appendRecordingChunk: (data) => ipcRenderer.invoke('append-recording-chunk', data),
    finishRecordingSession: (data) => ipcRenderer.invoke('finish-recording-session', data),
    listRecoverableRecordings: () => ipcRenderer.invoke('list-recoverable-recordings'),
    recoverRecordingSession: (id) => ipcRenderer.invoke('recover-recording-session', id),
    discardRecordingSession: (id) => ipcRenderer.invoke('discard-recording-session', id),
    resolveAttachmentUrl: (fileName) => ipcRenderer.invoke('resolve-attachment-url', fileName),
    getAttachmentMetadata: (fileName) => ipcRenderer.invoke('get-attachment-metadata', fileName),
    deleteAttachment: (url) => ipcRenderer.invoke('delete-attachment', url),
    deleteCover: (path) => ipcRenderer.invoke('delete-cover', path),
    deleteNoteFile: (id) => ipcRenderer.invoke('delete-note-file', id),

    // Menús contextuales definidos en el proceso principal para integrarse con el SO.
    showNotebookMenu: (data) => ipcRenderer.send('show-notebook-menu', data),
    onNotebookAction: (callback) => ipcRenderer.on('notebook-action', (_event, data) => callback(data)),
    showNoteMenu: (data) => ipcRenderer.send('show-note-menu', data),
    onNoteAction: (callback) => ipcRenderer.on('note-action', (_event, data) => callback(data)),

    // Menú de formato/edición (comandos sobre el editor rich-text del renderer).
    showEditMenu: () => ipcRenderer.send('show-edit-menu'),
    onEditAction: (callback) => ipcRenderer.on('edit-action', (_event, data) => callback(data)),
    showImageMenu: (data) => ipcRenderer.send('show-image-menu', data),
    onImageAction: (callback) => ipcRenderer.on('image-action', (_event, data) => callback(data)),

    // Handshake de cierre seguro: el proceso principal solicita persistencia y espera
    // confirmación explícita antes de terminar.
    onAppClosing: (callback) => ipcRenderer.on('app-closing', () => callback()),
    onForceSave: (callback) => ipcRenderer.on('force-save', () => callback()),
    sendSafeCloseReady: () => ipcRenderer.send('safe-close-ready'),

    // Integración con Media Session (Windows): el proceso principal detecta sesiones y
    // el renderer decide si muestra el panel de media.
    onMediaUpdate: (callback) => ipcRenderer.on('media-update', (_event, data) => callback(data)),
    mediaToggle: () => ipcRenderer.send('media-toggle'),
    mediaNext: () => ipcRenderer.send('media-next'),
    mediaPrev: () => ipcRenderer.send('media-prev'),
    checkMediaNow: () => ipcRenderer.send('media-check-now'),

    // Acciones disparadas desde el menú nativo (barra superior / atajos).
    onMenuAction: (callback) => ipcRenderer.on('menu-action', (_event, action) => callback(action))
});

contextBridge.exposeInMainWorld('noteVault', {
    resolveAttachmentUrl: (fileName) => ipcRenderer.invoke('resolve-attachment-url', fileName),
    getAttachmentMetadata: (fileName) => ipcRenderer.invoke('get-attachment-metadata', fileName)
});
