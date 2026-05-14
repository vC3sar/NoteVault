import { state, saveAll } from './state.js';
import { refreshIcons, showModal, escapeHTML, createId, safeHexColor } from './utils.js';
import { renderNotesList } from './notes.js';
import { updateGreeting } from './ui.js';

export function renderNotebookGrid(searchQuery = '') {
    const grid = document.getElementById('notebook-grid');
    const emptyState = document.getElementById('empty-state');
    if (!grid) return;
    grid.innerHTML = '';

    let toDisplay = state.notebooks;
    if (state.currentView === 'favorites') {
        toDisplay = state.notebooks.filter(n => n.isFavorite);
    }

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        toDisplay = toDisplay.filter(nb => String(nb.name || '').toLowerCase().includes(q));
    }

    if (toDisplay.length === 0) {
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

    toDisplay.forEach(nb => {
        const card = document.createElement('div');

        const spineRings = Array.from({ length: 6 }, (_, i) => {
            const top = 10 + i * 16;
            return `<div class="notebook-ring" style="top:${top}%"></div>`;
        }).join('');

        let visualStyle = '';
        let cardBgStyle = '';
        if (nb.coverType === 'image') {
            const coverSrcRaw = String(nb.coverValue || '');
            const coverSrc = coverSrcRaw.startsWith('file:') ? coverSrcRaw : `file:///${coverSrcRaw.replace(/\\/g, '/')}`;
            visualStyle = `
                <div class="absolute inset-0 z-0">
                    <img src="${escapeHTML(coverSrc)}" class="w-full h-full object-cover group-hover:scale-105 transition-all duration-700">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none"></div>
                </div>
                <div class="notebook-spine">${spineRings}</div>
            `;
        } else {
            const color = safeHexColor(nb.coverValue, '#2b2d2e');
            cardBgStyle = `background-color:${color};`;
            visualStyle = `<div class="notebook-spine" style="background-color: ${color}">${spineRings}</div>`;
        }

        const favHtml = nb.isFavorite ? `<i data-lucide="star" style="fill: currentColor;" class="text-amber-400 w-4 h-4 absolute top-4 right-12 z-20"></i>` : '';
        const safeName = escapeHTML(nb.name || 'Libreta sin nombre');
        const noteCount = Array.isArray(nb.notes) ? nb.notes.length : 0;

        card.className = 'group relative rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-outline-variant/10 aspect-[3/4] max-h-[320px] flex flex-col justify-end';
        card.style.cssText = cardBgStyle || 'background-color: var(--surface-container-lowest, #f8f9fa)';
        card.innerHTML = `
            ${visualStyle}
            ${favHtml}
            <button class="card-options absolute top-3 right-3 p-1.5 bg-surface-container/50 hover:bg-surface-container/80 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all z-20">
                <i data-lucide="more-vertical" class="text-on-surface w-5 h-5"></i>
            </button>
            <div class="relative z-10 bg-white/10 dark:bg-black/20 backdrop-blur-md p-2.5 ml-6 mr-2 mb-2 rounded-xl shadow-sm border border-white/20 transition-all">
                <h3 class="text-lg font-bold text-white drop-shadow-md mb-0.5 break-words leading-tight">${safeName}</h3>
                <p class="text-[10px] text-white/80 font-bold uppercase tracking-wide drop-shadow-md mt-1">${noteCount} Notas</p>
            </div>
        `;

        card.onclick = (e) => {
            if (e.target.closest('.card-options')) return;
            selectNotebook(nb.id);
        };

        card.querySelector('.card-options').onclick = (e) => {
            e.stopPropagation();
            window.api.showNotebookMenu({ id: nb.id, isFavorite: !!nb.isFavorite });
        };

        card.oncontextmenu = (e) => { e.preventDefault(); window.api.showNotebookMenu({ id: nb.id, isFavorite: !!nb.isFavorite }); };

        grid.appendChild(card);
    });
    refreshIcons();
}

export function renderSidebar() {
    const list = document.getElementById('notebook-list');
    if (!list) return;
    list.innerHTML = '';
    state.notebooks.forEach(nb => {
        const item = document.createElement('a');
        const isActive = state.activeNotebookId === nb.id;

        item.className = `flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors duration-200 text-sm font-medium rounded-lg group ${isActive ? 'bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/40'}`;

        const favIcon = nb.isFavorite ? `<i data-lucide="star" class="w-3 h-3 text-amber-400" style="fill:currentColor;"></i>` : '';
        const colorIndicator = nb.coverType === 'color' ? `<div class="w-2 h-2 rounded-full" style="background-color: ${safeHexColor(nb.coverValue, '#2b2d2e')}"></div>` : `<i data-lucide="image" class="w-3 h-3"></i>`;
        const safeName = escapeHTML(nb.name || 'Libreta sin nombre');

        item.title = nb.name;
        if (nb.isFavorite) item.classList.add('is-favorite');

        item.innerHTML = `
            <div class="shrink-0 flex items-center justify-center">${colorIndicator}</div>
            <span class="truncate flex-1 sidebar-text transition-opacity duration-300">${safeName}</span>
            <div class="shrink-0 notebook-fav-icon">${favIcon}</div>
        `;

        item.onclick = (e) => {
            selectNotebook(nb.id);
        };

        item.oncontextmenu = (e) => {
            e.preventDefault();
            window.api.showNotebookMenu({ id: nb.id, isFavorite: !!nb.isFavorite });
        };

        list.appendChild(item);
    });
    refreshIcons();
}

export function selectNotebook(id) {
    state.activeNotebookId = id;
    state.activeNoteId = null;

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    const dashboard = document.getElementById('dashboard');
    const notebookView = document.getElementById('notebook-view');
    const trashView = document.getElementById('trash-view');
    const calendarView = document.getElementById('calendar-view');
    const editorContainer = document.getElementById('editor-container');

    if (dashboard) {
        dashboard.classList.add('hidden');
        dashboard.classList.remove('block', 'flex');
    }

    if (notebookView) {
        notebookView.style.display = '';
        notebookView.classList.remove('hidden');
        notebookView.classList.add('flex');
    }

    if (trashView) {
        trashView.classList.add('hidden');
        trashView.classList.remove('block', 'flex');
    }

    if (calendarView) {
        calendarView.classList.add('hidden');
        calendarView.classList.remove('block', 'flex');
    }

    if (editorContainer) editorContainer.classList.add('hidden');

    const editorEmptyState = document.getElementById('editor-empty-state');
    if (editorEmptyState) editorEmptyState.classList.remove('hidden');

    const editorStatusBar = document.getElementById('editor-status-bar');
    if (editorStatusBar) editorStatusBar.classList.add('hidden');

    const toggleAttachments = document.getElementById('toggle-attachments');
    if (toggleAttachments) toggleAttachments.classList.add('hidden');

    document.getElementById('search-container').classList.remove('hidden');
    const searchNotes = document.getElementById('search-notes');
    if (searchNotes) searchNotes.value = '';

    const dashboardActions = document.getElementById('dashboard-actions');
    if (dashboardActions) dashboardActions.style.display = 'none';

    document.getElementById('add-note').style.display = 'flex';

    const navbarInfo = document.getElementById('navbar-view-info');
    if (navbarInfo) navbarInfo.classList.add('hidden');

    renderSidebar();
    renderNotesList();
    updateGreeting();
}

export async function addNotebook() {
    const extra = document.getElementById('notebook-extra-fields');
    extra.style.display = 'block';

    const radioColor = document.querySelector('input[name="cover-mode"][value="color"]');
    radioColor.checked = true;
    radioColor.closest('label').dataset.active = "true";
    document.querySelector('input[name="cover-mode"][value="image"]').closest('label').dataset.active = "false";

    document.getElementById('cover-color-section').style.display = 'block';
    document.getElementById('cover-image-section').style.display = 'none';
    document.getElementById('modal-color').value = '#2b2d2e';
    document.getElementById('modal-image-file').value = '';
    document.getElementById('current-image-name').textContent = '';

    const name = await showModal("Nombre de la libreta:", "Ej: Matemáticas II");

    const mode = document.querySelector('input[name="cover-mode"]:checked').value;
    const color = document.getElementById('modal-color').value;
    const imageFile = document.getElementById('modal-image-file').files[0];

    extra.style.display = 'none';

    if (name) {
        let coverType = 'color';
        let coverValue = color;

        if (mode === 'image' && imageFile) {
            const upload = await window.api.uploadCover(imageFile.path);
            if (upload.success) {
                coverType = 'image';
                coverValue = upload.path;
            }
        }

        const newNb = {
            id: createId(),
            name,
            coverType,
            coverValue,
            isFavorite: false,
            notes: []
        };
        state.notebooks.push(newNb);
        await saveAll();
        selectNotebook(newNb.id);
    }
}

function timeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    const weeks = Math.floor(diff / (86400000 * 7));
    const months = Math.floor(diff / (86400000 * 30));

    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}m`;
    if (hours < 24) return `hace ${hours}h`;
    if (days < 7) return `hace ${days}d`;
    if (weeks < 5) return `hace ${weeks}sem`;
    return `hace ${months}mes`;
}

export function renderRecentNotes() {
    const container = document.getElementById('recent-notes-section');
    if (!container) return;

    // Gather all notes from all notebooks with their notebook context
    const allNotes = [];
    state.notebooks.forEach(nb => {
        (nb.notes || []).forEach(note => {
            const ts = note.lastEdited || note.createdAt || (String(note.id || '').match(/^\d+$/) ? parseInt(note.id) : 0);
            allNotes.push({ note, notebook: nb, ts });
        });
    });

    if (allNotes.length === 0) {
        container.classList.add('hidden');
        return;
    }

    allNotes.sort((a, b) => b.ts - a.ts);
    const recent = allNotes.slice(0, 4);

    container.classList.remove('hidden');
    const list = container.querySelector('#recent-notes-list');
    if (!list) return;
    list.innerHTML = '';

    const palette = [
        { bg: 'rgba(225, 29, 72, 0.15)', iconColor: '#e11d48', bar: '#e11d48', pill: 'rgba(225, 29, 72, 0.15)', pillText: '#e11d48' }, // Red
        { bg: 'rgba(234, 88, 12, 0.15)', iconColor: '#ea580c', bar: '#ea580c', pill: 'rgba(234, 88, 12, 0.15)', pillText: '#ea580c' }, // Orange
        { bg: 'rgba(202, 138, 4, 0.15)', iconColor: '#ca8a04', bar: '#ca8a04', pill: 'rgba(202, 138, 4, 0.15)', pillText: '#ca8a04' }, // Gold
        { bg: 'rgba(22, 163, 74, 0.15)', iconColor: '#16a34a', bar: '#16a34a', pill: 'rgba(22, 163, 74, 0.15)', pillText: '#16a34a' }, // Green
        { bg: 'rgba(13, 148, 136, 0.15)', iconColor: '#0d9488', bar: '#0d9488', pill: 'rgba(13, 148, 136, 0.15)', pillText: '#0d9488' }, // Teal
        { bg: 'rgba(37, 99, 235, 0.15)', iconColor: '#2563eb', bar: '#2563eb', pill: 'rgba(37, 99, 235, 0.15)', pillText: '#2563eb' }, // Blue
        { bg: 'rgba(2, 132, 199, 0.15)', iconColor: '#0284c7', bar: '#0284c7', pill: 'rgba(2, 132, 199, 0.15)', pillText: '#0284c7' }, // Cyan
        { bg: 'rgba(79, 70, 229, 0.15)', iconColor: '#4f46e5', bar: '#4f46e5', pill: 'rgba(79, 70, 229, 0.15)', pillText: '#4f46e5' }, // Indigo
        { bg: 'rgba(147, 51, 234, 0.15)', iconColor: '#9333ea', bar: '#9333ea', pill: 'rgba(147, 51, 234, 0.15)', pillText: '#9333ea' }, // Purple
        { bg: 'rgba(219, 39, 119, 0.15)', iconColor: '#db2777', bar: '#db2777', pill: 'rgba(219, 39, 119, 0.15)', pillText: '#db2777' }  // Pink
    ];

    function hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
        }
        return hash;
    }

    recent.forEach(({ note, notebook, ts }) => {
        const title = note.title || 'Nota sin título';
        const subject = notebook.name || 'Libreta sin nombre';
        const timeStr = timeAgo(ts);

        const hash = hashString(title + subject);
        const colorToken = palette[hash % palette.length];

        const item = document.createElement('div');
        item.className = 'group flex items-center justify-between gap-4 py-3.5 px-4 rounded-2xl cursor-pointer hover:bg-surface-container transition-colors border border-outline-variant/10 bg-surface-container-lowest shadow-sm';

        const safeNotebookName = escapeHTML(subject);
        const safeTitle = escapeHTML(title);

        item.innerHTML = `
            <div class="flex items-center gap-4 overflow-hidden min-w-0 flex-1">
                <div style="width: 36px; height: 36px; border-radius: 10px; background-color: ${colorToken.bg}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: 0; bottom: 0; left: 0; width: 2px; background-color: ${colorToken.bar};"></div>
                    <i data-lucide="file-text" style="color: ${colorToken.iconColor}; width: 18px; height: 18px; margin-left: 1px;"></i>
                </div>
                <span class="text-on-surface truncate" style="font-size: 15px; font-weight: 700; letter-spacing: -0.01em;">${safeTitle}</span>
            </div>
            
            <div class="shrink-0 flex items-center gap-4 text-right">
                <div class="hidden sm:flex items-center gap-1.5 text-on-surface-variant opacity-70">
                    <i data-lucide="folder" style="width: 12px; height: 12px;"></i>
                    <span class="truncate max-w-[150px]" style="font-size: 12px;">${safeNotebookName}</span>
                </div>
                
                <div class="text-on-surface shrink-0" style="background-color: ${colorToken.pill}; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center;">
                    ${timeStr}
                </div>
            </div>
        `;
        item.onclick = () => {
            // Navigate to the notebook and note
            import('./notebooks.js').then(m => m.selectNotebook(notebook.id)).then(() => {
                import('./notes.js').then(m => m.selectNote(note.id));
            });
        };
        list.appendChild(item);
    });

    refreshIcons();
}
