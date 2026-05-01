import { state, saveAll } from './js/state.js';
import { applyTheme, showDashboard, showTrash, updateZoom } from './js/ui.js';
import { setupIPC } from './js/ipc.js';
import { setupEventListeners } from './js/events.js';
import { cleanupTrash, selectNote, addNote, restoreNote, permanentlyDeleteNote } from './js/notes.js';
import { selectNotebook, addNotebook } from './js/notebooks.js';

// Expose functions to window for HTML compatibility (onclick handlers)
window.showDashboard = showDashboard;
window.showTrash = showTrash;
window.addNotebook = addNotebook;
window.addNote = addNote;
window.selectNotebook = selectNotebook;
window.selectNote = selectNote;
window.restoreNote = restoreNote;
window.permanentlyDeleteNote = permanentlyDeleteNote;
window.updateZoom = updateZoom;
window.applyTheme = applyTheme;
window.saveAll = saveAll;

// Initialization
window.addEventListener('DOMContentLoaded', async () => {
    const savedData = await window.api.loadData();
    state.notebooks = savedData.notebooks || [];
    state.trash = savedData.trash || [];
    if (savedData.settings) {
        state.settings = { autosaveMinutes: 5, theme: 'system', trashRetentionDays: 30, ...savedData.settings };
    } else {
        state.settings = { autosaveMinutes: 5, theme: 'system', trashRetentionDays: 30 };
    }

    applyTheme(state.settings.theme);

    const loader = document.getElementById('notebook-loader');
    if (loader) loader.style.display = 'none';

    await cleanupTrash();
    showDashboard('all');
    startPeriodicAutosave();
    
    setupIPC();
    setupEventListeners();
});

let periodicTimer = null;
export function startPeriodicAutosave() {
    if (periodicTimer) clearInterval(periodicTimer);
    const ms = state.settings.autosaveMinutes * 60000;

    periodicTimer = setInterval(async () => {
        if (state.activeNoteId) {
            const editor = document.getElementById('editor');
            const content = editor ? editor.innerHTML : '';
            if (typeof window.updateHighlightsPanel === 'function') window.updateHighlightsPanel();
            await window.api.saveNoteContent(state.activeNoteId, content);
        }
        await saveAll();
    }, ms);
}
window.startPeriodicAutosave = startPeriodicAutosave;
