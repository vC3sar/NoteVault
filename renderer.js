import { state, saveAll, normalizeLoadedData } from './js/state.js';
import { applyTheme, showDashboard, showTrash, updateZoom, refreshSidebarState, updateGreeting, toggleNotesPanel, showCalendar } from './js/ui.js';
import { setupIPC } from './js/ipc.js';
import { setupEventListeners } from './js/events.js';
import { cleanupTrash, selectNote, addNote, restoreNote, permanentlyDeleteNote } from './js/notes.js';
import { selectNotebook, addNotebook } from './js/notebooks.js';
import { forceSaveNote } from './js/editor.js';
import { refreshIcons, cleanHTML, buildPreview, hashString } from './js/utils.js';
import * as calendarEngine from './js/calendar.js';

/**
 * renderer.js — Entry point del renderer (UI).
 *
 * Responsabilidades:
 * - Inicializar estado en memoria a partir de persistencia (`window.api.loadData()`).
 * - Conectar IPC/eventos y arrancar la UI (vistas, sidebar, autosave).
 * - Exponer funciones en `window` por compatibilidad con handlers inline en HTML
 *   (idealmente, migrar a listeners delegados cuando se refactorice la UI).
 *
 * Notas de arquitectura:
 * - La estructura (libretas/notas/ajustes) vive en JSON; el contenido HTML por nota
 *   vive en archivos separados en disco. El renderer mantiene un cache temporal en memoria.
 * - Cualquier operación con sistema de archivos debe ir por `window.api` (preload/IPC).
 */

// Exposición explícita por compatibilidad con `onclick` en HTML/partials.
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

// Arranque: la UI depende de partials HTML inyectados en el DOM. Como los ES modules
// se difieren, el evento `partials:ready` puede dispararse antes de registrar este
// listener. La bandera `window.partialsReady` evita esa condición de carrera.
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

    // Regeneración de previews en segundo plano: no bloquea la UI inicial y corrige
    // datos legacy donde el preview/hash aún no existían.
    backfillPreviews().catch(err => console.warn('[preview-backfill] error:', err));
}

/**
 * Reconciliación de previews para notas legacy.
 *
 * Estrategia:
 * - Para notas sin `preview`/`previewHash`, cargar el `.html` desde disco.
 * - Regenerar `preview` + `previewHash` y persistir en un solo `saveAll()`.
 * - Omitir notas vacías para no ensuciar el dataset.
 */
async function backfillPreviews() {
    const allNotes = [
        ...state.notebooks.flatMap(nb => nb.notes.map(n => ({ note: n, source: nb.notes }))),
        ...state.trash.map(n => ({ note: n, source: state.trash }))
    ];

    let dirty = false;

    for (const { note } of allNotes) {
        // Caso común: dataset ya migrado.
        if (note.preview && note.previewHash) continue;

        // Intentar cargar el `.html` desde disco. Puede no existir si la nota aún no
        // se ha persistido o si fue eliminada externamente.
        let html = '';
        try {
            html = await window.api.loadNote(note.id);
        } catch (_) { /* nota sin archivo `.html` todavía */ }

        if (!html) continue; // Nota vacía: no generar preview.

        const newHash = hashString(html);

        // Si el hash coincide con el guardado, el preview ya es válido (sólo faltaría persistir).
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

// Si los partials ya se cargaron (el loader corrió antes que este módulo), arrancar ya.
// Si no, esperar el evento.
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
