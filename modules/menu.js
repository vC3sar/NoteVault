// src/main/menu.js
// Módulo del proceso principal encargado del menú de la aplicación (barra de menú nativa).
// No importar desde /js/ — ese es el proceso de renderizado.

const { Menu, dialog, shell } = require('electron');

/**
 * Construye y establece el menú de la aplicación.
 * @param {Electron.BrowserWindow} mainWindow - Ventana principal.
 * @param {boolean} debug - Si es true, añade el menú DEBUG.
 */
function setupMenu(mainWindow, debug) {
  const template = [
    {
      label: 'Edición',
      submenu: [
        { role: 'undo', label: 'Deshacer' },
        { role: 'redo', label: 'Rehacer' },
        { type: 'separator' },
        { role: 'cut', label: 'Cortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Pegar' },
        { role: 'selectAll', label: 'Seleccionar todo' }
      ]
    },
    {
      label: 'Atajos rapidos',
      submenu: [
        {
          label: 'Ir a la Librería',
          accelerator: 'CmdOrCtrl+L',
          click: () => { mainWindow.webContents.send('menu-action', 'view-library'); }
        },
        {
          label: 'Ir a la Papelera',
          accelerator: 'CmdOrCtrl+T',
          click: () => { mainWindow.webContents.send('menu-action', 'view-trash'); }
        },
        {
          label: 'Ir a Favoritos',
          accelerator: 'CmdOrCtrl+F',
          click: () => { mainWindow.webContents.send('menu-action', 'view-favorites'); }
        },
        {
          label: 'Ir al Calendario',
          accelerator: 'CmdOrCtrl+H',
          click: () => { mainWindow.webContents.send('menu-action', 'view-calendar'); }
        }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Atajos de teclado',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Atajos de Teclado',
              message: 'Comandos rápidos para NoteVault',
              detail: 'Ctrl + L: Ir a la Librería\nCtrl + T: Ir a la Papelera\nCtrl + F: Ir a Favoritos\nCtrl + H: Ir al Calendario',
              buttons: ['Cerrar']
            });
          }
        },
        {
          label: 'Visitar Sitio Web',
          click: () => {
            shell.openExternal('https://vazquezsg.ovh');
          }
        },
        { type: 'separator' },
        {
          label: 'Acerca de NoteVault',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Acerca de NoteVault',
              message: 'NoteVault Pro Edition',
              detail: 'Versión: 1.1.0-beta\nCreador: vC3sar\nOrganización: Vazquezsg.ovh\n\nUna aplicación de notas moderna y segura.',
              buttons: ['Entendido']
            });
          }
        }
      ]
    }
  ];

  if (debug) {
    template.push({
      label: 'DEBUG',
      submenu: [
        {
          label: 'Abrir DevTools',
          accelerator: 'F12',
          click: () => { mainWindow.webContents.openDevTools(); }
        },
        {
          label: 'Recargar App',
          accelerator: 'CmdOrCtrl+R',
          role: 'reload'
        }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

module.exports = { setupMenu };
