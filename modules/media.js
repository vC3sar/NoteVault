// src/main/media.js
// Módulo del proceso principal encargado del control de medios (win-media-control).
// No importar desde /js/ — ese es el proceso de renderizado.

const { ipcMain } = require('electron');

let mediaControl = null;

/**
 * Inicializa el módulo de media.
 * @param {() => Electron.BrowserWindow} getWindow - Getter que devuelve la mainWindow activa.
 */
function initMedia(getWindow) {
  import('win-media-control')
    .then(module => {
      mediaControl = module;
    })
    .catch(e => {
      console.error('win-media-control not available', e);
    });

  // Eventos IPC de control de medios
  ipcMain.on('media-toggle', async () => {
    if (mediaControl) {
      await mediaControl.togglePlayPause();
      setTimeout(() => checkMedia(getWindow), 500);
    }
  });

  ipcMain.on('media-next', async () => {
    if (mediaControl) {
      await mediaControl.next();
      setTimeout(() => checkMedia(getWindow), 500);
    }
  });

  ipcMain.on('media-prev', async () => {
    if (mediaControl) {
      await mediaControl.previous();
      setTimeout(() => checkMedia(getWindow), 500);
    }
  });

  ipcMain.on('media-check-now', () => {
    checkMedia(getWindow);
  });
}

/**
 * Consulta las sesiones de media activas y envía el estado al renderer.
 * @param {() => Electron.BrowserWindow} getWindow
 */
function checkMedia(getWindow) {
  const win = getWindow();
  if (!mediaControl || !win || win.isDestroyed()) return;

  mediaControl.listSessions()
    .then(sessions => {
      if (!sessions || sessions.length === 0) {
        win.webContents.send('media-update', null);
        return;
      }
      const active = sessions.find(s => s.playbackStatus === 'Playing') || sessions[0];
      win.webContents.send('media-update', active);
    })
    .catch(err => {
      console.error('Media error:', err);
    });
}

module.exports = { initMedia, checkMedia };
