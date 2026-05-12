// src/main/window.js
// Módulo del proceso principal encargado de la creación y configuración de la ventana principal.
// No importar desde /js/ — ese es el proceso de renderizado.

const { BrowserWindow, Menu, MenuItem, dialog } = require('electron');
const path = require('path');

let mainWindow = null;
let mediaPollInterval = null;

/**
 * Crea y configura la ventana principal de la aplicación.
 * @param {boolean} debug - Si es true, la ventana no se maximiza automáticamente.
 * @param {() => void} checkMedia - Callback para el polling de media.
 * @returns {Electron.BrowserWindow}
 */
function createWindow(debug, checkMedia) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true
    }
  });

  // Manejador para el corrector ortográfico y menú contextual
  mainWindow.webContents.on('context-menu', (event, params) => {
    const menu = new Menu();

    // Añadir sugerencias de ortografía
    for (const suggestion of params.dictionarySuggestions) {
      menu.append(new MenuItem({
        label: suggestion,
        click: () => mainWindow.webContents.replaceMisspelling(suggestion)
      }));
    }

    // Permitir añadir palabras al diccionario
    if (params.misspelledWord) {
      menu.append(
        new MenuItem({
          label: 'Añadir al diccionario',
          click: () => mainWindow.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
        })
      );
      menu.append(new MenuItem({ type: 'separator' }));
    }

    // Si hay sugerencias o una palabra mal escrita, mostramos el menú con ellas
    if (params.dictionarySuggestions.length > 0 || params.misspelledWord) {
      menu.append(new MenuItem({ type: 'separator' }));
    }

    // Acciones estándar de edición
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

  // DEBUG OPTION ------ REVISAR ANTES DE PRODUCCION
  if (!debug) mainWindow.maximize();
  mainWindow.show();

  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

  // Media polling
  if (typeof checkMedia === 'function') {
    mediaPollInterval = setInterval(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        checkMedia(() => mainWindow);
      }
    }, 2000);
  }

  // Confirmación antes de cerrar
  mainWindow.on('close', (e) => {
    const { app } = require('electron');
    if (!app.isQuitting) {
      e.preventDefault();
      const choice = dialog.showMessageBoxSync(mainWindow, {
        type: 'question',
        buttons: ['Guardar cambios y salir', 'Cancelar'],
        title: 'Confirmación de salida',
        message: '¿Deseas cerrar NoteVault? Espera un segundo para enviar tus últimos cambios locales pendientes.'
      });
      if (choice === 0) {
        mainWindow.webContents.send('app-closing');
      }
    }
  });

  mainWindow.on('closed', () => {
    if (mediaPollInterval) {
      clearInterval(mediaPollInterval);
      mediaPollInterval = null;
    }
    mainWindow = null;
  });

  return mainWindow;
}

module.exports = { createWindow };
