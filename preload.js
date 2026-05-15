const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    saveData: (data) => ipcRenderer.invoke('save-data', data),
    loadData: () => ipcRenderer.invoke('load-data'),
    saveNoteContent: (id, content) => ipcRenderer.invoke('save-note-content', { id, content }),
    loadNote: (id) => ipcRenderer.invoke('load-note-content', id),
    uploadCover: (path) => ipcRenderer.invoke('upload-cover', path),
    // Nuevas funciones de menú y borrado
    showNotebookMenu: (data) => ipcRenderer.send('show-notebook-menu', data),
    onNotebookAction: (callback) => ipcRenderer.on('notebook-action', (event, data) => callback(data)),

    // Funciones de menú y control de Notas
    showNoteMenu: (data) => ipcRenderer.send('show-note-menu', data),
    onNoteAction: (callback) => ipcRenderer.on('note-action', (event, data) => callback(data)),

    deleteNoteFile: (id) => ipcRenderer.invoke('delete-note-file', id),
    deleteCover: (path) => ipcRenderer.invoke('delete-cover', path),
    showEditMenu: () => ipcRenderer.send('show-edit-menu'),
    onEditAction: (callback) => ipcRenderer.on('edit-action', (event, data) => callback(data)),

    // Sistema local de cerrado anti pérdidas
    onAppClosing: (callback) => ipcRenderer.on('app-closing', () => callback()),
    onForceSave: (callback) => ipcRenderer.on('force-save', () => callback()),
    sendSafeCloseReady: () => ipcRenderer.send('safe-close-ready'),

    // Spotify / Media Player Integration
    onMediaUpdate: (callback) => ipcRenderer.on('media-update', (event, data) => callback(data)),
    mediaToggle: () => ipcRenderer.send('media-toggle'),
    mediaNext: () => ipcRenderer.send('media-next'),
    mediaPrev: () => ipcRenderer.send('media-prev'),
    checkMediaNow: () => ipcRenderer.send('media-check-now'),
    savePastedImage: (data) => ipcRenderer.invoke('save-pasted-image', data),
    deleteAttachment: (url) => ipcRenderer.invoke('delete-attachment', url),
    showImageMenu: () => ipcRenderer.send('show-image-menu'),
    onImageAction: (callback) => ipcRenderer.on('image-action', (event, data) => callback(data)),
    onMenuAction: (callback) => ipcRenderer.on('menu-action', (event, action) => callback(action))
});