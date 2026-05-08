const debug = true;
const { app, BrowserWindow, ipcMain, Menu, MenuItem } = require('electron');
const path = require('path');
const fs = require('fs');

app.setAppUserModelId("ovh.vazquezsg.NoteVault");
app.name = "NoteVault";

const DATA_PATH = path.join(app.getPath('userData'), 'notes_data.json');
const NOTES_DIR = path.join(app.getPath('userData'), 'notes');
const COVERS_DIR = path.join(app.getPath('userData'), 'covers');
const ATTACHMENTS_DIR = path.join(app.getPath('userData'), 'attachments');

// Asegurar que existan los directorios
if (!fs.existsSync(NOTES_DIR)) fs.mkdirSync(NOTES_DIR);
if (!fs.existsSync(COVERS_DIR)) fs.mkdirSync(COVERS_DIR);
if (!fs.existsSync(ATTACHMENTS_DIR)) fs.mkdirSync(ATTACHMENTS_DIR);

let mainWindow;
let mediaControl;
import('win-media-control').then(module => {
  mediaControl = module;
}).catch(e => {
  console.error("win-media-control not available", e);
});

function checkMedia() {
  if (!mediaControl || !mainWindow || mainWindow.isDestroyed()) return;
  mediaControl.listSessions().then(sessions => {
    if (!sessions || sessions.length === 0) {
      mainWindow.webContents.send('media-update', null);
      return;
    }
    const active = sessions.find(s => s.playbackStatus === 'Playing') || sessions[0];
    mainWindow.webContents.send('media-update', active);
  }).catch(err => {
    console.error("Media error:", err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
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

  mainWindow.loadFile('index.html');

  // Media polling
  setInterval(checkMedia, 2000);

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      const { dialog } = require('electron');
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
}

// IPC Handlers para almacenamiento
ipcMain.handle('save-data', async (event, data) => {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-data', async () => {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const data = fs.readFileSync(DATA_PATH, 'utf-8');
      return JSON.parse(data);
    }
    return { notebooks: [] }; // Datos iniciales
  } catch (error) {
    return { notebooks: [] };
  }
});

ipcMain.on('show-notebook-menu', (event, { id, isFavorite }) => {
  const template = [
    {
      label: isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos',
      click: () => { event.sender.send('notebook-action', { action: 'toggle-favorite', id }); }
    },
    { type: 'separator' },
    {
      label: 'Editar libreta (Nombre o Portada)',
      click: () => { event.sender.send('notebook-action', { action: 'edit', id }); }
    },
    { type: 'separator' },
    {
      label: 'Eliminar libreta',
      click: () => { event.sender.send('notebook-action', { action: 'delete', id }); }
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  menu.popup(BrowserWindow.fromWebContents(event.sender));
});

ipcMain.on('show-note-menu', (event, { id, isPinned }) => {
  const template = [
    {
      label: isPinned ? 'Desfijar de arriba' : 'Fijar arriba',
      click: () => { event.sender.send('note-action', { action: 'pin', id }); }
    },
    {
      label: 'Clonar nota',
      click: () => { event.sender.send('note-action', { action: 'clone', id }); }
    },
    { type: 'separator' },
    {
      label: 'Eliminar nota',
      click: () => { event.sender.send('note-action', { action: 'delete', id }); }
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  menu.popup(BrowserWindow.fromWebContents(event.sender));
});

ipcMain.on('show-edit-menu', (event) => {
  const template = [
    { label: 'Negrita', click: () => event.sender.send('edit-action', 'bold') },
    { label: 'Cursiva', click: () => event.sender.send('edit-action', 'italic') },
    { label: 'Subrayado', click: () => event.sender.send('edit-action', 'underline') },
    { type: 'separator' },
    {
      label: 'Tamaño de fuente',
      submenu: [
        { label: 'Pequeño (12px)', click: () => event.sender.send('edit-action', { command: 'fontSize', value: '12px' }) },
        { label: 'Normal (18px)', click: () => event.sender.send('edit-action', { command: 'fontSize', value: '18px' }) },
        { label: 'Mediano (20px)', click: () => event.sender.send('edit-action', { command: 'fontSize', value: '20px' }) },
        { label: 'Grande (28px)', click: () => event.sender.send('edit-action', { command: 'fontSize', value: '28px' }) },
        { label: 'Muy grande (36px)', click: () => event.sender.send('edit-action', { command: 'fontSize', value: '36px' }) },
      ]
    },
    {
      label: 'Resaltar texto',
      submenu: [
        { label: '🟡 Amarillo', click: () => event.sender.send('edit-action', { command: 'highlight', value: 'yellow' }) },
        { label: '🟢 Verde', click: () => event.sender.send('edit-action', { command: 'highlight', value: 'green' }) },
        { label: '🔵 Azul', click: () => event.sender.send('edit-action', { command: 'highlight', value: 'blue' }) },
        { label: '🔴 Rojo', click: () => event.sender.send('edit-action', { command: 'highlight', value: 'red' }) },
        { label: '⬜ Quitar resaltado', click: () => event.sender.send('edit-action', { command: 'highlight', value: 'none' }) },
      ]
    },
    { type: 'separator' },
    {
      label: 'Color de texto',
      submenu: [
        { label: 'Rojo', click: () => event.sender.send('edit-action', { command: 'foreColor', value: '#e74c3c' }) },
        { label: 'Azul', click: () => event.sender.send('edit-action', { command: 'foreColor', value: '#2383e2' }) },
        { label: 'Verde', click: () => event.sender.send('edit-action', { command: 'foreColor', value: '#2ecc71' }) },
        { label: 'Naranja', click: () => event.sender.send('edit-action', { command: 'foreColor', value: '#f39c12' }) },
        { label: 'Morado', click: () => event.sender.send('edit-action', { command: 'foreColor', value: '#9b59b6' }) },
        { type: 'separator' },
        { label: 'Predeterminado (quitar color)', click: () => event.sender.send('edit-action', { command: 'removeColor' }) }
      ]
    },
    { type: 'separator' },
    { label: '🧹 Limpiar todo el formato', click: () => event.sender.send('edit-action', 'removeFormat') }
  ];
  const menu = Menu.buildFromTemplate(template);
  menu.popup(BrowserWindow.fromWebContents(event.sender));
});

ipcMain.on('show-image-menu', (event) => {
  const template = [
    { label: 'Imagen Pequeña (25%)', click: () => event.sender.send('image-action', '25%') },
    { label: 'Imagen Mediana (50%)', click: () => event.sender.send('image-action', '50%') },
    { label: 'Imagen Grande (75%)', click: () => event.sender.send('image-action', '75%') },
    { label: 'Tamaño Original (100%)', click: () => event.sender.send('image-action', '100%') },
    { type: 'separator' },
    { label: 'Centrar Imagen', click: () => event.sender.send('image-action', 'center') },
    { label: 'Alinear a la izquierda', click: () => event.sender.send('image-action', 'left') },
    { type: 'separator' },
    { label: 'Eliminar Imagen', click: () => event.sender.send('image-action', 'delete') }
  ];
  const menu = Menu.buildFromTemplate(template);
  menu.popup(BrowserWindow.fromWebContents(event.sender));
});

ipcMain.handle('delete-note-file', async (event, id) => {
  try {
    const filePath = path.join(NOTES_DIR, `${id}.html`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      // Buscar rutas de adjuntos locales
      const imgRegex = /src="file:\/\/\/([^"]+attachments\/[^"]+)"/g;
      let match;
      while ((match = imgRegex.exec(content)) !== null) {
        const fullPath = decodeURIComponent(match[1].replace(/\//g, path.sep));
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
      fs.unlinkSync(filePath);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-note-content', async (event, { id, content }) => {
  try {
    const filePath = path.join(NOTES_DIR, `${id}.html`);
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-note-content', async (event, id) => {
  try {
    const filePath = path.join(NOTES_DIR, `${id}.html`);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
    return '';
  } catch (error) {
    return '';
  }
});

ipcMain.handle('upload-cover', async (event, filePath) => {
  try {
    const ext = path.extname(filePath);
    const fileName = `${Date.now()}${ext}`;
    const destPath = path.join(COVERS_DIR, fileName);
    fs.copyFileSync(filePath, destPath);
    return { success: true, path: destPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-pasted-image', async (event, { url, base64 }) => {
  try {
    const fileName = `img_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
    const destPath = path.join(ATTACHMENTS_DIR, fileName);

    if (base64) {
      const buffer = Buffer.from(base64.split(',')[1], 'base64');
      fs.writeFileSync(destPath, buffer);
    } else if (url) {
      if (url.startsWith('file:///')) {
        // Copiar archivo local existente para dar independencia
        const srcPath = decodeURIComponent(url.replace('file:///', '').replace(/\//g, path.sep));
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, destPath);
          return { success: true, path: `file:///${destPath.replace(/\\/g, '/')}` };
        }
      }

      if (!url.startsWith('http')) {
        // No es una URL descargable (puede ser data: o blob: que deben manejarse de otra forma o ignorarse)
        return { success: false, error: 'Protocol not supported for download' };
      }

      const { net } = require('electron');
      return new Promise((resolve, reject) => {
        try {
          const request = net.request(url);
          request.on('response', (response) => {
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
              const buffer = Buffer.concat(chunks);
              fs.writeFileSync(destPath, buffer);
              resolve({ success: true, path: `file:///${destPath.replace(/\\/g, '/')}` });
            });
          });
          request.on('error', (err) => resolve({ success: false, error: err.message }));
          request.end();
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      });
    }

    return { success: true, path: `file:///${destPath.replace(/\\/g, '/')}` };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-attachment', async (event, fileUrl) => {
  try {
    const fileName = path.basename(fileUrl);
    const filePath = decodeURIComponent(fileUrl.replace('file:///', '').replace(/\//g, path.sep));

    if (!filePath.includes('attachments') || !fs.existsSync(filePath)) {
      return { success: false, error: 'Not an attachment or file not found' };
    }

    // Seguridad: Escanear todas las notas para ver si alguien más la usa
    const notes = fs.readdirSync(NOTES_DIR);
    let isUsed = false;
    for (const noteFile of notes) {
      if (noteFile.endsWith('.html')) {
        const content = fs.readFileSync(path.join(NOTES_DIR, noteFile), 'utf-8');
        if (content.includes(fileName)) {
          isUsed = true;
          break;
        }
      }
    }

    if (!isUsed) {
      fs.unlinkSync(filePath);
      return { success: true, deleted: true };
    }

    return { success: true, deleted: false, message: 'File still in use by other notes' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.on('safe-close-ready', () => {
  app.isQuitting = true;
  app.quit();
});

ipcMain.handle('delete-cover', async (event, coverPath) => {
  try {
    if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Eventos de Media Control
ipcMain.on('media-toggle', async () => {
  if (mediaControl) { await mediaControl.togglePlayPause(); setTimeout(checkMedia, 500); }
});

ipcMain.on('media-next', async () => {
  if (mediaControl) { await mediaControl.next(); setTimeout(checkMedia, 500); }
});

ipcMain.on('media-prev', async () => {
  if (mediaControl) { await mediaControl.previous(); setTimeout(checkMedia, 500); }
});

ipcMain.on('media-check-now', () => {
  checkMedia();
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Si el usuario intenta abrir una segunda instancia, enfocamos a la principal
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    setupMenu();
    // Configurar el idioma del corrector (Español)
    if (mainWindow && mainWindow.webContents.session) {
      mainWindow.webContents.session.setSpellCheckerLanguages(['es']);
    }
  });
}

function setupMenu() {
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
            const { dialog } = require('electron');
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
            const { shell } = require('electron');
            shell.openExternal('https://vazquezsg.ovh');
          }
        },
        { type: 'separator' },
        {
          label: 'Acerca de NoteVault',
          click: () => {
            const { dialog } = require('electron');
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
