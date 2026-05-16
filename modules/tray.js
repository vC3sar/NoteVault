/**
 * modules/tray.js — Bandeja del sistema (proceso principal).
 *
 * Responsabilidades:
 * - Mantener un punto de entrada persistente cuando la ventana se oculta.
 * - Exponer acciones críticas (abrir, salir) y enlaces externos de soporte.
 *
 * Notas:
 * - `app.isQuitting` es el flag que indica cierre real (no sólo ocultar ventana).
 * - El "Salir" inicia un cierre ordenado: el renderer persiste y luego confirma.
 */

const { Tray, Menu, app, nativeImage, shell } = require('electron');
const path = require('path');

let tray = null;
let hasNotified = false;

/**
 * Crea el ícono de la bandeja del sistema y su menú contextual.
 * @param {() => Electron.BrowserWindow} getWindow - Función que retorna la ventana principal.
 */
function createTray(getWindow) {
  // Idempotencia: Electron permite múltiples instancias de Tray si no se controla.
  if (tray) return;

  const iconPath = path.join(__dirname, '..', 'img', 'logo.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });

  tray = new Tray(icon);
  tray.setToolTip('NoteVault');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir NoteVault',
      click: () => {
        const win = getWindow();
        if (win) {
          if (win.isMinimized()) win.restore();
          win.show();
          win.focus();
        }
      }
    },
    { label: 'Visitar pagina', click: () => { shell.openExternal('https://luismi0001.github.io/NoteVault/') } },
    { type: 'separator' },
    {
      label: 'Salir',
      click: () => {
        const win = getWindow();
        app.isQuitting = true;

        // Cierre ordenado: el renderer guarda y luego envía `safe-close-ready`.
        if (win && !win.isDestroyed()) {
          win.webContents.send('app-closing');
        } else {
          app.quit();
        }
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // Click en el ícono del tray: restaurar foco/visibilidad.
  tray.on('click', () => {
    const win = getWindow();
    if (win) {
      if (win.isMinimized() || !win.isVisible()) {
        win.show();
        win.focus();
      } else {
        win.focus();
      }
    }
  });
}

/**
 * Destruye el ícono del tray al salir completamente.
 */
function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

/**
 * Muestra un aviso la primera vez que se oculta la app en la sesión actual.
 */
function notifyMinimized() {
  if (hasNotified || !tray) return;

  tray.displayBalloon({
    title: 'NoteVault sigue activo',
    content: 'La aplicación se ha minimizado al tray para un acceso más rápido.',
    iconType: 'info'
  });

  hasNotified = true;
}

module.exports = { createTray, destroyTray, notifyMinimized };
