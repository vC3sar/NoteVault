import { state, saveAll } from './state.js';
import { refreshIcons, showModal, cleanHTML } from './utils.js';
import { renderSidebar } from './notebooks.js';
import { updateWordCount, updateAttachmentsIfNeeded } from './editor.js';

export function renderNotesList() {
    const list = document.getElementById('notes-list');
    const emptyState = document.getElementById('notes-empty-state');
    if (!list) return;
    list.innerHTML = '';
    const activeNb = state.notebooks.find(n => n.id === state.activeNotebookId);

    if (!activeNb) return;
    const nameEl = document.getElementById('panel-notebook-name');
    if (nameEl) nameEl.textContent = activeNb.name;

    const notesArray = Array.isArray(activeNb.notes) ? activeNb.notes : [];
    const sortedNotes = [...notesArray].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
    });

    if (sortedNotes.length === 0) {
        if (emptyState) {
            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
        }
    } else {
        if (emptyState) {
            emptyState.classList.add('hidden');
            emptyState.classList.remove('flex');
        }
    }

    sortedNotes.forEach(note => {
        const item = document.createElement('div');
        const isActive = state.activeNoteId === note.id;

        item.className = `group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${isActive ? 'bg-primary/5 border border-primary/10' : 'hover:bg-surface-bright border border-transparent'}`;

        const pinHtml = note.isPinned ? `<i data-lucide="pin" class="w-3 h-3 text-primary rotate-45 mr-2"></i>` : '';

        item.innerHTML = `
            <div class="flex items-start overflow-hidden pr-2">
                <div class="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 mr-3 text-on-surface-variant group-hover:text-primary transition-colors ${isActive ? 'bg-primary/10 text-primary' : ''}">
                    <i data-lucide="file-text" class="w-4 h-4"></i>
                </div>
                <div class="flex flex-col overflow-hidden">
                    <span class="truncate text-sm font-bold text-on-surface flex items-center">
                        ${pinHtml}
                        ${note.title || 'Nota sin título'}
                    </span>
                    <span class="text-[10px] text-on-surface-variant uppercase tracking-widest mt-0.5 truncate opacity-70">
                        ${note.content ? note.content.replace(/<[^>]*>?/gm, '').substring(0, 30) + '...' : 'Sin contenido'}
                    </span>
                </div>
            </div>
            <button class="item-options p-1.5 opacity-0 group-hover:opacity-100 text-on-surface-variant hover:bg-surface-container-highest rounded-md transition-all shrink-0">
                <i data-lucide="more-vertical" class="w-4 h-4"></i>
            </button>`;

        item.onclick = (e) => {
            if (e.target.closest('.item-options')) return;
            selectNote(note.id);
        };

        item.querySelector('.item-options').onclick = (e) => {
            e.stopPropagation();
            window.api.showNoteMenu({ id: note.id, isPinned: note.isPinned });
        };

        item.oncontextmenu = (e) => {
            e.preventDefault();
            window.api.showNoteMenu({ id: note.id, isPinned: note.isPinned });
        };

        list.appendChild(item);
    });
    refreshIcons();
}

export let currentNoteImagesOnOpen = [];

export function cleanupOrphans() {
    const editor = document.getElementById('editor');
    if (!editor) return;
    const currentImgs = Array.from(editor.querySelectorAll('img')).map(img => img.src);

    for (const src of currentNoteImagesOnOpen) {
        if (!currentImgs.includes(src) && src.startsWith('file:') && src.includes('attachments')) {
            window.api.deleteAttachment(src).catch(err => console.error("Error deleting orphan:", err));
        }
    }
    currentNoteImagesOnOpen = [];
}

export async function selectNote(id) {
    await cleanupOrphans();

    state.activeNoteId = id;
    const notebook = state.notebooks.find(n => n.id === state.activeNotebookId);
    if (!notebook) return;
    const note = notebook.notes.find(n => n.id === id);
    if (!note) return;

    try {
        const savedContent = await window.api.loadNote(id);
        if (savedContent !== null) note.content = savedContent;
    } catch (err) {
        console.error("Error al cargar el contenido de la nota:", err);
    }

    const titleEl = document.getElementById('note-title');
    const editorEl = document.getElementById('editor');
    const editorContainer = document.getElementById('editor-container');
    const tb = document.getElementById('formatting-toolbar');

    if (titleEl) titleEl.value = note.title || '';
    
    const cleanedContent = cleanHTML(note.content || '');
    if (editorEl) editorEl.innerHTML = cleanedContent;
    
    if (editorContainer) editorContainer.classList.remove('hidden');
    if (tb) tb.classList.remove('hidden');
    
    if (typeof window.updateHighlightsPanel === 'function') window.updateHighlightsPanel();
    updateWordCount();
    renderNotesList();
    updateAttachmentsIfNeeded(true);

    if (editorEl) {
        currentNoteImagesOnOpen = Array.from(editorEl.querySelectorAll('img')).map(img => img.src);
    }

    refreshIcons();
}

export async function addNote() {
    if (!state.activeNotebookId) {
        alert("Selecciona una libreta primero");
        return;
    }
    const title = await showModal("Nombre de la nota:", "Nueva Nota");
    if (title) {
        const notebook = state.notebooks.find(n => n.id === state.activeNotebookId);
        const newNote = { id: Date.now().toString(), title, content: '' };
        notebook.notes.push(newNote);
        await saveAll();
        selectNote(newNote.id);
    }
}

export function renderTrashList() {
    const list = document.getElementById('trash-list');
    const emptyState = document.getElementById('trash-empty-state');
    if (!list) return;
    list.innerHTML = '';

    if (state.trash.length === 0) {
        if (emptyState) {
            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
        }
    } else {
        if (emptyState) {
            emptyState.classList.add('hidden');
            emptyState.classList.remove('flex');
        }
    }

    state.trash.forEach(note => {
        const card = document.createElement('div');
        card.className = 'group relative bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/10 flex flex-col gap-3 transition-all hover:shadow-md';

        const retentionDays = state.settings.trashRetentionDays || 30;
        let daysLeft = 0;
        
        if (note.deletedAt) {
            daysLeft = Math.ceil((retentionDays * 24 * 60 * 60 * 1000 - (Date.now() - note.deletedAt)) / (24 * 60 * 60 * 1000));
        }
        
        const daysLabel = daysLeft <= 0 ? 'Expirando hoy' : `${daysLeft} días restantes`;
        const originalNb = state.notebooks.find(nb => nb.id === note.originalNotebookId);
        const originalName = originalNb ? originalNb.name : 'Libreta eliminada';

        card.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="w-10 h-10 rounded-xl bg-surface-container-high dark:bg-primary/10 flex items-center justify-center text-on-surface-variant dark:text-primary transition-colors">
                    <i data-lucide="file-text"></i>
                </div>
                <div class="text-[10px] font-bold uppercase tracking-widest ${daysLeft <= 1 ? 'text-error' : 'text-on-surface-variant opacity-60'}">
                    ${daysLabel}
                </div>
            </div>
            <div>
                <h3 class="font-bold text-on-surface truncate">${note.title || 'Nota sin título'}</h3>
                <p class="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mt-0.5 opacity-50">De: ${originalName}</p>
                <p class="text-xs text-on-surface-variant mt-2 line-clamp-2 opacity-70">
                    ${note.content ? note.content.replace(/<[^>]*>?/gm, '').substring(0, 80) : 'Sin contenido'}
                </p>
            </div>
            <div class="mt-auto pt-4 flex items-center gap-2 border-t border-outline-variant/5">
                <button class="restore-btn flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors">
                    <i data-lucide="rotate-ccw" style="width:14px;"></i> Restaurar
                </button>
                <button class="delete-forever-btn p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container transition-colors" title="Eliminar permanentemente">
                    <i data-lucide="trash-2" style="width:16px;"></i>
                </button>
            </div>
        `;

        card.querySelector('.restore-btn').onclick = () => restoreNote(note.id);
        card.querySelector('.delete-forever-btn').onclick = () => permanentlyDeleteNote(note.id);

        list.appendChild(card);
    });
    refreshIcons();
}

export async function restoreNote(id) {
    const index = state.trash.findIndex(n => n.id === id);
    if (index === -1) return;

    const note = state.trash[index];
    const notebook = state.notebooks.find(nb => nb.id === note.originalNotebookId);

    if (notebook) {
        const restoredNote = { ...note };
        delete restoredNote.deletedAt;
        delete restoredNote.originalNotebookId;
        notebook.notes.push(restoredNote);
        state.trash.splice(index, 1);
        await saveAll();
        renderTrashList();
        renderSidebar();
    } else {
        alert("La libreta original ya no existe. No se puede restaurar.");
    }
}

export async function permanentlyDeleteNote(id) {
    if (!confirm("¿Eliminar esta nota permanentemente? Esta acción no se puede deshacer.")) return;

    const index = state.trash.findIndex(n => n.id === id);
    if (index === -1) return;

    await window.api.deleteNoteFile(id);
    state.trash.splice(index, 1);
    await saveAll();
    renderTrashList();
}

export async function cleanupTrash() {
    const now = Date.now();
    const retentionDays = state.settings.trashRetentionDays || 30;
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

    const toDelete = state.trash.filter(note => {
        if (!note.deletedAt) return true; // Eliminar si no tiene fecha (corrupto)
        return (now - note.deletedAt) > retentionMs;
    });

    if (toDelete.length > 0) {
        await Promise.all(toDelete.map(note => window.api.deleteNoteFile(note.id)));
        state.trash = state.trash.filter(note => {
            if (!note.deletedAt) return false;
            return (now - note.deletedAt) <= retentionMs;
        });
        await saveAll();
        // Solo renderizar si estamos en la vista de papelera
        if (state.currentView === 'trash') renderTrashList();
    }
}
