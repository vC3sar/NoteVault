import { state, saveAll } from './state.js';
import { applyTheme, showDashboard, showTrash, updateZoom, currentZoom, toggleSidebar, refreshSidebarState, updateGreeting } from './ui.js';
import { addNotebook, renderNotebookGrid } from './notebooks.js';
import { addNote, renderNotesList, selectNote, renderTrashList } from './notes.js';
import { executeEditAction, setupEditor, handleInput } from './editor.js';
import { refreshIcons, escapeHTML, stripHTML, showToast } from './utils.js';

export function setupEventListeners() {
    setupEditor();
    const insertTemplates = {
        'table-3x3': `<table><thead><tr><th style="text-align: center;">Encabezado 1</th><th style="text-align: center;">Encabezado 2</th><th style="text-align: center;">Encabezado 3</th></tr></thead><tbody><tr><td>Dato 1</td><td>Dato 2</td><td>Dato 3</td></tr><tr><td>Dato 4</td><td>Dato 5</td><td>Dato 6</td></tr></tbody></table><p><br></p>`,
        'table-4x2': `<table><thead><tr><th style="text-align: center;">Campo</th><th style="text-align: center;">Valor</th></tr></thead><tbody><tr><td>Elemento 1</td><td>Detalle</td></tr><tr><td>Elemento 2</td><td>Detalle</td></tr><tr><td>Elemento 3</td><td>Detalle</td></tr><tr><td>Elemento 4</td><td>Detalle</td></tr></tbody></table><p><br></p>`,
        'h2': `<h2>Título de Sección</h2><p><br></p>`,
        'h3': `<h3>Subsección</h3><p><br></p>`,
        'divider': `<hr><p><br></p>`,
        'bullet-list': `<ul><li>Punto 1</li><li>Punto 2</li><li>Punto 3</li></ul><p><br></p>`,
        'number-list': `<ol><li>Paso 1</li><li>Paso 2</li><li>Paso 3</li></ol><p><br></p>`,
        'check-list': `<ul class="editor-check-list"><li><input type="checkbox"> Tarea 1</li><li><input type="checkbox"> Tarea 2</li></ul><p><br></p>`,
        'blockquote': `<blockquote>Cita o referencia importante...</blockquote><p><br></p>`,
        'code-block': `<pre><code>// Escribe tu código aquí</code></pre><p><br></p>`,
        'callout': `<div class="insert-callout" style="border-left:4px solid #6366f1;padding:.5rem .75rem;background:rgba(99,102,241,.08);border-radius:.4rem;display:flex;align-items:center;gap:.5rem;"><span class="insert-callout-icon-wrap" contenteditable="false"><i data-lucide="lightbulb" class="insert-callout-icon" aria-hidden="true"></i></span><div><strong class="insert-callout-label" contenteditable="false">TIP:</strong> <span class="insert-callout-placeholder" data-callout-placeholder="true">Escribe aquí una nota destacada.</span></div></div><p><br></p>`
    };

    const openInsertModal = () => {
        const modal = document.getElementById('insert-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        refreshIcons();
    };

    const closeInsertModal = () => {
        const modal = document.getElementById('insert-modal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    };

    const setInsertTab = (tab) => {
        document.querySelectorAll('[data-insert-tab]').forEach(btn => {
            const active = btn.getAttribute('data-insert-tab') === tab;
            btn.classList.toggle('bg-primary/10', active);
            btn.classList.toggle('text-primary', active);
            btn.classList.toggle('border-primary/30', active);
        });
        document.querySelectorAll('[data-insert-panel]').forEach(panel => {
            const visible = panel.getAttribute('data-insert-panel') === tab;
            panel.classList.toggle('hidden', !visible);
        });
    };

    const insertHtmlSnippet = (html) => {
        const editor = document.getElementById('editor');
        if (!editor) return;
        editor.focus();
        document.execCommand('insertHTML', false, html);
        handleInput();
    };

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

    document.addEventListener('mousedown', (e) => {
        const target = e.target.closest('[data-editor-action], #open-insert-modal');
        if (!target) return;
        // Evita perder la selección del editor al presionar el botón del header.
        e.preventDefault();
    });

    document.addEventListener('click', (e) => {
        const target = e.target.closest('[data-editor-action]');
        if (!target) return;
        e.preventDefault();
        if (!state.activeNoteId) return;

        const action = target.getAttribute('data-editor-action');
        if (!action) return;

        const requiresSelection = new Set([
            'bold', 'italic', 'underline', 'strikethrough',
            'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull',
            'breakWords'
        ]);

        const sel = window.getSelection();
        const hasSelection = !!(sel && sel.rangeCount && sel.toString().trim().length > 0);

        if (requiresSelection.has(action) && !hasSelection) {
            showToast('Selecciona texto para aplicar esta acción.', 'error');
            return;
        }

        executeEditAction(action);
    });

    // Delegación unificada de eventos `click`: reduce listeners y funciona bien con partials dinámicos.
    document.addEventListener('click', async (e) => {
        const target = e.target;

        // Modal de configuración: hidratar valores desde `state` y aplicar cambios persistentes.
        if (target.closest('#settings-btn')) {
            const autosaveInput = document.getElementById('autosave-interval-input');
            const themeInput = document.getElementById('theme-input');
            const trashInput = document.getElementById('trash-retention-input');
            const mediaToggle = document.getElementById('media-player-toggle');
            
            if (autosaveInput) autosaveInput.value = state.settings.autosaveMinutes;
            if (themeInput) themeInput.value = state.settings.theme || 'system';
            if (trashInput) trashInput.value = state.settings.trashRetentionDays || 30;
            if (mediaToggle) mediaToggle.checked = !!state.settings.enableMedia;
            
            const modal = document.getElementById('settings-modal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        }

        if (target.closest('#settings-cancel')) {
            const modal = document.getElementById('settings-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        }

        if (target.closest('#settings-confirm')) {
            const autosaveInput = document.getElementById('autosave-interval-input');
            const themeInput = document.getElementById('theme-input');
            const trashInput = document.getElementById('trash-retention-input');
            const mediaToggle = document.getElementById('media-player-toggle');

            if (autosaveInput) state.settings.autosaveMinutes = Math.max(1, parseInt(autosaveInput.value) || 5);
            if (themeInput) state.settings.theme = themeInput.value;
            if (trashInput) state.settings.trashRetentionDays = Math.max(1, parseInt(trashInput.value) || 30);
            if (mediaToggle) state.settings.enableMedia = mediaToggle.checked;
            
            window.mediaTempDisabled = false;

            const modal = document.getElementById('settings-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }

            applyTheme(state.settings.theme);
            await saveAll();
            if (window.startPeriodicAutosave) window.startPeriodicAutosave();
        }

        // Modal de perfil: editar y persistir datos del usuario (nombre, email, idioma).
        if (target.closest('#profile-btn')) {
            const nameInput = document.getElementById('profile-name-input');
            const emailInput = document.getElementById('profile-email-input');
            const langInput = document.getElementById('profile-lang-input');
            
            if (nameInput) nameInput.value = state.profile?.name || '';
            if (emailInput) emailInput.value = state.profile?.email || '';
            if (langInput) langInput.value = state.profile?.lang || 'es';
            
            const modal = document.getElementById('profile-modal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        }

        if (target.closest('#profile-cancel')) {
            const modal = document.getElementById('profile-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        }

        if (target.closest('#profile-confirm')) {
            const nameInput = document.getElementById('profile-name-input');
            const emailInput = document.getElementById('profile-email-input');
            const langInput = document.getElementById('profile-lang-input');
            
            state.profile = {
                name: nameInput ? nameInput.value : '',
                email: emailInput ? emailInput.value : '',
                lang: langInput ? langInput.value : 'es'
            };

            const modal = document.getElementById('profile-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }

            updateGreeting();
            await saveAll();
        }

        // Acciones de UI: creación, navegación y controles globales (sidebar/zoom).
        if (target.closest('#add-notebook')) {
            addNotebook();
        }

        if (target.closest('#add-note') || target.closest('#panel-add-note')) {
            addNote();
        }

        if (target.closest('#open-insert-modal')) {
            if (!state.activeNoteId) return;
            setInsertTab('recommended');
            openInsertModal();
        }

        if (target.closest('#insert-modal-close')) {
            closeInsertModal();
        }

        if (target.id === 'insert-modal') {
            closeInsertModal();
        }

        if (target.closest('#insert-modal')) {
            const tabBtn = target.closest('[data-insert-tab]');
            if (tabBtn) {
                setInsertTab(tabBtn.getAttribute('data-insert-tab'));
            }

            const card = target.closest('[data-insert-action]');
            if (card) {
                if (!state.activeNoteId) return;
                const key = card.getAttribute('data-insert-action');
                const html = insertTemplates[key];
                if (html) insertHtmlSnippet(html);
                closeInsertModal();
            }
        }

        if (target.closest('#toggle-sidebar')) {
            toggleSidebar();
        }

        if (target.closest('#zoom-in')) {
            updateZoom(currentZoom + 10);
        }

        if (target.closest('#zoom-out')) {
            updateZoom(currentZoom - 10);
        }

        if (target.closest('#empty-trash')) {
            if (state.trash.length === 0) return;
            if (!confirm("¿Vaciar la papelera? Todas las notas se eliminarán permanentemente.")) return;
            for (const note of state.trash) await window.api.deleteNoteFile(note.id);
            state.trash = [];
            await saveAll();
            renderTrashList();
        }

        // Panel de adjuntos: abrir/cerrar y refrescar lista sin acoplarse al editor.
        if (target.closest('#toggle-attachments')) {
            const panel = document.getElementById('attachments-panel');
            const toggleBtn = document.getElementById('toggle-attachments');
            if (panel && panel.classList.contains('hidden')) {
                panel.classList.remove('hidden');
                panel.classList.add('flex');
                if (toggleBtn) toggleBtn.classList.add('bg-primary/10', 'text-primary', 'border-primary/20');
                const searchInput = document.getElementById('search-attachments');
                if (searchInput) searchInput.value = '';
                import('./editor.js').then(m => m.renderAttachments());
            } else if (panel) {
                panel.classList.add('hidden');
                panel.classList.remove('flex');
                if (toggleBtn) toggleBtn.classList.remove('bg-primary/10', 'text-primary', 'border-primary/20');
            }
        }

        if (target.closest('#close-attachments')) {
            const panel = document.getElementById('attachments-panel');
            if (panel) {
                panel.classList.add('hidden');
                panel.classList.remove('flex');
            }
            const toggleBtn = document.getElementById('toggle-attachments');
            if (toggleBtn) toggleBtn.classList.remove('bg-primary/10', 'text-primary', 'border-primary/20');
        }

        // Selección de portada: alterna UI entre color e imagen al editar libretas.
        if (target.closest('input[name="cover-mode"]')) {
            const radio = target.closest('input[name="cover-mode"]');
            document.querySelectorAll('input[name="cover-mode"]').forEach(r => {
                const label = r.closest('label');
                if (label) {
                    label.dataset.active = "false";
                    label.classList.remove('bg-surface-container-lowest', 'shadow-sm', 'opacity-100');
                    label.classList.add('opacity-60');
                }
            });
            const label = radio.closest('label');
            if (label) {
                label.dataset.active = "true";
                label.classList.add('bg-surface-container-lowest', 'shadow-sm', 'opacity-100');
                label.classList.remove('opacity-60');
            }
            const colorSec = document.getElementById('cover-color-section');
            const imageSec = document.getElementById('cover-image-section');
            if (radio.value === 'color') {
                if (colorSec) colorSec.style.display = 'block';
                if (imageSec) imageSec.style.display = 'none';
            } else {
                if (colorSec) colorSec.style.display = 'none';
                if (imageSec) imageSec.style.display = 'block';
            }
        }

        // Animación decorativa del badge "Pro Edition". Mantener aislada del flujo de producto.
        if (target.closest('#pro-edition')) {
            const proEdition = target.closest('#pro-edition');
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
        }
    });

    // Delegación unificada de eventos `input` para búsqueda, zoom y filtros.
    document.addEventListener('input', (e) => {
        const target = e.target;

        if (target.id === 'search-notes') {
            const q = target.value.toLowerCase();
            if (!state.activeNotebookId) return;
            const activeNb = state.notebooks.find(n => n.id === state.activeNotebookId);
            if (!activeNb) return;
            if (!q) { renderNotesList(); return; }
            const filtered = activeNb.notes.filter(n =>
                (n.title && n.title.toLowerCase().includes(q)) ||
                (n.content && n.content.replace(/<[^>]*>?/gm, '').toLowerCase().includes(q))
            );
            const list = document.getElementById('notes-list');
            if (list) {
                list.innerHTML = '';
                filtered.forEach(note => {
                    const item = document.createElement('div');
                    const isActive = state.activeNoteId === note.id;
                    const plainPreview = stripHTML(note.content || '');
                    item.className = `group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${isActive ? 'bg-primary/5 border border-primary/10' : 'hover:bg-surface-bright border border-transparent'}`;
                    item.innerHTML = `
                        <div class="flex items-start overflow-hidden pr-2">
                            <div class="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 mr-3 text-on-surface-variant group-hover:text-primary transition-colors ${isActive ? 'bg-primary/10 text-primary' : ''}">
                                <i data-lucide="file-text" class="w-4 h-4"></i>
                            </div>
                            <div class="flex flex-col overflow-hidden">
                                <span class="truncate text-sm font-bold text-on-surface flex items-center">${escapeHTML(note.title || 'Nota sin título')}</span>
                                <span class="text-[10px] text-on-surface-variant uppercase tracking-widest mt-0.5 truncate opacity-70">
                                    ${escapeHTML(plainPreview ? `${plainPreview.substring(0, 30)}${plainPreview.length > 30 ? '...' : ''}` : 'Sin contenido')}
                                </span>
                            </div>
                        </div>`;
                    item.onclick = () => selectNote(note.id);
                    list.appendChild(item);
                });
                refreshIcons();
            }
        }

        if (target.id === 'search-notebooks') {
            renderNotebookGrid(target.value);
        }

        if (target.id === 'zoom-slider') {
            updateZoom(parseInt(target.value));
        }

        if (target.id === 'search-attachments') {
            import('./editor.js').then(m => m.renderAttachments(target.value));
        }
    });

    // Preferencia del SO: reaccionar sólo cuando el tema está configurado como `system`.
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (state.settings.theme === 'system') applyTheme('system');
    });
}
