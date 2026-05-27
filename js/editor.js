import { state, saveAll } from './state.js';
import { refreshIcons, cleanHTML, sanitizeHTML, escapeHTML, hashString, buildPreview } from './utils.js';
import { renderNotesList } from './notes.js';

let savedSelectionRange = null;
let lastRightClickedImage = null;
let activeTableCell = null;

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

    const sel = window.getSelection();
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

    const hideTableToolbar = () => {
        if (!tableToolbar) return;
        tableToolbar.classList.add('hidden');
        tableToolbar.classList.remove('flex');
        activeTableCell = null;
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

    const createCellLike = (sourceCell) => {
        const tag = sourceCell && sourceCell.tagName === 'TH' ? 'th' : 'td';
        const cell = document.createElement(tag);
        cell.innerHTML = '<br>';
        return cell;
    };

    const applyTableAction = (action) => {
        const info = getTableInfo();
        if (!info) return;
        const { table, section, row, rows, rowIndex, colIndex, cellsCount } = info;

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

    editor.addEventListener('contextmenu', (e) => {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
            lastRightClickedImage = e.target;
            window.api.showImageMenu();
            return;
        }

        const selection = window.getSelection();
        if (selection.toString().length === 0) return;

        savedSelectionRange = selection.getRangeAt(0).cloneRange();
        e.preventDefault();

        const menu = document.getElementById('custom-context-menu');
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

    tableToolbar?.addEventListener('mousedown', (e) => {
        e.preventDefault();
    });

    tableToolbar?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-table-action]');
        if (!btn) return;
        e.preventDefault();
        applyTableAction(btn.getAttribute('data-table-action'));
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
