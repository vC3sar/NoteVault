/**
 * modules/media.js — Control de media sessions (proceso principal).
 *
 * Responsabilidades:
 * - Encapsular integración con Windows Media Session API (vía win-media-control-enhanced).
 * - Exponer comandos (play/pause/next/previous) por IPC para ser invocados desde UI.
 * - Publicar snapshots periódicos al renderer para renderizar el mini-player.
 *
 * Diseño:
 * - La dependencia se carga dinámicamente para no romper la app en entornos donde
 *   la API no esté disponible o falle por permisos/implementación.
 */

const { ipcMain } = require('electron');

let mediaControl = null;
let ipcRegistered = false;

/**
 * Inicializa el módulo de media.
 * @param {() => Electron.BrowserWindow} getWindow - Getter que devuelve la mainWindow activa.
 */
function initMedia(getWindow) {
  import('win-media-control-enhanced')
    .then(module => {
      mediaControl = module?.default ?? module;
    })
    .catch(e => {
      console.error('win-media-control-enhanced not available', e);
    });

  if (!ipcRegistered) {
    ipcRegistered = true;

    // Comandos de control de media emitidos desde el renderer.
    ipcMain.on('media-toggle', async () => {
      if (!mediaControl) return;

      if (mediaControl.togglePlayPause) {
        await mediaControl.togglePlayPause();
      } else if (mediaControl.listSessions && mediaControl.play && mediaControl.pause) {
        const sessions = await mediaControl.listSessions();
        const active = (sessions || []).find(s => s.playbackStatus === 'Playing') || (sessions || [])[0];
        if (active?.playbackStatus === 'Playing') {
          await mediaControl.pause();
        } else {
          await mediaControl.play();
        }
      }

      setTimeout(() => checkMedia(getWindow), 500);
    });

    ipcMain.on('media-next', async () => {
      if (mediaControl?.next) {
        await mediaControl.next();
        setTimeout(() => checkMedia(getWindow), 500);
      }
    });

    ipcMain.on('media-prev', async () => {
      if (mediaControl?.previous) {
        await mediaControl.previous();
        setTimeout(() => checkMedia(getWindow), 500);
      }
    });

    ipcMain.on('media-check-now', () => {
      checkMedia(getWindow);
    });
  }
}

/**
 * Consulta las sesiones de media activas y envía el estado al renderer.
 * @param {() => Electron.BrowserWindow} getWindow
 */
function checkMedia(getWindow) {
  const win = getWindow();
  if (!mediaControl || !win || win.isDestroyed()) return;

  if (!mediaControl.listSessions) return;

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
