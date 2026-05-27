/**
 * modules/window.js — Ventana principal (proceso principal).
 *
 * Responsabilidades:
 * - Crear la `BrowserWindow` con settings de seguridad (preload, isolation, etc.).
 * - Gestionar ciclo de vida (ready-to-show, close/closed) y comportamiento de minimizar al tray.
 * - Proveer UX nativa: menú contextual con sugerencias de ortografía del sistema.
 *
 * Contratos:
 * - El renderer nunca debe asumir que la ventana se destruye al cerrar; por defecto se oculta.
 * - El polling de media se inyecta como callback para mantener este módulo desacoplado.
 */

const { BrowserWindow, Menu, MenuItem, dialog } = require('electron');
const path = require('path');
const { createTray, destroyTray, notifyMinimized } = require('./tray');

let mainWindow = null;
let mediaPollInterval = null;
const APP_ICON = path.join(__dirname, '..', 'img', 'logo.ico');

/**
 * Crea y configura la ventana principal de la aplicación.
 * @param {boolean} debug - Si es true, la ventana no se maximiza automáticamente.
 * @param {() => void} checkMedia - Callback para el polling de media.
 * @returns {Electron.BrowserWindow}
 */
function createWindow(debug, checkMedia) {
  const debugLogs = debug || process.env.NOTEVAULT_DEBUG === '1';
  const wlog = (...args) => { if (debugLogs) console.log('[WINDOW]', ...args); };
  const werr = (...args) => { if (debugLogs) console.error('[WINDOW]', ...args); };

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    backgroundColor: '#111111',
    icon: APP_ICON,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true
    }
  });

  // Menú contextual del sistema: sugerencias del corrector y acciones de edición.
  mainWindow.webContents.on('context-menu', (event, params) => {
    const menu = new Menu();

    // Sugerencias del diccionario del sistema.
    for (const suggestion of params.dictionarySuggestions) {
      menu.append(new MenuItem({
        label: suggestion,
        click: () => mainWindow.webContents.replaceMisspelling(suggestion)
      }));
    }

    // Permitir añadir palabras al diccionario del usuario.
    if (params.misspelledWord) {
      menu.append(
        new MenuItem({
          label: 'Añadir al diccionario',
          click: () => mainWindow.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
        })
      );
      menu.append(new MenuItem({ type: 'separator' }));
    }

    // Separador visual cuando hay contenido específico del corrector.
    if (params.dictionarySuggestions.length > 0 || params.misspelledWord) {
      menu.append(new MenuItem({ type: 'separator' }));
    }

    // Acciones estándar de edición (delegadas al renderer por roles nativos).
    menu.append(new MenuItem({ role: 'undo', label: 'Deshacer' }));
    menu.append(new MenuItem({ role: 'redo', label: 'Rehacer' }));
    menu.append(new MenuItem({ type: 'separator' }));
    menu.append(new MenuItem({ role: 'cut', label: 'Cortar' }));
    menu.append(new MenuItem({ role: 'copy', label: 'Copiar' }));
    menu.append(new MenuItem({ role: 'paste', label: 'Pegar' }));
    menu.append(new MenuItem({ type: 'separator' }));
    menu.append(new MenuItem({ role: 'selectAll', label: 'Seleccionar todo' }));

    menu.popup();
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
  wlog('loadFile(index.html)');

  // Mostrar la ventana sólo cuando el renderer esté listo para evitar parpadeos.
  mainWindow.once('ready-to-show', () => {
    wlog('ready-to-show');
    if (!debug) mainWindow.maximize();
    mainWindow.show();
    mainWindow.focus();
    // Iniciar el tray una vez que la ventana esté lista.
    createTray(() => mainWindow);
  });

  // Polling de media: se mantiene aquí para no cargar al renderer con lógica del SO.
  if (typeof checkMedia === 'function') {
    mediaPollInterval = setInterval(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        checkMedia(() => mainWindow);
      }
    }, 2000);
  }

  // Comportamiento de "cerrar" (X): ocultar al tray en vez de destruir la ventana.
  // El cierre definitivo se gestiona desde el menú/tray con handshake de persistencia.
  mainWindow.on('close', (e) => {
    wlog('close event');
    const { app } = require('electron');
    if (!app.isQuitting) {
      e.preventDefault();
      // Solicitar persistencia al renderer antes de ocultar.
      mainWindow.webContents.send('force-save');
      // Ocultar en lugar de destruir para mantener un arranque rápido y tray activo.
      mainWindow.hide();
      // Notificar una sola vez por sesión para educar el comportamiento.
      notifyMinimized();
    }
  });

  mainWindow.on('closed', () => {
    wlog('closed event');
    if (mediaPollInterval) {
      clearInterval(mediaPollInterval);
      mediaPollInterval = null;
    }
    destroyTray();
    mainWindow = null;
  });

  mainWindow.on('unresponsive', () => werr('window unresponsive'));
  mainWindow.on('responsive', () => wlog('window responsive'));

  mainWindow.webContents.on('did-fail-load', (_e, errorCode, errorDescription, validatedURL) => {
    werr('did-fail-load', { errorCode, errorDescription, validatedURL });
  });
  mainWindow.webContents.on('render-process-gone', (_e, details) => {
    werr('webContents render-process-gone', details);
  });
  mainWindow.webContents.on('did-start-loading', () => wlog('did-start-loading'));
  mainWindow.webContents.on('did-stop-loading', () => wlog('did-stop-loading'));
  mainWindow.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    if (!debugLogs) return;
    console.log('[RENDER-CONSOLE]', { level, message, line, sourceId });
  });

  return mainWindow;
}

module.exports = { createWindow };
