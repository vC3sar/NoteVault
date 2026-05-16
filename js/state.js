import { createId, safeHexColor, stripHTML, buildPreview, hashString } from './utils.js';

export let state = {
    notebooks: [],
    trash: [],
    settings: { autosaveMinutes: 5, theme: 'system', trashRetentionDays: 30 },
    profile: { name: '', email: '', lang: 'es' },
    activeNotebookId: null,
    activeNoteId: null,
    // Vista actual del dashboard. Este valor guía el renderizado y navegación global.
    // Valores esperados: 'all', 'favorites', 'trash', 'calendar'.
    currentView: 'all',
    calendar: { events: [], schedule: [] }
};

function normalizeNote(note) {
    if (!note || typeof note !== 'object') return null;
    const lastEdited = Number(note.lastEdited);
    const content = typeof note.content === 'string' ? note.content : '';

    // Compatibilidad hacia atrás: versiones antiguas persistían `content` completo en JSON.
    // Si llega aquí, generamos `preview`/`previewHash` en caliente. El renderer también
    // ejecuta un backfill cuando el `.html` existe pero el preview falta.
    let preview = typeof note.preview === 'string' ? note.preview : '';
    let previewHash = typeof note.previewHash === 'string' ? note.previewHash : '';
    if (content && (!preview || !previewHash)) {
        const generated = buildPreview(content);
        if (generated) {
            preview = generated;
            previewHash = hashString(content);
        }
    }

    return {
        ...note,
        id: String(note.id ?? '') || createId(),
        title: typeof note.title === 'string' ? note.title : '',
        content,
        preview,
        previewHash,
        isPinned: !!note.isPinned,
        lastEdited: Number.isFinite(lastEdited) ? lastEdited : null
    };
}

function normalizeNotebook(notebook) {
    if (!notebook || typeof notebook !== 'object') return null;
    const notes = Array.isArray(notebook.notes) ? notebook.notes.map(normalizeNote).filter(Boolean) : [];
    const rawCoverValue = typeof notebook.coverValue === 'string' ? notebook.coverValue : '';
    const looksLikeImage = /^file:/i.test(rawCoverValue) || /[\\/].+\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(rawCoverValue);
    const coverType = notebook.coverType === 'image' || (!notebook.coverType && looksLikeImage) ? 'image' : 'color';
    return {
        ...notebook,
        id: String(notebook.id ?? '') || createId(),
        name: typeof notebook.name === 'string' ? notebook.name : 'Libreta sin nombre',
        coverType,
        coverValue: coverType === 'image'
            ? rawCoverValue
            : safeHexColor(notebook.coverValue, '#2b2d2e'),
        isFavorite: !!notebook.isFavorite,
        notes
    };
}

function normalizeTrashNote(note) {
    const normalized = normalizeNote(note);
    if (!normalized) return null;
    const deletedAt = Number(note.deletedAt);
    return {
        ...normalized,
        deletedAt: Number.isFinite(deletedAt) ? deletedAt : null,
        originalNotebookId: String(note.originalNotebookId ?? '')
    };
}

export function normalizeLoadedData(data) {
    const safe = data && typeof data === 'object' ? data : {};
    const loadError = typeof safe.loadError === 'string' ? safe.loadError : '';

    const notebooks = Array.isArray(safe.notebooks) ? safe.notebooks.map(normalizeNotebook).filter(Boolean) : [];
    const trash = Array.isArray(safe.trash) ? safe.trash.map(normalizeTrashNote).filter(Boolean) : [];
    const settings = {
        autosaveMinutes: 5,
        theme: 'system',
        trashRetentionDays: 30,
        ...safe.settings
    };
    const profile = {
        name: '',
        email: '',
        lang: 'es',
        ...(safe.profile && typeof safe.profile === 'object' ? safe.profile : {})
    };
    const calendar = {
        events: [],
        schedule: [],
        ...(safe.calendar && typeof safe.calendar === 'object' ? safe.calendar : {})
    };

    calendar.events = Array.isArray(calendar.events) ? calendar.events.filter(Boolean).map(event => ({
        ...event,
        id: String(event.id ?? '') || createId(),
        date: typeof event.date === 'string' ? event.date : '',
        title: typeof event.title === 'string' ? event.title : '',
        description: typeof event.description === 'string' ? event.description : '',
        color: safeHexColor(event.color, '#4338ca')
    })) : [];

    calendar.schedule = Array.isArray(calendar.schedule) ? calendar.schedule.filter(Boolean).map(item => ({
        ...item,
        id: String(item.id ?? '') || createId(),
        day: Math.min(7, Math.max(1, Number(item.day) || 1)),
        start: typeof item.start === 'string' ? item.start : '00:00',
        end: typeof item.end === 'string' ? item.end : '00:00',
        subject: typeof item.subject === 'string' ? item.subject : '',
        color: safeHexColor(item.color, '#10b981')
    })) : [];

    return { notebooks, trash, settings, profile, calendar, loadError };
}

/**
 * Serializa una nota para disco.
 *
 * Invariante: el HTML completo vive en archivos `.html` individuales, no en el JSON
 * de metadata. Esto mantiene el JSON liviano y reduce el riesgo de corrupción.
 */
function serializeNoteForDisk(note) {
    const { content: _dropped, ...rest } = note;
    return rest;
}

export async function saveAll() {
    const notebooksForDisk = state.notebooks.map(nb => ({
        ...nb,
        notes: nb.notes.map(serializeNoteForDisk)
    }));
    const trashForDisk = state.trash.map(serializeNoteForDisk);

    const result = await window.api.saveData({
        notebooks: notebooksForDisk,
        trash: trashForDisk,
        settings: state.settings,
        profile: state.profile,
        calendar: state.calendar
    });
    if (!result.success) console.error("Error al guardar:", result.error);
}
