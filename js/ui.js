import { state, saveAll } from './state.js';
import { refreshIcons } from './utils.js';
import { renderNotebookGrid, renderSidebar, renderRecentNotes } from './notebooks.js';
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

    const navbarInfo = document.getElementById('navbar-view-info');
    const navbarSubtitle = document.getElementById('navbar-subtitle');

    if (view === 'all') {
        document.getElementById('nav-library').classList.add('active');
        if (navbarInfo) navbarInfo.classList.remove('hidden');
        if (navbarSubtitle) navbarSubtitle.textContent = 'Todas tus libretas';
    } else if (view === 'favorites') {
        document.getElementById('nav-favorites').classList.add('active');
        if (navbarInfo) navbarInfo.classList.remove('hidden');
        if (navbarSubtitle) navbarSubtitle.textContent = 'Mis Favoritos';
    }

    const dashboardActions = document.getElementById('dashboard-actions');
    if (dashboardActions) dashboardActions.style.display = 'flex';

    state.activeNotebookId = null;
    state.activeNoteId = null;
    state.currentView = view;

    renderNotebookGrid();
    renderSidebar();
    renderRecentNotes();
    updateGreeting();
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

    const dashboardActions = document.getElementById('dashboard-actions');
    if (dashboardActions) dashboardActions.style.display = 'none';

    const addNoteBtn = document.getElementById('add-note');
    if (addNoteBtn) addNoteBtn.style.display = 'none';

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navTrash = document.getElementById('nav-trash');
    if (navTrash) navTrash.classList.add('active');

    const navbarInfo = document.getElementById('navbar-view-info');
    const navbarSubtitle = document.getElementById('navbar-subtitle');
    if (navbarInfo) navbarInfo.classList.remove('hidden');
    if (navbarSubtitle) navbarSubtitle.textContent = 'NOTAS ELIMINADAS';

    cleanupTrash(); // Proactive cleanup when entering trash
    renderTrashList();
    renderSidebar();
    updateGreeting();
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

export function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    sidebar.classList.toggle('collapsed');
    state.settings.sidebarCollapsed = sidebar.classList.contains('collapsed');

    const toggleBtn = document.getElementById('toggle-sidebar');
    if (toggleBtn) {
        const icon = toggleBtn.querySelector('i');
        if (icon) {
            if (state.settings.sidebarCollapsed) {
                icon.setAttribute('data-lucide', 'panel-left-close');
            } else {
                icon.setAttribute('data-lucide', 'panel-left');
            }
            refreshIcons();
        }
    }

    saveAll();
}

export function refreshSidebarState() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    if (state.settings.sidebarCollapsed) {
        sidebar.classList.add('collapsed');
    } else {
        sidebar.classList.remove('collapsed');
    }
}export function updateGreeting() {
    const greetingContainer = document.getElementById('user-greeting');
    const greetingTextEl = document.getElementById('user-greeting-text');
    if (!greetingContainer || !greetingTextEl) return;

    // Only show in Library view ('all'), if no notebook is active, and if name is defined
    if (state.currentView !== 'all' || state.activeNotebookId || !state.profile || !state.profile.name) {
        greetingContainer.classList.add('hidden');
        return;
    }

    const hours = new Date().getHours();
    let greeting = "Buenas noches";
    if (hours >= 6 && hours < 12) greeting = "Buenos días";
    else if (hours >= 12 && hours < 20) greeting = "Buenas tardes";

    greetingTextEl.textContent = `${greeting}, ${state.profile.name.split(' ')[0]}`;
    greetingContainer.classList.remove('hidden');
}

export function toggleNotesPanel() {
    const panel = document.getElementById('notes-panel');
    const showBtn = document.getElementById('show-notes-panel-btn');
    if (!panel || !showBtn) return;

    panel.classList.toggle('collapsed');
    
    // Si el panel de notas está colapsado, mostramos el botón en el editor
    if (panel.classList.contains('collapsed')) {
        showBtn.classList.remove('hidden');
    } else {
        showBtn.classList.add('hidden');
    }
}
