import { state, saveAll } from './state.js';
import { applyTheme, showDashboard, showTrash, showCalendar } from './ui.js';
import { renderSidebar, renderNotebookGrid, selectNotebook } from './notebooks.js';
import { renderNotesList, selectNote, cleanupTrash } from './notes.js';
import { refreshIcons, showModal, createId, cleanHTML } from './utils.js';

/**
 * js/ipc.js — Adaptadores IPC en el renderer.
 *
 * Responsabilidades:
 * - Traducir eventos/acciones provenientes del proceso principal (menús, cierre, media)
 *   a actualizaciones de estado + re-render de UI.
 * - Centralizar el manejo de "safe close": el proceso principal solicita guardado y el
 *   renderer confirma cuando terminó (`safe-close-ready`).
 *
 * Nota:
 * - Evitar lógica de persistencia duplicada: `saveAll()` es el punto único para metadata.
 * - Cualquier operación de archivos debe pasar por `window.api`.
 */

function getFileLabel(value) {
    const raw = String(value || '');
    if (!raw) return '';
    const cleaned = raw.startsWith('file:') ? decodeURIComponent(raw.replace('file:///', '')) : raw;
    return cleaned.split(/[\\/]/).pop() || cleaned;
}

export function setupIPC() {
    window.api.onNotebookAction(async ({ action, id }) => {
        const nb = state.notebooks.find(n => n.id === id);
        if (!nb) return;

        if (action === 'toggle-favorite') {
            nb.isFavorite = !nb.isFavorite;
            await saveAll();
            renderSidebar();
            renderNotebookGrid();
        } else if (action === 'edit') {
            const extra = document.getElementById('notebook-extra-fields');
            extra.style.display = 'block';

            const colorInput = document.getElementById('modal-color');
            const fileInput = document.getElementById('modal-image-file');
            const radioColor = document.querySelector('input[name="cover-mode"][value="color"]');
            const radioImage = document.querySelector('input[name="cover-mode"][value="image"]');
            const colorSection = document.getElementById('cover-color-section');
            const imageSection = document.getElementById('cover-image-section');
            const currentImageLabel = document.getElementById('current-image-name');

            fileInput.value = '';
            if (nb.coverType === 'image') {
                radioImage.checked = true;
                colorSection.style.display = 'none';
                imageSection.style.display = 'block';
                currentImageLabel.textContent = `Previamente: ${getFileLabel(nb.coverValue)}`;
                radioImage.closest('label').dataset.active = "true";
                radioColor.closest('label').dataset.active = "false";
            } else {
                radioColor.checked = true;
                colorSection.style.display = 'block';
                imageSection.style.display = 'none';
                colorInput.value = nb.coverValue || '#2b2d2e';
                currentImageLabel.textContent = '';
                radioColor.closest('label').dataset.active = "true";
                radioImage.closest('label').dataset.active = "false";
            }

            const newName = await showModal("Editar libreta:", "Nombre...", nb.name);
            const mode = document.querySelector('input[name="cover-mode"]:checked').value;
            const newColor = colorInput.value;
            const newImageFile = fileInput.files[0];

            extra.style.display = 'none';

            if (newName) {
                nb.name = newName;
                if (mode === 'color') {
                    if (nb.coverType === 'image') await window.api.deleteCover(nb.coverValue);
                    nb.coverType = 'color';
                    nb.coverValue = newColor;
                } else if (mode === 'image' && newImageFile) {
                    const upload = await window.api.uploadCover(newImageFile.path);
                    if (upload.success) {
                        if (nb.coverType === 'image') await window.api.deleteCover(nb.coverValue);
                        nb.coverType = 'image';
                        nb.coverValue = upload.path;
                    }
                }
                await saveAll();
                renderSidebar();
                renderNotebookGrid();
            }
        } else if (action === 'delete') {
            if (confirm(`¿Estás seguro de eliminar "${nb.name}"? Se borrarán todas sus notas.`)) {
                for (const note of nb.notes) await window.api.deleteNoteFile(note.id);
                state.notebooks = state.notebooks.filter(n => n.id !== id);
                await saveAll();
                if (state.activeNotebookId === id) {
                    showDashboard(state.currentView);
                } else {
                    renderSidebar();
                    renderNotebookGrid();
                }
            }
        }
    });

    window.api.onNoteAction(async ({ action, id }) => {
        const notebook = state.notebooks.find(n => n.id === state.activeNotebookId);
        if (!notebook) return;
        const noteIndex = notebook.notes.findIndex(n => n.id === id);
        if (noteIndex === -1) return;
        const note = notebook.notes[noteIndex];

        if (action === 'pin') {
            note.isPinned = !note.isPinned;
            await saveAll();
            renderNotesList();
        } else if (action === 'clone') {
            let contentToClone = note.content || '';
            try {
                const savedContent = await window.api.loadNote(note.id);
                if (savedContent !== null) contentToClone = savedContent;
            } catch (err) { console.error('Error cargando nota origen:', err); }

            const newId = createId();
            const clonedNote = {
                id: newId,
                title: `${note.title || 'Nota sin título'} (Copia)`,
                content: contentToClone,
                isPinned: false,
                createdAt: Date.now(),
                lastEdited: Date.now()
            };
            notebook.notes.push(clonedNote);
            await window.api.saveNoteContent(newId, contentToClone);
            await saveAll();
            selectNote(newId);
        } else if (action === 'delete') {
            if (confirm(`¿Mover "${note.title || 'Nota sin título'}" a la papelera?`)) {
                const trashedNote = { ...note, deletedAt: Date.now(), originalNotebookId: state.activeNotebookId };
                state.trash.push(trashedNote);
                notebook.notes.splice(noteIndex, 1);
                await saveAll();
                if (state.activeNoteId === id) {
                    state.activeNoteId = null;
                    document.getElementById('editor-container').classList.add('hidden');
                    const tb = document.getElementById('formatting-toolbar');
                    if (tb) tb.classList.add('hidden');
                    document.getElementById('note-title').value = '';
                    document.getElementById('editor').innerHTML = '';
                }
                renderNotesList();
                renderSidebar();
            }
        }
    });

    if (window.api.onAppClosing) {
        window.api.onAppClosing(async () => {
            if (state.activeNoteId) {
                const editor = document.getElementById('editor');
                const content = editor ? editor.innerHTML : '';
                await window.api.saveNoteContent(state.activeNoteId, cleanHTML(content));
            }
            await saveAll();
            window.api.sendSafeCloseReady();
        });
    }

    if (window.api.onForceSave) {
        window.api.onForceSave(async () => {
            if (state.activeNoteId) {
                const editor = document.getElementById('editor');
                const content = editor ? editor.innerHTML : '';
                await window.api.saveNoteContent(state.activeNoteId, cleanHTML(content));
            }
            await saveAll();
        });
    }

    if (window.api.onMediaUpdate) {
        window.api.onMediaUpdate((data) => {
            if (window.mediaTempDisabled) return;
            const player = document.getElementById('media-player');
            if (!player) return;
            if (!data || !state.settings.enableMedia) { player.classList.add('hidden'); return; }

            if (typeof data.title === 'string') data.title = data.title.normalize('NFC');
            if (typeof data.artist === 'string') data.artist = data.artist.normalize('NFC');

            player.classList.remove('hidden');
            document.getElementById('media-title').textContent = data.title || 'Desconocido';
            document.getElementById('media-artist').textContent = data.artist || data.appName || 'Sin artista';
            const playIcon = document.getElementById('media-play-icon');
            if (playIcon) playIcon.setAttribute('data-lucide', data.playbackStatus === 'Playing' ? 'pause' : 'play');
            refreshIcons();
        });
    }

    if (window.api.onMenuAction) {
        const MENU_COMMANDS = {
            'view-library': () => showDashboard('all'),
            'view-favorites': () => showDashboard('favorites'),
            'view-trash': () => showTrash(),
            'view-calendar': () => showCalendar(),
        };
        window.api.onMenuAction((action) => {
            const command = MENU_COMMANDS[action];
            if (command) command();
            else console.warn(`Acción de menú no reconocida: ${action}`);
        });
    }
}
