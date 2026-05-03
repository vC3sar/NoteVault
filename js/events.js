import { state, saveAll } from './state.js';
import { applyTheme, showDashboard, showTrash, updateZoom, currentZoom, toggleSidebar, refreshSidebarState, updateGreeting } from './ui.js';
import { addNotebook, renderNotebookGrid } from './notebooks.js';
import { addNote, renderNotesList, selectNote, renderTrashList } from './notes.js';
import { executeEditAction, setupEditor } from './editor.js';
import { refreshIcons } from './utils.js';

export function setupEventListeners() {
    setupEditor();

    document.addEventListener('mousedown', (e) => {
        const menu = document.getElementById('custom-context-menu');
        if (menu && !menu.contains(e.target)) {
            menu.classList.add('hidden');
        }
    });

    window.addEventListener('resize', () => {
        document.getElementById('custom-context-menu')?.classList.add('hidden');
    });

    document.getElementById('custom-context-menu')?.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        e.preventDefault();
        e.stopPropagation();
        const action = target.getAttribute('data-action');
        const value = target.getAttribute('data-value');
        const data = value ? { command: action, value } : action;
        executeEditAction(data);
        document.getElementById('custom-context-menu').classList.add('hidden');
    });

    document.getElementById('settings-btn')?.addEventListener('click', () => {
        document.getElementById('autosave-interval-input').value = state.settings.autosaveMinutes;
        document.getElementById('theme-input').value = state.settings.theme || 'system';
        document.getElementById('trash-retention-input').value = state.settings.trashRetentionDays || 30;
        document.getElementById('media-player-toggle').checked = !!state.settings.enableMedia;
        const modal = document.getElementById('settings-modal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    });

    document.getElementById('settings-cancel')?.addEventListener('click', () => {
        const modal = document.getElementById('settings-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    });

    document.getElementById('settings-confirm')?.addEventListener('click', async () => {
        state.settings.autosaveMinutes = Math.max(1, parseInt(document.getElementById('autosave-interval-input').value) || 5);
        state.settings.theme = document.getElementById('theme-input').value;
        state.settings.trashRetentionDays = Math.max(1, parseInt(document.getElementById('trash-retention-input').value) || 30);
        state.settings.enableMedia = document.getElementById('media-player-toggle').checked;
        window.mediaTempDisabled = false;

        const modal = document.getElementById('settings-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');

        applyTheme(state.settings.theme);
        await saveAll();
        if (window.startPeriodicAutosave) window.startPeriodicAutosave();
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (state.settings.theme === 'system') applyTheme('system');
    });

    document.getElementById('add-notebook')?.addEventListener('click', addNotebook);
    document.getElementById('add-note')?.addEventListener('click', addNote);
    document.getElementById('panel-add-note')?.addEventListener('click', addNote);

    document.querySelectorAll('input[name="cover-mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.querySelectorAll('input[name="cover-mode"]').forEach(r => {
                r.closest('label').dataset.active = "false";
                r.closest('label').classList.remove('bg-surface-container-lowest', 'shadow-sm', 'opacity-100');
                r.closest('label').classList.add('opacity-60');
            });
            e.target.closest('label').dataset.active = "true";
            e.target.closest('label').classList.add('bg-surface-container-lowest', 'shadow-sm', 'opacity-100');
            e.target.closest('label').classList.remove('opacity-60');
            if (e.target.value === 'color') {
                document.getElementById('cover-color-section').style.display = 'block';
                document.getElementById('cover-image-section').style.display = 'none';
            } else {
                document.getElementById('cover-color-section').style.display = 'none';
                document.getElementById('cover-image-section').style.display = 'block';
            }
        });
    });

    document.getElementById('search-notes')?.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        if (!state.activeNotebookId) return;
        const activeNb = state.notebooks.find(n => n.id === state.activeNotebookId);
        if (!activeNb) return;
        if (!q) { renderNotesList(); return; }
        const filtered = activeNb.notes.filter(n =>
            (n.title && n.title.toLowerCase().includes(q)) ||
            (n.content && n.content.replace(/<[^>]*>?/gm, '').toLowerCase().includes(q))
        );
        const list = document.getElementById('notes-list');
        list.innerHTML = '';
        filtered.forEach(note => {
            const item = document.createElement('div');
            const isActive = state.activeNoteId === note.id;
            item.className = `group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${isActive ? 'bg-primary/5 border border-primary/10' : 'hover:bg-surface-bright border border-transparent'}`;
            item.innerHTML = `
                <div class="flex items-start overflow-hidden pr-2">
                    <div class="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 mr-3 text-on-surface-variant group-hover:text-primary transition-colors ${isActive ? 'bg-primary/10 text-primary' : ''}">
                        <i data-lucide="file-text" class="w-4 h-4"></i>
                    </div>
                    <div class="flex flex-col overflow-hidden">
                        <span class="truncate text-sm font-bold text-on-surface flex items-center">${note.title || 'Nota sin título'}</span>
                        <span class="text-[10px] text-on-surface-variant uppercase tracking-widest mt-0.5 truncate opacity-70">
                            ${note.content ? note.content.replace(/<[^>]*>?/gm, '').substring(0, 30) + '...' : 'Sin contenido'}
                        </span>
                    </div>
                </div>`;
            item.onclick = () => selectNote(note.id);
            list.appendChild(item);
        });
        refreshIcons();
    });

    document.getElementById('search-notebooks')?.addEventListener('input', (e) => renderNotebookGrid(e.target.value));

    document.getElementById('zoom-in')?.addEventListener('click', () => updateZoom(currentZoom + 10));
    document.getElementById('zoom-out')?.addEventListener('click', () => updateZoom(currentZoom - 10));
    document.getElementById('zoom-slider')?.addEventListener('input', (e) => updateZoom(parseInt(e.target.value)));

    document.getElementById('toggle-sidebar')?.addEventListener('click', toggleSidebar);

    document.getElementById('toggle-attachments')?.addEventListener('click', () => {
        const panel = document.getElementById('attachments-panel');
        const toggleBtn = document.getElementById('toggle-attachments');
        if (panel && panel.classList.contains('hidden')) {
            panel.classList.remove('hidden');
            panel.classList.add('flex');
            toggleBtn.classList.add('bg-primary/10', 'text-primary', 'border-primary/20');
            document.getElementById('search-attachments').value = '';
            import('./editor.js').then(m => m.renderAttachments());
        } else if (panel) {
            panel.classList.add('hidden');
            panel.classList.remove('flex');
            toggleBtn.classList.remove('bg-primary/10', 'text-primary', 'border-primary/20');
        }
    });

    document.getElementById('close-attachments')?.addEventListener('click', () => {
        const panel = document.getElementById('attachments-panel');
        if (panel) {
            panel.classList.add('hidden');
            panel.classList.remove('flex');
        }
        document.getElementById('toggle-attachments').classList.remove('bg-primary/10', 'text-primary', 'border-primary/20');
    });

    document.getElementById('search-attachments')?.addEventListener('input', (e) => {
        import('./editor.js').then(m => m.renderAttachments(e.target.value));
    });

    document.getElementById('pro-edition')?.addEventListener('click', function() {
        const proEdition = this;
        if (proEdition.dataset.animating === 'true') return;
        proEdition.dataset.animating = 'true';
        const text = "Pro Edition";
        proEdition.innerHTML = '';
        const fragment = document.createDocumentFragment();
        text.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.className = 'gold-letter';
            span.style.animationDelay = `${index * 0.08}s`;
            fragment.appendChild(span);
        });
        proEdition.appendChild(fragment);
        setTimeout(() => {
            proEdition.textContent = text;
            proEdition.dataset.animating = 'false';
        }, (text.length * 0.08 + 1) * 1000);
    });

    document.getElementById('profile-btn')?.addEventListener('click', () => {
        document.getElementById('profile-name-input').value = state.profile?.name || '';
        document.getElementById('profile-email-input').value = state.profile?.email || '';
        document.getElementById('profile-lang-input').value = state.profile?.lang || 'es';
        const modal = document.getElementById('profile-modal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    });

    document.getElementById('profile-cancel')?.addEventListener('click', () => {
        const modal = document.getElementById('profile-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    });

    document.getElementById('profile-confirm')?.addEventListener('click', async () => {
        state.profile = {
            name: document.getElementById('profile-name-input').value,
            email: document.getElementById('profile-email-input').value,
            lang: document.getElementById('profile-lang-input').value
        };

        const modal = document.getElementById('profile-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');

        updateGreeting();
        await saveAll();
    });

    document.getElementById('empty-trash')?.addEventListener('click', async () => {
        if (state.trash.length === 0) return;
        if (!confirm("¿Vaciar la papelera? Todas las notas se eliminarán permanentemente.")) return;
        for (const note of state.trash) await window.api.deleteNoteFile(note.id);
        state.trash = [];
        await saveAll();
        renderTrashList();
    });
}
