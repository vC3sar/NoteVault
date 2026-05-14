import { state, saveAll, normalizeLoadedData } from './js/state.js';
import { applyTheme, showDashboard, showTrash, updateZoom, refreshSidebarState, updateGreeting, toggleNotesPanel, showCalendar } from './js/ui.js';
import { setupIPC } from './js/ipc.js';
import { setupEventListeners } from './js/events.js';
import { cleanupTrash, selectNote, addNote, restoreNote, permanentlyDeleteNote } from './js/notes.js';
import { selectNotebook, addNotebook } from './js/notebooks.js';
import { forceSaveNote } from './js/editor.js';
import { refreshIcons, cleanHTML, buildPreview, hashString } from './js/utils.js';
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
window.forceSaveNote = forceSaveNote;

// Initialization — wait for all HTML partials to be injected into the DOM.
// ES modules are deferred, so partials:ready may fire before this listener
// is registered. The window.partialsReady flag handles that race condition.
async function initApp() {
    let savedData;
    try {
        savedData = normalizeLoadedData(await window.api.loadData());
    } catch (error) {
        console.warn('No se pudieron cargar los datos:', error);
        savedData = normalizeLoadedData(null);
    }
    if (savedData.loadError) {
        console.warn('Error al cargar datos:', savedData.loadError);
    }
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

    // Backfill previews en segundo plano — no bloquea el arranque
    backfillPreviews().catch(err => console.warn('[preview-backfill] error:', err));
}

/**
 * Para cada nota sin preview válido (campo ausente o hash distinto al del .html en disco),
 * carga el archivo .html, regenera preview + hash y persiste en un solo saveAll().
 * Las notas vacías se omiten.
 */
async function backfillPreviews() {
    const allNotes = [
        ...state.notebooks.flatMap(nb => nb.notes.map(n => ({ note: n, source: nb.notes }))),
        ...state.trash.map(n => ({ note: n, source: state.trash }))
    ];

    let dirty = false;

    for (const { note } of allNotes) {
        // Si ya tiene preview con hash, saltar
        if (note.preview && note.previewHash) continue;

        // Intentar cargar el .html desde disco
        let html = '';
        try {
            html = await window.api.loadNote(note.id);
        } catch (_) { /* nota sin archivo .html todavía */ }

        if (!html) continue; // nota vacía — omitir

        const newHash = hashString(html);

        // Si el hash coincide con el guardado, el preview ya es válido (sólo falta persistir)
        if (note.previewHash === newHash && note.preview) continue;

        const newPreview = buildPreview(html);
        if (!newPreview) continue; // sigue vacía

        note.preview = newPreview;
        note.previewHash = newHash;
        dirty = true;
    }

    if (dirty) {
        await saveAll();
        console.info('[preview-backfill] Previews actualizados y guardados.');
    }
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
            if (typeof window.updateHighlightsPanel === 'function') window.updateHighlightsPanel();
            await window.forceSaveNote(); // Utiliza la lógica centralizada que incluye los hashes y metadatos
        } else {
            await saveAll(); // Si no hay nota activa, solo guarda la estructura general
        }
    }, ms);
}
window.startPeriodicAutosave = startPeriodicAutosave;
