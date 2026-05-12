import { createId, safeHexColor } from './utils.js';

export let state = {
    notebooks: [],
    trash: [],
    settings: { autosaveMinutes: 5, theme: 'system', trashRetentionDays: 30 },
    profile: { name: '', email: '', lang: 'es' },
    activeNotebookId: null,
    activeNoteId: null,
    currentView: 'all', // 'all', 'favorites', 'trash', or 'calendar'
    calendar: { events: [], schedule: [] }
};

function normalizeNote(note) {
    if (!note || typeof note !== 'object') return null;
    const lastEdited = Number(note.lastEdited);
    return {
        ...note,
        id: String(note.id ?? '') || createId(),
        title: typeof note.title === 'string' ? note.title : '',
        content: typeof note.content === 'string' ? note.content : '',
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

export async function saveAll() {
    const result = await window.api.saveData({
        notebooks: state.notebooks,
        trash: state.trash,
        settings: state.settings,
        profile: state.profile,
        calendar: state.calendar
    });
    if (!result.success) console.error("Error al guardar:", result.error);
}
