// ─────────────────────────────────────────────────────────────────────────────
// main.js — Punto de entrada del proceso principal de Electron (NoteVault)
// Los módulos del proceso principal están en ./modules/
// Los archivos de /js/ pertenecen al proceso de renderizado (browser) — no mezclar
// ─────────────────────────────────────────────────────────────────────────────

const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const { createWindow } = require('./modules/window');
const { setupMenu } = require('./modules/menu');
const { registerIpcHandlers } = require('./modules/ipc-handlers');
const { initMedia, checkMedia } = require('./modules/media');

const debug = !app.isPackaged;

// ── Configuración de identidad ─────────────────────────────────────────────
app.setAppUserModelId('ovh.vazquezsg.NoteVault');
app.name = 'NoteVault';

// ── Rutas de datos de usuario ──────────────────────────────────────────────
const DATA_PATH = path.join(app.getPath('userData'), 'notes_data.json');
const NOTES_DIR = path.join(app.getPath('userData'), 'notes');
const COVERS_DIR = path.join(app.getPath('userData'), 'covers');
const ATTACHMENTS_DIR = path.join(app.getPath('userData'), 'attachments');

// Asegurar que existan los directorios
[NOTES_DIR, COVERS_DIR, ATTACHMENTS_DIR].forEach(d => {
  fs.mkdirSync(d, { recursive: true });
});

// ── Registro de handlers IPC ───────────────────────────────────────────────
registerIpcHandlers({ DATA_PATH, NOTES_DIR, COVERS_DIR, ATTACHMENTS_DIR });

// ── Instancia única ────────────────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  let mainWindow = null;

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    mainWindow = createWindow(debug, checkMedia);
    setupMenu(mainWindow, debug);
    initMedia(() => mainWindow);

    // Configurar el idioma del corrector ortográfico (Español)
    if (mainWindow.webContents.session) {
      mainWindow.webContents.session.setSpellCheckerLanguages(['es']);
    }
  });
}
