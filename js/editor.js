import { state, saveAll } from './state.js';
import { refreshIcons, cleanHTML, sanitizeHTML, escapeHTML, hashString, buildPreview, showToast } from './utils.js';
import { renderNotesList } from './notes.js';

let savedSelectionRange = null;
let lastRightClickedImage = null;
let activeTableCell = null;
let contextTargetElement = null;

function capitalizeSentence(text) {
    const lower = String(text || '').toLocaleLowerCase('es');
    return lower.replace(/^(\s*)(\S)/, (_, ws, first) => ws + first.toLocaleUpperCase('es'));
}

function capitalizeWords(text) {
    return String(text || '')
        .toLocaleLowerCase('es')
        .replace(/\b([^\s]+)/g, (word) => word.charAt(0).toLocaleUpperCase('es') + word.slice(1));
}

function transformSelectedText(mode) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    const range = sel.getRangeAt(0);
    const selected = range.toString();
    if (!selected) return false;

    let transformed = selected;
    if (mode === 'upper') transformed = selected.toLocaleUpperCase('es');
    else if (mode === 'lower') transformed = selected.toLocaleLowerCase('es');
    else if (mode === 'sentence') transformed = capitalizeSentence(selected);
    else if (mode === 'title') transformed = capitalizeWords(selected);
    else return false;

    if (transformed === selected) return false;

    range.deleteContents();
    const textNode = document.createTextNode(transformed);
    range.insertNode(textNode);

    const newRange = document.createRange();
    newRange.selectNodeContents(textNode);
    sel.removeAllRanges();
    sel.addRange(newRange);
    savedSelectionRange = newRange.cloneRange();
    return true;
}

function applyBreakWordsToSelection() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.toString().length === 0) return false;
    const text = escapeHTML(sel.toString());
    const html = `<span style="overflow-wrap:anywhere;word-break:break-word;">${text}</span>`;
    document.execCommand('insertHTML', false, html);
    return true;
}

export function executeEditAction(data) {
    if (!state.activeNoteId) return;

    if (data === 'deleteElement') {
        if (!contextTargetElement || !document.body.contains(contextTargetElement)) return;
        contextTargetElement.remove();
        contextTargetElement = null;
        handleInput();
        return;
    }
    if (data === 'copy' || data === 'cut' || data === 'selectAll') {
        document.execCommand(data, false, null);
        if (data === 'cut') handleInput();
        return;
    }
    if (data === 'paste') {
        const pasted = document.execCommand('paste', false, null);
        if (!pasted) showToast('Usa Ctrl+V para pegar.', 'neutral');
        else handleInput();
        return;
    }

    const sel = window.getSelection();
    const hasTextSelection = !!(sel && sel.rangeCount && sel.toString().trim().length > 0);

    if (typeof data === 'object' && data.command === 'textTransform' && !hasTextSelection) {
        showToast('Selecciona texto para transformar.', 'error');
        return;
    }

    const hasLiveSelection = !!(sel && sel.rangeCount && sel.toString().length > 0);
    if (!hasLiveSelection && savedSelectionRange) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRange);
    }

    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);

    if (data === 'pick-custom-color') {
        const rect = range.getBoundingClientRect();
        const picker = document.getElementById('text-color-picker');
        if (picker) {
            picker.style.display = 'block';
            picker.style.position = 'absolute';
            picker.style.left = `${rect.left}px`;
            picker.style.top = `${rect.bottom + window.scrollY}px`;
            picker.click();
        }
        return;
    }

    if (typeof data === 'object' && data.command === 'fontSize') {
        const sizeMap = { '12px': '1', '18px': '3', '20px': '4', '28px': '5', '36px': '6' };
        document.execCommand('fontSize', false, sizeMap[data.value] || '3');
        handleInput();
    }
    else if (typeof data === 'object' && data.command === 'highlight') {
        if (data.value === 'none') {
            document.execCommand('removeFormat', false, null);
        } else {
            const colorMap = {
                'yellow': '#fef08a',
                'green': '#86efac',
                'blue': '#bfdbfe',
                'red': '#fecaca',
                'orange': '#fdba74',
                'pink': '#f9a8d4',
                'purple': '#d8b4fe',
                'indigo': '#c7d2fe',
                'teal': '#99f6e4',
                'cyan': '#a5f3fc',
                'lime': '#d9f99d',
                'amber': '#fde68a',
                'rose': '#fecdd3',
                'gray': '#e5e7eb',
                'brown': '#d6b38a',
                'mint': '#bbf7d0'
            };
            document.execCommand('backColor', false, colorMap[data.value] || '#fef08a');
        }
        handleInput();
    }
    else if (data === 'removeFormat' || (typeof data === 'object' && data.command === 'removeColor')) {
        document.execCommand('removeFormat', false, null);
        handleInput();
    }
    else if (data === 'breakWords') {
        applyBreakWordsToSelection();
    }
    else if (typeof data === 'object' && data.command === 'textTransform') {
        transformSelectedText(data.value);
    }
    else if (typeof data === 'string') {
        document.execCommand(data, false, null);
    }
    else if (data.command === 'foreColor') {
        let color = data.value;
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
            const darkColors = { '#37352f': '#e2e8f0', '#000000': '#f1f5f9', '#1a1a1a': '#f1f5f9' };
            color = darkColors[color.toLowerCase()] || color;
        }
        document.execCommand('foreColor', false, color);
    }
    else {
        document.execCommand(data.command, false, data.value);
    }

    if (sel.rangeCount > 0) {
        savedSelectionRange = sel.getRangeAt(0).cloneRange();
    }
    handleInput();
}

export async function forceSaveNote() {
    if (!state.activeNoteId) return { status: 'no-note' };
    const notebook = state.notebooks.find(n => n.id === state.activeNotebookId);
    if (!notebook) return { status: 'no-note' };
    const note = notebook.notes.find(n => n.id === state.activeNoteId);
    if (!note) return { status: 'no-note' };

    const title = document.getElementById('note-title').value;
    const editor = document.getElementById('editor');
    const content = editor ? editor.innerHTML : '';
    const sanitizedContent = cleanHTML(content);

    const titleChanged = note.title !== title;
    const newHash = hashString(sanitizedContent);

    if (!titleChanged && note.previewHash === newHash) {
        return { status: 'no-changes' }; // Sin cambios, omitir I/O
    }

    note.title = title;
    note.content = sanitizedContent;
    note.lastEdited = Date.now();

    const newPreview = buildPreview(sanitizedContent);
    if (newPreview) {
        note.preview = newPreview;
        note.previewHash = newHash;
    }

    if (editor && sanitizedContent !== content) {
        editor.innerHTML = sanitizedContent;
        refreshIcons();
    }

    try {
        await window.api.saveNoteContent(state.activeNoteId, sanitizedContent);
        await saveAll();
    } catch (error) {
        console.error('Error en guardado manual/auto:', error);
        return { status: 'error', error };
    }

    if (titleChanged) {
        renderNotesList();
    }
    updateWordCount();
    updateAttachmentsIfNeeded();
    return { status: 'saved' };
}

let autosaveTimer;
export const handleInput = () => {
    if (!state.activeNoteId) return;

    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(async () => {
        await forceSaveNote();
    }, 1000);
};

export function updateWordCount() {
    const editor = document.getElementById('editor');
    if (!editor) return;

    const text = editor.innerText || editor.textContent || "";
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const count = words.length;

    const countEl = document.getElementById('word-count');
    if (countEl) {
        countEl.textContent = `${count} ${count === 1 ? 'palabra' : 'palabras'}`;
    }
}

export function updateAttachmentsIfNeeded(resetSearch = false) {
    const panel = document.getElementById('attachments-panel');
    const showAttachmentsPanel = panel && !panel.classList.contains('hidden');
    
    if (showAttachmentsPanel) {
        const searchInput = document.getElementById('search-attachments');
        if (resetSearch && searchInput) searchInput.value = '';
        renderAttachments(searchInput ? searchInput.value : '');
    }
}

export function renderAttachments(searchTerm = '') {
    const list = document.getElementById('attachments-list');
    if (!list) return;
    list.innerHTML = '';

    if (!state.activeNoteId) return;

    const editor = document.getElementById('editor');
    if (!editor) return;
    const images = Array.from(editor.querySelectorAll('img'));

    const term = searchTerm.toLowerCase();

    const filtered = images.filter(el => {
        if (!term) return true;
        const src = el.src.toLowerCase();
        const alt = (el.alt || '').toLowerCase();
        return src.includes(term) || alt.includes(term);
    });

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="flex flex-col items-center justify-center p-6 text-center text-on-surface-variant opacity-60">
                <i data-lucide="${term ? 'search-x' : 'image'}" class="w-8 h-8 mb-2"></i>
                <p class="text-xs font-medium">${term ? 'No se encontraron imágenes' : 'No hay imágenes adjuntas'}</p>
            </div>
        `;
        refreshIcons();
        return;
    }

    filtered.forEach(el => {
        const alt = el.alt || 'Imagen adjunta';
        const div = document.createElement('div');
        div.className = 'group rounded-xl border border-transparent hover:border-outline-variant/30 hover:bg-surface-container hover:shadow-sm cursor-pointer transition-all overflow-hidden bg-surface-container-lowest';
        div.innerHTML = `
            <div class="w-full aspect-video bg-surface-variant overflow-hidden">
                <img src="${el.src}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
            </div>
            <div class="px-2 py-1.5">
                <span class="text-xs font-medium text-on-surface-variant truncate block">${alt !== 'Imagen adjunta' ? alt : 'Sin descripción'}</span>
            </div>
        `;

        div.onclick = () => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });

            const oldOutline = el.style.outline;
            const oldTransition = el.style.transition;
            const oldOutlineOffset = el.style.outlineOffset;

            el.style.transition = 'outline 0.3s ease';
            el.style.outline = '3px solid #4338ca';
            el.style.outlineOffset = '2px';

            setTimeout(() => {
                el.style.outline = '3px solid transparent';
                setTimeout(() => {
                    el.style.outline = oldOutline;
                    el.style.transition = oldTransition;
                    el.style.outlineOffset = oldOutlineOffset;
                }, 300);
            }, 1200);
        };

        list.appendChild(div);
    });
    refreshIcons();
}

export function setupEditor() {
    const editor = document.getElementById('editor');
    if (!editor) return;
    const VIEWPORT_MARGIN = 12;
    const tableToolbar = document.getElementById('table-quick-toolbar');
    const previewHint = document.getElementById('table-preview-hint');
    const submenuTimers = new WeakMap();

    const hideTableToolbar = () => {
        if (!tableToolbar) return;
        tableToolbar.classList.add('hidden');
        tableToolbar.classList.remove('flex');
        activeTableCell = null;
        clearTablePreview();
        if (previewHint) {
            previewHint.textContent = 'Preview';
            previewHint.classList.remove('text-green-700', 'text-red-700', 'dark:text-green-300', 'dark:text-red-300');
            previewHint.classList.add('text-on-surface-variant');
        }
    };

    const placeTableToolbar = (cell) => {
        if (!tableToolbar || !cell) return;
        const panel = document.getElementById('editor-panel');
        if (!panel) return;
        const cellRect = cell.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();

        const top = Math.max(8, cellRect.top - panelRect.top - tableToolbar.offsetHeight - 8);
        const left = Math.max(8, cellRect.left - panelRect.left);

        tableToolbar.style.top = `${top}px`;
        tableToolbar.style.left = `${left}px`;
        tableToolbar.classList.remove('hidden');
        tableToolbar.classList.add('flex');
    };

    const getTableInfo = () => {
        if (!activeTableCell) return null;
        const row = activeTableCell.parentElement;
        const section = row?.parentElement;
        const table = section?.closest('table');
        if (!row || !section || !table) return null;
        const rows = Array.from(section.querySelectorAll('tr'));
        const rowIndex = rows.indexOf(row);
        const cells = Array.from(row.children).filter(el => el.tagName === 'TD' || el.tagName === 'TH');
        const colIndex = cells.indexOf(activeTableCell);
        if (rowIndex < 0 || colIndex < 0) return null;
        return { table, section, row, rows, rowIndex, colIndex, cellsCount: cells.length };
    };

    const clearTablePreview = () => {
        editor.querySelectorAll('.table-preview-cell,.table-preview-row,.table-preview-col,.table-preview-resize-plus,.table-preview-resize-minus,.table-preview-row-add,.table-preview-row-del,.table-preview-col-add,.table-preview-col-del,.table-preview-cell-del,.table-preview-merge,.table-preview-split,.table-preview-merge-anchor,.table-preview-merge-removed')
            .forEach(el => {
                el.classList.remove('table-preview-cell', 'table-preview-row', 'table-preview-col', 'table-preview-resize-plus', 'table-preview-resize-minus', 'table-preview-row-add', 'table-preview-row-del', 'table-preview-col-add', 'table-preview-col-del', 'table-preview-cell-del', 'table-preview-merge', 'table-preview-split', 'table-preview-merge-anchor', 'table-preview-merge-removed');
                if (el.style) el.style.removeProperty('--split-parts');
            });
    };

    const applyTablePreview = (action) => {
        clearTablePreview();
        const info = getTableInfo();
        if (!info) return;
        const { table, row, rows, colIndex } = info;
        const addActions = new Set(['row-above', 'row-below', 'col-left', 'col-right']);
        const delActions = new Set(['del-row', 'del-col']);
        const labelMap = {
            'row-above': 'Preview: añadir fila arriba',
            'row-below': 'Preview: añadir fila abajo',
            'col-left': 'Preview: añadir columna izquierda',
            'col-right': 'Preview: añadir columna derecha',
            'del-row': 'Preview: eliminar fila',
            'del-col': 'Preview: eliminar columna',
            'merge-cells': 'Preview: combinar celdas',
            'split-cell': 'Preview: dividir celda',
            'designate-header': 'Preview: designar título',
            'widen': 'Preview: aumentar ancho',
            'narrow': 'Preview: reducir ancho'
        };
        if (previewHint) {
            previewHint.textContent = labelMap[action] || 'Preview';
            previewHint.classList.remove('text-on-surface-variant', 'text-green-700', 'text-red-700', 'dark:text-green-300', 'dark:text-red-300');
            if (addActions.has(action)) previewHint.classList.add('text-green-700', 'dark:text-green-300');
            else if (delActions.has(action)) previewHint.classList.add('text-red-700', 'dark:text-red-300');
            else previewHint.classList.add('text-on-surface-variant');
        }

        if (action === 'row-above' || action === 'row-below' || action === 'del-row') {
            row.classList.add(action === 'del-row' ? 'table-preview-row-del' : 'table-preview-row-add');
            return;
        }

        if (action === 'col-left' || action === 'col-right' || action === 'del-col') {
            rows.forEach(r => {
                const rowCells = Array.from(r.children).filter(el => el.tagName === 'TD' || el.tagName === 'TH');
                const cell = rowCells[Math.min(colIndex, rowCells.length - 1)];
                if (cell) cell.classList.add(action === 'del-col' ? 'table-preview-col-del' : 'table-preview-col-add');
            });
            return;
        }

        if (action === 'merge-cells') {
            const rowCells = Array.from(row.children).filter(el => el.tagName === 'TD' || el.tagName === 'TH');
            const selection = window.getSelection();
            let mergeCells = [];
            if (selection && selection.rangeCount) {
                const range = selection.getRangeAt(0);
                mergeCells = rowCells.filter(cell => range.intersectsNode(cell));
            }
            if (mergeCells.length < 2) {
                const current = activeTableCell;
                const next = rowCells[colIndex + 1];
                mergeCells = next ? [current, next] : [current].filter(Boolean);
            }
            if (!mergeCells.length) return;
            mergeCells[0].classList.add('table-preview-merge-anchor');
            mergeCells.slice(1).forEach(cell => cell.classList.add('table-preview-merge-removed'));
            return;
        }

        if (action === 'split-cell') {
            if (activeTableCell) {
                const span = parseInt(activeTableCell.getAttribute('colspan'), 10) || 1;
                if (span > 1) activeTableCell.style.setProperty('--split-parts', String(span));
                activeTableCell.classList.add('table-preview-split');
            }
            return;
        }

        if (action === 'designate-header') {
            if (activeTableCell) activeTableCell.classList.add('table-preview-cell');
            return;
        }

        if (action === 'widen') {
            table.classList.add('table-preview-resize-plus');
            return;
        }
        if (action === 'narrow') {
            table.classList.add('table-preview-resize-minus');
        }
    };

    const createCellLike = (sourceCell) => {
        const tag = sourceCell && sourceCell.tagName === 'TH' ? 'th' : 'td';
        const cell = document.createElement(tag);
        cell.innerHTML = '<br>';
        return cell;
    };

    const clearCalloutPlaceholder = (placeholder) => {
        if (!placeholder || placeholder.dataset.calloutPlaceholder !== 'true') return;
        delete placeholder.dataset.calloutPlaceholder;
        placeholder.classList.remove('insert-callout-placeholder');
        placeholder.textContent = '';
    };

    const applyTableAction = (action) => {
        const info = getTableInfo();
        if (!info) return;
        const { table, section, row, rows, rowIndex, colIndex, cellsCount } = info;
        const selection = window.getSelection();

        const getSelectedCells = () => {
            if (!selection || !selection.rangeCount) return [];
            const range = selection.getRangeAt(0);
            const rowCells = Array.from(row.children).filter(el => el.tagName === 'TD' || el.tagName === 'TH');
            return rowCells.filter(cell => range.intersectsNode(cell));
        };

        if (action === 'row-above' || action === 'row-below') {
            const newRow = document.createElement('tr');
            const sourceCells = Array.from(row.children).filter(el => el.tagName === 'TD' || el.tagName === 'TH');
            sourceCells.forEach(sourceCell => newRow.appendChild(createCellLike(sourceCell)));
            if (action === 'row-above') section.insertBefore(newRow, row);
            else section.insertBefore(newRow, row.nextSibling);
        } else if (action === 'col-left' || action === 'col-right') {
            rows.forEach(r => {
                const rowCells = Array.from(r.children).filter(el => el.tagName === 'TD' || el.tagName === 'TH');
                const ref = rowCells[Math.min(colIndex, rowCells.length - 1)];
                const newCell = createCellLike(ref || activeTableCell);
                if (!ref) {
                    r.appendChild(newCell);
                } else if (action === 'col-left') {
                    r.insertBefore(newCell, ref);
                } else {
                    r.insertBefore(newCell, ref.nextSibling);
                }
            });
        } else if (action === 'del-row') {
            if (rows.length <= 1) {
                table.remove();
                hideTableToolbar();
                handleInput();
                return;
            }
            row.remove();
        } else if (action === 'del-col') {
            if (cellsCount <= 1) {
                table.remove();
                hideTableToolbar();
                handleInput();
                return;
            }
            rows.forEach(r => {
                const rowCells = Array.from(r.children).filter(el => el.tagName === 'TD' || el.tagName === 'TH');
                const victim = rowCells[Math.min(colIndex, rowCells.length - 1)];
                if (victim) victim.remove();
            });
        } else if (action === 'designate-header') {
            const selectedCells = (() => {
                const sel = window.getSelection();
                if (!sel || !sel.rangeCount) return [activeTableCell].filter(Boolean);
                const range = sel.getRangeAt(0);
                const rowCells = Array.from(row.children).filter(el => el.tagName === 'TD' || el.tagName === 'TH');
                const hit = rowCells.filter(cell => range.intersectsNode(cell));
                return hit.length ? hit : [activeTableCell].filter(Boolean);
            })();

            selectedCells.forEach(cell => {
                if (!cell) return;
                if (cell.tagName === 'TH') {
                    cell.style.textAlign = 'center';
                    return;
                }
                const th = document.createElement('th');
                th.innerHTML = cell.innerHTML;
                Array.from(cell.attributes).forEach(attr => {
                    if (attr.name.toLowerCase() === 'style') return;
                    th.setAttribute(attr.name, attr.value);
                });
                th.style.textAlign = 'center';
                cell.parentNode.replaceChild(th, cell);
                if (activeTableCell === cell) activeTableCell = th;
            });
        } else if (action === 'merge-cells') {
            const selectedCells = getSelectedCells();
            const mergeCells = selectedCells.length >= 2 ? selectedCells : (() => {
                const rowCells = Array.from(row.children).filter(el => el.tagName === 'TD' || el.tagName === 'TH');
                return rowCells[colIndex + 1] ? [activeTableCell, rowCells[colIndex + 1]] : [activeTableCell];
            })();

            if (mergeCells.length < 2) return;
            const first = mergeCells[0];
            const colspan = mergeCells.reduce((acc, c) => acc + (parseInt(c.getAttribute('colspan'), 10) || 1), 0);
            first.setAttribute('colspan', String(colspan));
            const extraHtml = mergeCells.slice(1).map(c => c.innerHTML).filter(Boolean).join(' ');
            if (extraHtml) {
                const currentHtml = first.innerHTML.trim();
                first.innerHTML = currentHtml ? `${currentHtml} ${extraHtml}` : extraHtml;
            }
            mergeCells.slice(1).forEach(c => c.remove());
            activeTableCell = first;
        } else if (action === 'split-cell') {
            const span = parseInt(activeTableCell.getAttribute('colspan'), 10) || 1;
            if (span <= 1) return;
            activeTableCell.setAttribute('colspan', '1');
            for (let i = 1; i < span; i++) {
                row.insertBefore(createCellLike(activeTableCell), activeTableCell.nextSibling);
            }
        } else if (action === 'widen' || action === 'narrow') {
            const current = parseInt(table.style.width, 10) || table.getBoundingClientRect().width;
            const delta = action === 'widen' ? 60 : -60;
            table.style.width = `${Math.max(220, current + delta)}px`;
        }

        handleInput();
        refreshIcons();
        if (activeTableCell && document.body.contains(activeTableCell)) placeTableToolbar(activeTableCell);
    };

    const positionContextMenu = (menu, clientX, clientY) => {
        menu.style.left = `${clientX}px`;
        menu.style.top = `${clientY}px`;

        const rect = menu.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width - VIEWPORT_MARGIN;
        const maxY = window.innerHeight - rect.height - VIEWPORT_MARGIN;

        const clampedX = Math.max(VIEWPORT_MARGIN, Math.min(clientX, maxX));
        const clampedY = Math.max(VIEWPORT_MARGIN, Math.min(clientY, maxY));

        menu.style.left = `${clampedX}px`;
        menu.style.top = `${clampedY}px`;

        return { x: clampedX, y: clampedY, width: rect.width };
    };

    const setupHighlightSubmenuScroll = () => {
        const highlightSubmenu = document.getElementById('highlight-submenu');
        if (!highlightSubmenu || highlightSubmenu.dataset.wheelBound === 'true') return;

        highlightSubmenu.addEventListener('wheel', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            highlightSubmenu.scrollTop += evt.deltaY;
        }, { passive: false });

        highlightSubmenu.dataset.wheelBound = 'true';
    };

    setupHighlightSubmenuScroll();

    const setContextMenuMode = (mode) => {
        const selectionActions = document.getElementById('context-selection-actions');
        const deleteButton = document.getElementById('context-delete-element');
        if (!selectionActions || !deleteButton) return;
        const elementMode = mode === 'element';
        selectionActions.classList.toggle('hidden', elementMode);
        deleteButton.classList.toggle('hidden', !elementMode);
        deleteButton.classList.toggle('flex', elementMode);
    };

    const getTopLevelElementInEditor = (target) => {
        let node = target;
        if (!node) return null;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
        if (!node || !editor.contains(node)) return null;
        while (node && node.parentElement && node.parentElement !== editor) {
            node = node.parentElement;
        }
        return node && node !== editor ? node : null;
    };

    editor.addEventListener('contextmenu', (e) => {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
            lastRightClickedImage = e.target;
            window.api.showImageMenu();
            return;
        }

        const selection = window.getSelection();
        const hasSelection = selection && selection.toString().length > 0;
        const targetElement = getTopLevelElementInEditor(e.target);
        if (!hasSelection && !targetElement) return;

        e.preventDefault();

        const menu = document.getElementById('custom-context-menu');
        if (hasSelection && selection.rangeCount > 0) {
            savedSelectionRange = selection.getRangeAt(0).cloneRange();
            contextTargetElement = null;
            setContextMenuMode('selection');
        } else {
            contextTargetElement = targetElement;
            setContextMenuMode('element');
        }
        menu.classList.remove('hidden');

        const { x, width } = positionContextMenu(menu, e.clientX, e.clientY);

        const submenus = menu.querySelectorAll('.group\\/sub div[class*="absolute"]');
        if (x + width + 160 > window.innerWidth) {
            submenus.forEach(s => {
                s.classList.remove('left-full');
                s.classList.add('right-full', 'mr-[-4px]');
            });
        } else {
            submenus.forEach(s => {
                s.classList.remove('right-full', 'mr-[-4px]');
                s.classList.add('left-full');
            });
        }
        refreshIcons();
    });

    editor.addEventListener('click', (e) => {
        const cell = e.target.closest('td,th');
        if (!cell || !editor.contains(cell)) {
            hideTableToolbar();
            return;
        }
        activeTableCell = cell;
        if (tableToolbar) {
            tableToolbar.classList.remove('hidden');
            tableToolbar.classList.add('flex');
            placeTableToolbar(cell);
        }
    });

    editor.addEventListener('beforeinput', (e) => {
        const sel = window.getSelection();
        let node = sel && sel.anchorNode ? sel.anchorNode : null;
        if (node && node.nodeType === Node.TEXT_NODE) node = node.parentElement;
        const placeholder = node && node.closest ? node.closest('[data-callout-placeholder="true"]') : null;
        if (!placeholder) return;
        const inputType = e.inputType || '';
        if (inputType.startsWith('insert') || inputType === 'deleteContentBackward' || inputType === 'deleteByCut') {
            clearCalloutPlaceholder(placeholder);
        }
    });

    tableToolbar?.addEventListener('mousedown', (e) => {
        e.preventDefault();
    });

    tableToolbar?.querySelectorAll('.group\\/sub').forEach(group => {
        group.addEventListener('mouseenter', () => {
            const t = submenuTimers.get(group);
            if (t) clearTimeout(t);
            group.classList.add('submenu-open');
        });

        group.addEventListener('mouseleave', () => {
            const t = setTimeout(() => group.classList.remove('submenu-open'), 230);
            submenuTimers.set(group, t);
        });
    });

    tableToolbar?.addEventListener('mouseover', (e) => {
        const btn = e.target.closest('[data-table-action]');
        if (!btn) return;
        applyTablePreview(btn.getAttribute('data-table-action'));
    });

    tableToolbar?.addEventListener('mouseout', (e) => {
        const toElement = e.relatedTarget;
        if (toElement && tableToolbar.contains(toElement)) return;
        clearTablePreview();
        if (previewHint) {
            previewHint.textContent = 'Preview';
            previewHint.classList.remove('text-green-700', 'text-red-700', 'dark:text-green-300', 'dark:text-red-300');
            previewHint.classList.add('text-on-surface-variant');
        }
    });

    tableToolbar?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-table-action]');
        if (!btn) return;
        e.preventDefault();
        applyTableAction(btn.getAttribute('data-table-action'));
        clearTablePreview();
    });

    const insertPlainText = (text) => {
        const normalized = (text || '').replace(/\r\n/g, '\n');
        const html = escapeHTML(normalized).replace(/\n/g, '<br>');
        document.execCommand('insertHTML', false, html);
        handleInput();
    };

    const normalizeClipboardHtml = (rawHtml) => {
        const sanitized = sanitizeHTML(rawHtml || '');
        const parser = new DOMParser();
        const doc = parser.parseFromString(sanitized, 'text/html');

        doc.body.querySelectorAll('*').forEach((el) => {
            el.removeAttribute('style');
            el.removeAttribute('class');
            el.removeAttribute('id');
            Array.from(el.attributes).forEach((attr) => {
                if (attr.name.toLowerCase().startsWith('data-')) {
                    el.removeAttribute(attr.name);
                }
            });
        });

        return cleanHTML(doc.body.innerHTML);
    };

    editor.addEventListener('paste', async (e) => {
        const clipboardData = e.clipboardData || window.clipboardData;
        const items = clipboardData.items;
        let imageFound = false;

        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                e.preventDefault();
                imageFound = true;
                const blob = item.getAsFile();
                const base64 = await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = (ev) => resolve(ev.target.result);
                    reader.readAsDataURL(blob);
                });

                const res = await window.api.savePastedImage({ base64 });
                if (res.success) {
                    const imgHtml = `<img src="${res.path}" class="max-w-full h-auto rounded-2xl shadow-lg my-6 border border-outline-variant/20 block processed" style="display: block; margin: 1.5rem 0;">`;
                    document.execCommand('insertHTML', false, imgHtml);
                    handleInput();
                }
                break;
            }
        }

        if (!imageFound) {
            const html = clipboardData.getData('text/html');
            const plainText = clipboardData.getData('text/plain') || '';
            e.preventDefault();

            if (html && html.includes('<img')) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const images = doc.querySelectorAll('img');

                for (const img of images) {
                    const src = img.src;
                    if (src && (src.startsWith('http') || src.startsWith('file:'))) {
                        const res = await window.api.savePastedImage({ url: src });
                        if (res.success) img.src = res.path;
                    } else if (src && src.startsWith('blob:')) {
                        try {
                            const response = await fetch(src);
                            const blob = await response.blob();
                            const base64 = await new Promise(resolve => {
                                const reader = new FileReader();
                                reader.onload = (ev) => resolve(ev.target.result);
                                reader.readAsDataURL(blob);
                            });
                            const res = await window.api.savePastedImage({ base64 });
                            if (res.success) img.src = res.path;
                        } catch (err) {
                            console.error("No se pudo procesar el blob:", err);
                        }
                    }
                    img.className = "max-w-full h-auto rounded-2xl shadow-lg my-6 border border-outline-variant/20 block processed";
                    img.style.display = "block";
                    img.style.margin = "1.5rem 0";
                }
                document.execCommand('insertHTML', false, cleanHTML(doc.body.innerHTML));
                handleInput();
            } else if (html) {
                const normalizedHtml = normalizeClipboardHtml(html);
                if (normalizedHtml.trim()) {
                    document.execCommand('insertHTML', false, normalizedHtml);
                    handleInput();
                } else {
                    insertPlainText(plainText);
                }
            } else {
                insertPlainText(plainText);
            }
        }
    });

    editor.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
            e.preventDefault();
            executeEditAction('strikethrough');
            return;
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.execCommand('insertParagraph', false);

            if (document.queryCommandState('bold')) document.execCommand('bold', false, null);
            if (document.queryCommandState('italic')) document.execCommand('italic', false, null);
            if (document.queryCommandState('underline')) document.execCommand('underline', false, null);

            document.execCommand('removeFormat', false, null);
            document.execCommand('foreColor', false, '#191c1d');
        }
        
        if (e.key === 'Enter') {
            setTimeout(() => {
                const sel = window.getSelection();
                if (!sel || !sel.rangeCount) return;
                const editorEl = document.getElementById('editor');
                let node = sel.getRangeAt(0).startContainer;
                if (node.nodeType === 3) node = node.parentNode;

                let cur = node;
                while (cur && cur !== editorEl) {
                    if (cur.nodeType === 1 && (cur.tagName === 'SPAN' || cur.tagName === 'FONT')) {
                        cur.removeAttribute('style');
                        cur.className = '';
                        break;
                    }
                    cur = cur.parentNode;
                }

                if (document.queryCommandState('bold')) document.execCommand('bold', false, null);
                if (document.queryCommandState('italic')) document.execCommand('italic', false, null);
                const isDark = document.documentElement.classList.contains('dark');
                document.execCommand('foreColor', false, isDark ? '#ffffff' : '#000000');
            }, 0);
        }
    });

    editor.addEventListener('input', handleInput);
    document.addEventListener('selectionchange', () => {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        const anchorNode = sel.anchorNode;
        if (!anchorNode) return;
        const anchorEl = anchorNode.nodeType === Node.TEXT_NODE ? anchorNode.parentElement : anchorNode;
        if (anchorEl && editor.contains(anchorEl)) {
            savedSelectionRange = sel.getRangeAt(0).cloneRange();
        }
    });

    window.addEventListener('resize', hideTableToolbar);

    // Selector de color: restaurar selección y aplicar `foreColor` sin perder foco.
    const picker = document.getElementById('text-color-picker');
    if (picker) {
        picker.addEventListener('input', (e) => {
            const sel = window.getSelection();
            if (savedSelectionRange) {
                sel.removeAllRanges();
                sel.addRange(savedSelectionRange);
            }
            document.execCommand('foreColor', false, e.target.value);
            if (sel.rangeCount > 0) savedSelectionRange = sel.getRangeAt(0);
            handleInput();
        });

        picker.addEventListener('change', () => {
            picker.style.display = 'none';
        });
    }

    // Entradas desde menús nativos (proceso principal) para comandos del editor.
    window.api.onEditAction((data) => executeEditAction(data));

    window.api.onImageAction((action) => {
        if (!lastRightClickedImage) return;
        const img = lastRightClickedImage;
        if (action === 'delete') { img.remove(); }
        else if (action === 'center') { img.style.display = 'block'; img.style.margin = '1.5rem auto'; }
        else if (action === 'left') { img.style.display = 'block'; img.style.margin = '1.5rem 0'; }
        else { img.style.width = action; img.style.height = 'auto'; }
        handleInput();
        lastRightClickedImage = null;
    });
}
