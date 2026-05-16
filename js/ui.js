import { state, saveAll } from './state.js';
import { refreshIcons } from './utils.js';
import { renderNotebookGrid, renderSidebar, renderRecentNotes } from './notebooks.js';
import { renderTrashList, cleanupOrphans, cleanupTrash } from './notes.js';

/**
 * js/ui.js — Renderizado y navegación de alto nivel.
 *
 * Responsabilidades:
 * - Gestionar transiciones entre vistas (dashboard, libreta, papelera, calendario).
 * - Aplicar temas, zoom y estados globales de UI (sidebar, paneles).
 *
 * Diseño:
 * - Este módulo opera sobre el DOM. La fuente de verdad del producto es `state`.
 * - Mantener funciones idempotentes: cambiar de vista debe "resetear" UI de forma segura.
 */

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
    const calendarView = document.getElementById('calendar-view');

    if (calendarView) {
        calendarView.classList.remove('block', 'flex');
        calendarView.classList.add('hidden');
    }

    if (dashboard) {
        dashboard.classList.remove('hidden');
        dashboard.classList.add('block');
    }

    if (notebookView) {
        notebookView.classList.remove('block', 'flex');
        notebookView.classList.add('hidden');
    }

    if (trashView) {
        trashView.classList.remove('block', 'flex');
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
        const navLib = document.getElementById('nav-library');
        if (navLib) navLib.classList.add('active');
        if (navbarInfo) navbarInfo.classList.remove('hidden');
        if (navbarSubtitle) navbarSubtitle.textContent = 'Todas tus libretas';
    } else if (view === 'favorites') {
        const navFav = document.getElementById('nav-favorites');
        if (navFav) navFav.classList.add('active');
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
    const calendarView = document.getElementById('calendar-view');

    if (calendarView) {
        calendarView.classList.remove('block', 'flex');
        calendarView.classList.add('hidden');
    }

    if (dashboard) {
        dashboard.classList.remove('block', 'flex');
        dashboard.classList.add('hidden');
    }
    if (notebookView) {
        notebookView.classList.remove('block', 'flex');
        notebookView.classList.add('hidden');
    }
    if (trashView) {
        trashView.classList.remove('hidden');
        trashView.classList.add('block');

        // Reflejar la política de retención actual para que el usuario entienda el borrado automático.
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

export function showCalendar() {
    state.activeNotebookId = null;
    state.activeNoteId = null;
    state.currentView = 'calendar';

    const dashboard = document.getElementById('dashboard');
    const notebookView = document.getElementById('notebook-view');
    const trashView = document.getElementById('trash-view');
    const calendarView = document.getElementById('calendar-view');

    if (dashboard) {
        dashboard.classList.remove('block', 'flex');
        dashboard.classList.add('hidden');
    }
    if (notebookView) {
        notebookView.classList.remove('block', 'flex');
        notebookView.classList.add('hidden');
    }
    if (trashView) {
        trashView.classList.remove('block', 'flex');
        trashView.classList.add('hidden');
    }
    if (calendarView) {
        calendarView.classList.remove('hidden');
        calendarView.classList.add('flex');
    }

    const searchContainer = document.getElementById('search-container');
    if (searchContainer) searchContainer.classList.add('hidden');

    const dashboardActions = document.getElementById('dashboard-actions');
    if (dashboardActions) dashboardActions.style.display = 'none';

    const addNoteBtn = document.getElementById('add-note');
    if (addNoteBtn) addNoteBtn.style.display = 'none';

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navCalendar = document.getElementById('nav-calendar');
    if (navCalendar) navCalendar.classList.add('active');

    const navbarInfo = document.getElementById('navbar-view-info');
    const navbarSubtitle = document.getElementById('navbar-subtitle');
    if (navbarInfo) navbarInfo.classList.remove('hidden');
    if (navbarSubtitle) navbarSubtitle.textContent = 'CALENDARIO Y HORARIO';

    renderSidebar();
    updateGreeting();

    if (window.calendarEngine) {
        window.calendarEngine.initCalendar();
    }
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
}
let greetingInterval = null;
let greetingToggleState = 0; // 0: Clase, 1: Saludo

export function updateGreeting() {
    // Reiniciar el estado para que el primer render priorice información contextual (clases) si existe.
    if (greetingInterval) {
        clearInterval(greetingInterval);
        greetingInterval = null;
    }

    greetingToggleState = 0;

    const render = () => {
        const greetingContainer = document.getElementById('user-greeting');
        const greetingTextEl = document.getElementById('user-greeting-text');
        if (!greetingContainer || !greetingTextEl) return;

        // Mostrar sólo en la vista de biblioteca y cuando exista un perfil con nombre.
        if (state.currentView !== 'all' || state.activeNotebookId || !state.profile || !state.profile.name) {
            greetingContainer.classList.add('hidden');
            return;
        }

        const now = new Date();
        const hours = now.getHours();
        const name = state.profile.name.split(' ')[0];

        // Determinar saludo base según hora local.
        let greetingText = "Buenas noches";
        if (hours >= 6 && hours < 12) greetingText = "Buenos días";
        else if (hours >= 12 && hours < 20) greetingText = "Buenas tardes";
        const baseGreeting = `${greetingText}, ${name}`;

        // Construir mensaje contextual de horario (si aplica) para alternar con el saludo.
        let classMessageHTML = null;
        if (state.calendar && state.calendar.schedule) {
            let currentDay = now.getDay();
            if (currentDay === 0) currentDay = 7; // Domingo = 7 (aunque el select llegue a 6)

            const currentHourStr = hours.toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
            const todaysClasses = (state.calendar.schedule || []).filter(s => parseInt(s.day) === currentDay);

            if (todaysClasses.length > 0) {
                todaysClasses.sort((a, b) => a.start.localeCompare(b.start));

                let activeClass = todaysClasses.find(c => currentHourStr >= c.start && currentHourStr <= c.end);
                let nextClass = todaysClasses.find(c => currentHourStr < c.start);

                if (activeClass) {
                    classMessageHTML = `<span class="font-light text-on-surface-variant">Estás en clase de</span> <span class="font-bold text-primary">${activeClass.subject}</span>`;
                } else if (nextClass) {
                    classMessageHTML = `<span class="font-light text-on-surface-variant">Próxima clase:</span> <span class="font-bold text-primary">${nextClass.subject}</span> <span class="font-medium text-on-surface-variant/50 text-xl ml-1">a las ${nextClass.start}</span>`;
                }
            }
        }

        // Si no hay clases hoy, mostrar saludo y detener cualquier intervalo de alternancia.
        if (!classMessageHTML) {
            greetingTextEl.textContent = baseGreeting;
            greetingTextEl.className = 'text-4xl font-black text-on-surface tracking-tighter';
            greetingContainer.classList.remove('hidden');
            if (greetingInterval) {
                clearInterval(greetingInterval);
                greetingInterval = null;
            }
            return;
        }

        // Si hay clases, asegurar un único intervalo para alternar entre saludo y agenda.
        if (!greetingInterval) {
            greetingInterval = setInterval(() => {
                greetingToggleState = (greetingToggleState + 1) % 2;
                render();
            }, 8000);
        }

        // Render con transición: evitar cambios bruscos al alternar contenidos.
        greetingTextEl.style.opacity = '0';
        setTimeout(() => {
            if (greetingToggleState === 0) {
                greetingTextEl.innerHTML = classMessageHTML;
                greetingTextEl.className = 'text-3xl tracking-tight mt-1';
            } else {
                greetingTextEl.textContent = baseGreeting;
                greetingTextEl.className = 'text-4xl font-black text-on-surface tracking-tighter';
            }
            greetingTextEl.style.opacity = '1';
            greetingTextEl.style.transition = 'opacity 0.3s ease';
        }, 300);

        greetingContainer.classList.remove('hidden');
    };

    render();
}

export function toggleNotesPanel() {
    const panel = document.getElementById('notes-panel');
    const showBtn = document.getElementById('show-notes-panel-btn');
    if (!panel || !showBtn) return;

    panel.classList.toggle('collapsed');

    // Si el panel está colapsado, mantener un affordance para reabrir desde el editor.
    if (panel.classList.contains('collapsed')) {
        showBtn.classList.remove('hidden');
    } else {
        showBtn.classList.add('hidden');
    }
}
