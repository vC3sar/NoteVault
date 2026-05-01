import { state, saveAll } from './state.js';
import { refreshIcons, showModal } from './utils.js';
import { renderNotesList } from './notes.js';

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
        toDisplay = toDisplay.filter(nb => nb.name.toLowerCase().includes(q));
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
            const spineColor = 'rgba(255,255,255,0.25)';
            visualStyle = `
                <div class="absolute inset-0 z-0">
                    <img src="file://${nb.coverValue.replace(/\\/g, '/')}" class="w-full h-full object-cover group-hover:scale-105 transition-all duration-700">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none"></div>
                </div>
                <div class="notebook-spine" style="background:${spineColor};">${spineRings}</div>
            `;
        } else {
            const color = nb.coverValue || '#2b2d2e';
            cardBgStyle = `background-color:${color};`;
            visualStyle = `<div class="notebook-spine" style="background-color:${color};">${spineRings}</div>`;
        }

        const favHtml = nb.isFavorite ? `<i data-lucide="star" style="fill: currentColor;" class="text-amber-400 w-4 h-4 absolute top-4 right-12 z-20"></i>` : '';

        card.className = 'group relative rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-outline-variant/10 aspect-[3/4] max-h-[320px] flex flex-col justify-end';
        card.style.cssText = cardBgStyle || 'background-color: var(--surface-container-lowest, #f8f9fa)';
        card.innerHTML = `
            ${visualStyle}
            ${favHtml}
            <button class="card-options absolute top-3 right-3 p-1.5 bg-surface-container/50 hover:bg-surface-container/80 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all z-20">
                <i data-lucide="more-vertical" class="text-on-surface w-5 h-5"></i>
            </button>
            <div class="relative z-10 bg-white/10 dark:bg-black/20 backdrop-blur-md p-2.5 ml-5 mr-2 mb-2 rounded-xl shadow-sm border border-white/20 transition-all">
                <h3 class="text-lg font-bold text-white drop-shadow-md mb-0.5 break-words leading-tight">${nb.name}</h3>
                <p class="text-[10px] text-white/80 font-bold uppercase tracking-wide drop-shadow-md mt-1">${nb.notes.length} Notas</p>
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
        const colorIndicator = nb.coverType === 'color' ? `<div class="w-2 h-2 rounded-full" style="background-color: ${nb.coverValue || '#2b2d2e'}"></div>` : `<i data-lucide="image" class="w-3 h-3"></i>`;

        item.innerHTML = `
            ${colorIndicator}
            <span class="truncate flex-1">${nb.name}</span>
            ${favIcon}
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
    const editorContainer = document.getElementById('editor-container');

    if (dashboard) {
        dashboard.classList.add('hidden');
        dashboard.classList.remove('block');
    }

    if (notebookView) {
        notebookView.style.display = '';
        notebookView.classList.remove('hidden');
        notebookView.classList.add('flex');
    }

    if (trashView) {
        trashView.classList.add('hidden');
        trashView.classList.remove('block');
    }

    if (editorContainer) editorContainer.classList.add('hidden');

    document.getElementById('search-container').classList.remove('hidden');
    const searchNotes = document.getElementById('search-notes');
    if (searchNotes) searchNotes.value = '';

    document.getElementById('add-note').style.display = 'flex';

    renderSidebar();
    renderNotesList();
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
            id: Date.now().toString(),
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
