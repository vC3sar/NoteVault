// src/main/ipc-handlers.js
// Módulo del proceso principal que registra todos los handlers IPC.
// No importar desde /js/ — ese es el proceso de renderizado.

const { ipcMain, Menu, BrowserWindow, app } = require('electron');
const path = require('path');
const fs = require('fs');

/**
 * Registra todos los handlers de IPC del proceso principal.
 * @param {{ DATA_PATH: string, NOTES_DIR: string, COVERS_DIR: string, ATTACHMENTS_DIR: string }} paths
 */
function registerIpcHandlers({ DATA_PATH, NOTES_DIR, COVERS_DIR, ATTACHMENTS_DIR }) {

  // ── Almacenamiento principal (metadata) ────────────────────────────────────

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
      return { notebooks: [] };
    } catch (error) {
      return { notebooks: [] };
    }
  });

  // ── Contenido de notas (archivos HTML) ─────────────────────────────────────

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

  ipcMain.handle('delete-note-file', async (event, id) => {
    try {
      const filePath = path.join(NOTES_DIR, `${id}.html`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Buscar rutas de adjuntos locales y eliminarlos
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

  // ── Portadas (covers) ──────────────────────────────────────────────────────

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

  ipcMain.handle('delete-cover', async (event, coverPath) => {
    try {
      if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ── Adjuntos (imágenes pegadas) ────────────────────────────────────────────

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
          return { success: false, error: 'Protocol not supported for download' };
        }

        const { net } = require('electron');
        return new Promise((resolve) => {
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

  // ── Ciclo de vida ──────────────────────────────────────────────────────────

  ipcMain.on('safe-close-ready', () => {
    app.isQuitting = true;
    app.quit();
  });

  // ── Menús contextuales ─────────────────────────────────────────────────────

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
}

module.exports = { registerIpcHandlers };
