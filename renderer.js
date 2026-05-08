import { state, saveAll } from './js/state.js';
import { applyTheme, showDashboard, showTrash, updateZoom, refreshSidebarState, updateGreeting, toggleNotesPanel, showCalendar } from './js/ui.js';
import { setupIPC } from './js/ipc.js';
import { setupEventListeners } from './js/events.js';
import { cleanupTrash, selectNote, addNote, restoreNote, permanentlyDeleteNote } from './js/notes.js';
import { selectNotebook, addNotebook } from './js/notebooks.js';
import { refreshIcons } from './js/utils.js';
import * as calendarEngine from './js/calendar.js';

// Expose functions to window for HTML compatibility (onclick handlers)
window.showDashboard = showDashboard;
window.showTrash = showTrash;
window.showCalendar = showCalendar;
window.calendarEngine = calendarEngine;
window.addNotebook = addNotebook;
window.addNote = addNote;
window.selectNotebook = selectNotebook;
window.selectNote = selectNote;
window.restoreNote = restoreNote;
window.permanentlyDeleteNote = permanentlyDeleteNote;
window.updateZoom = updateZoom;
window.applyTheme = applyTheme;
window.saveAll = saveAll;
window.toggleNotesPanel = toggleNotesPanel;

// Initialization — wait for all HTML partials to be injected into the DOM.
// ES modules are deferred, so partials:ready may fire before this listener
// is registered. The window.partialsReady flag handles that race condition.
async function initApp() {
    const savedData = await window.api.loadData();
    state.notebooks = savedData.notebooks || [];
    state.trash = savedData.trash || [];
    if (savedData.settings) {
        state.settings = { autosaveMinutes: 5, theme: 'system', trashRetentionDays: 30, ...savedData.settings };
    } else {
        state.settings = { autosaveMinutes: 5, theme: 'system', trashRetentionDays: 30 };
    }

    if (savedData.profile) {
        state.profile = { name: '', email: '', lang: 'es', ...savedData.profile };
    } else {
        state.profile = { name: '', email: '', lang: 'es' };
    }

    if (savedData.calendar) {
        state.calendar = { events: [], schedule: [], ...savedData.calendar };
    } else {
        state.calendar = { events: [], schedule: [] };
    }

    applyTheme(state.settings.theme);
    refreshSidebarState();
    updateGreeting();
    refreshIcons();

    const loader = document.getElementById('notebook-loader');
    if (loader) loader.style.display = 'none';

    await cleanupTrash();
    showDashboard('all');
    startPeriodicAutosave();
    
    setupIPC();
    setupEventListeners();
}

// Start: if partials already loaded (loader ran before module), init now.
// Otherwise, wait for the event.
if (window.partialsReady) {
    initApp();
} else {
    document.addEventListener('partials:ready', initApp);
}

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
