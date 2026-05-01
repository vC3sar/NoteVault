import { state } from './state.js';
import { refreshIcons } from './utils.js';
import { renderNotebookGrid, renderSidebar } from './notebooks.js';
import { renderTrashList, cleanupOrphans, cleanupTrash } from './notes.js';

export function applyTheme(theme) {
    const html = document.documentElement;
    if (theme === 'dark') {
        html.classList.add('dark');
        html.classList.remove('light');
    } else if (theme === 'light') {
        html.classList.add('light');
        html.classList.remove('dark');
    } else {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            html.classList.add('dark');
            html.classList.remove('light');
        } else {
            html.classList.add('light');
            html.classList.remove('dark');
        }
    }
}

export function showDashboard(view = state.currentView) {
    state.activeNotebookId = null;
    state.activeNoteId = null;
    state.currentView = view;

    const dashboard = document.getElementById('dashboard');
    const notebookView = document.getElementById('notebook-view');
    const trashView = document.getElementById('trash-view');

    if (dashboard) {
        dashboard.classList.remove('hidden');
        dashboard.classList.add('block');
    }

    if (notebookView) {
        notebookView.classList.remove('flex');
        notebookView.classList.add('hidden');
    }

    if (trashView) {
        trashView.classList.remove('block');
        trashView.classList.add('hidden');
    }

    const searchContainer = document.getElementById('search-container');
    if (searchContainer) searchContainer.classList.add('hidden');

    const searchNotebooks = document.getElementById('search-notebooks');
    if (searchNotebooks) searchNotebooks.value = '';

    cleanupOrphans();

    const addNoteBtn = document.getElementById('add-note');
    if (addNoteBtn) addNoteBtn.style.display = 'none';

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (view === 'all') {
        document.getElementById('nav-library').classList.add('active');
        document.getElementById('dashboard-title').textContent = 'Librería';
        document.getElementById('dashboard-subtitle').textContent = 'Todas tus libretas';
    } else if (view === 'favorites') {
        document.getElementById('nav-favorites').classList.add('active');
        document.getElementById('dashboard-title').textContent = 'Favoritos';
        document.getElementById('dashboard-subtitle').textContent = 'Tus libretas destacadas';
    }

    renderNotebookGrid();
    renderSidebar();
}

export function showTrash() {
    state.activeNotebookId = null;
    state.activeNoteId = null;
    state.currentView = 'trash';

    const dashboard = document.getElementById('dashboard');
    const notebookView = document.getElementById('notebook-view');
    const trashView = document.getElementById('trash-view');

    if (dashboard) {
        dashboard.classList.remove('block');
        dashboard.classList.add('hidden');
    }
    if (notebookView) {
        notebookView.classList.remove('flex');
        notebookView.classList.add('hidden');
    }
    if (trashView) {
        trashView.classList.remove('hidden');
        trashView.classList.add('block');
        
        // Update subtitle with current retention days
        const subtitle = trashView.querySelector('p');
        if (subtitle) {
            const days = state.settings.trashRetentionDays || 30;
            subtitle.textContent = `Notas eliminadas (se borrarán automáticamente tras ${days} días - Puedes cambiarlo en configuración)`;
        }
    }

    const searchContainer = document.getElementById('search-container');
    if (searchContainer) searchContainer.classList.add('hidden');

    const addNoteBtn = document.getElementById('add-note');
    if (addNoteBtn) addNoteBtn.style.display = 'none';

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navTrash = document.getElementById('nav-trash');
    if (navTrash) navTrash.classList.add('active');

    cleanupTrash(); // Proactive cleanup when entering trash
    renderTrashList();
    renderSidebar();
}

export let currentZoom = 100;

export function updateZoom(newZoom) {
    const editorContainer = document.getElementById('editor-container');
    const zoomSlider = document.getElementById('zoom-slider');
    const zoomLabel = document.getElementById('zoom-label');

    currentZoom = Math.min(Math.max(newZoom, 50), 200);
    if (zoomSlider) zoomSlider.value = currentZoom;
    if (zoomLabel) zoomLabel.textContent = `${currentZoom}%`;
    if (editorContainer) editorContainer.style.zoom = currentZoom / 100;
}
