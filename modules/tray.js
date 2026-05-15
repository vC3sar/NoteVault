// modules/tray.js
// Módulo del proceso principal que gestiona el ícono del System Tray (bandeja del sistema).
// Al cerrar la ventana principal, la app se minimiza aquí discretamente.

const { Tray, Menu, app, nativeImage, shell } = require('electron');
const path = require('path');

let tray = null;
let hasNotified = false;

/**
 * Crea el ícono de la bandeja del sistema y su menú contextual.
 * @param {() => Electron.BrowserWindow} getWindow - Función que retorna la ventana principal.
 */
function createTray(getWindow) {
  if (tray) return; // Evitar duplicados

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

        // Guardar antes de salir definitivamente
        if (win && !win.isDestroyed()) {
          win.webContents.send('app-closing');
        } else {
          app.quit();
        }
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // Clic izquierdo en el ícono del tray → abrir la ventana
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
