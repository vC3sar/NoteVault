/**
 * main.js — Bootstrap del proceso principal (Electron).
 *
 * Responsabilidades:
 * - Configurar identidad de la app y políticas globales del proceso principal.
 * - Definir rutas de almacenamiento en `app.getPath('userData')` y asegurar directorios.
 * - Registrar contratos IPC (handlers) que consumirá el renderer vía `preload.js`.
 * - Crear la ventana principal y cablear integraciones del SO (menú, media, tray).
 *
 * Arquitectura (alto nivel):
 * - Proceso principal: orquesta ventanas, sistema de archivos y APIs nativas.
 * - Renderer: UI y lógica de producto (carpeta `js/`), sin acceso directo a Node.
 * - Bridge: `preload.js` expone un API mínimo y tipado informal vía `contextBridge`.
 *
 * Nota: Evitar importar módulos de `js/` desde el proceso principal. Son dos entornos
 * con modelos de seguridad y dependencias distintas.
 */

const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const { createWindow } = require('./modules/window');
const { setupMenu } = require('./modules/menu');
const { registerIpcHandlers } = require('./modules/ipc-handlers');
const { initMedia, checkMedia } = require('./modules/media');

const debug = !app.isPackaged;

// Identidad de aplicación (Windows) y nombre visible.
app.setAppUserModelId('ovh.vazquezsg.NoteVault');
app.name = 'NoteVault';

// Directorios persistentes por usuario. `userData` es la fuente de verdad en runtime.
const DATA_PATH = path.join(app.getPath('userData'), 'notes_data.json');
const NOTES_DIR = path.join(app.getPath('userData'), 'notes');
const COVERS_DIR = path.join(app.getPath('userData'), 'covers');
const ATTACHMENTS_DIR = path.join(app.getPath('userData'), 'attachments');

// Crear directorios de forma idempotente para evitar errores en el primer arranque.
[NOTES_DIR, COVERS_DIR, ATTACHMENTS_DIR].forEach(d => {
  fs.mkdirSync(d, { recursive: true });
});

// Registrar handlers IPC antes de abrir la ventana para evitar condiciones de carrera.
registerIpcHandlers({ DATA_PATH, NOTES_DIR, COVERS_DIR, ATTACHMENTS_DIR });

// En Windows/macOS es común forzar instancia única para evitar corrupción de datos.
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

    // Preferencia de idioma del corrector ortográfico para el renderer.
    if (mainWindow.webContents.session) {
      mainWindow.webContents.session.setSpellCheckerLanguages(['es']);
    }
  });
}
