export function refreshIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

export function showToast(message, tone = 'neutral') {
    const existing = document.getElementById('app-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'fixed top-5 right-5 z-[120] rounded-xl px-4 py-2.5 text-sm font-semibold shadow-xl border backdrop-blur-sm transition-opacity duration-200';

    if (tone === 'success') {
        toast.classList.add(
            'bg-emerald-500/15', 'text-emerald-700', 'border-emerald-500/30',
            'dark:bg-emerald-300/20', 'dark:text-emerald-100', 'dark:border-emerald-200/45'
        );
    } else if (tone === 'error') {
        toast.classList.add(
            'bg-red-500/15', 'text-red-700', 'border-red-500/30',
            'dark:bg-red-300/20', 'dark:text-red-100', 'dark:border-red-200/45'
        );
    } else {
        toast.classList.add(
            'bg-surface-container-lowest/95', 'text-on-surface-variant', 'border-outline-variant/30',
            'dark:bg-slate-800/95', 'dark:text-slate-100', 'dark:border-slate-500/55'
        );
    }

    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 220);
    }, 1600);
}

export function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function stripHTML(html) {
    if (!html) return '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(html), 'text/html');
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

function sanitizeStyleValue(styleValue) {
    return String(styleValue)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/url\s*\(\s*[^)]*\)/gi, '')
        .replace(/expression\s*\([^)]*\)/gi, '')
        .replace(/javascript\s*:/gi, '')
        .replace(/vbscript\s*:/gi, '')
        .replace(/behavior\s*:/gi, '')
        .replace(/@import/gi, '')
        .trim();
}

function sanitizeUrlAttribute(value, allowData = false) {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    if (/^file:/i.test(raw)) return raw;
    if (/^https?:/i.test(raw)) return raw;
    if (/^blob:/i.test(raw)) return raw;
    if (allowData && /^data:image\//i.test(raw)) return raw;
    if (/^mailto:/i.test(raw) || /^tel:/i.test(raw)) return raw;
    return '';
}

function unwrapElement(el) {
    const parent = el.parentNode;
    if (!parent) return;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
}

function normalizeInlineChips(root) {
    root.querySelectorAll('.rich-inline-chip').forEach((chip) => {
        const type = chip.getAttribute('data-block-type') || '';
        const icon = chip.getAttribute('data-chip-icon') || 'clock';
        let text = '';
        chip.childNodes.forEach((child) => {
            if (child.nodeType === Node.TEXT_NODE) text += child.textContent;
            else if (child.tagName === 'SPAN') text += child.textContent;
        });
        text = text.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
        if (!text) text = chip.textContent.trim();

        chip.setAttribute('contenteditable', 'false');
        if (type) chip.setAttribute('data-block-type', type);
        if (icon) chip.setAttribute('data-chip-icon', icon);

        chip.innerHTML = `<i data-lucide="${icon}" class="w-3.5 h-3.5" aria-hidden="true"></i><span>${escapeHTML(text)}</span>`;
    });
}

function svgClassToPlaceholder(className, fallback = '') {
    const classes = String(className || '')
        .split(/\s+/)
        .filter(Boolean)
        .filter((token) => token !== 'lucide' && !token.startsWith('lucide-'));
    if (fallback && !classes.includes(fallback)) classes.unshift(fallback);
    return classes.join(' ').trim();
}

function replaceLucideSvg(svg, fallbackClass = '') {
    const name = svg.getAttribute('data-lucide');
    if (!name) return;
    const icon = svg.ownerDocument.createElement('i');
    icon.setAttribute('data-lucide', name);
    const className = svgClassToPlaceholder(svg.getAttribute('class'), fallbackClass);
    if (className) icon.setAttribute('class', className);
    icon.setAttribute('aria-hidden', 'true');
    svg.replaceWith(icon);
}

function normalizeLucidePlaceholders(root) {
    root.querySelectorAll('svg[data-lucide]').forEach((svg) => {
        let fallbackClass = '';
        if (svg.closest('.insert-callout-icon-wrap')) fallbackClass = 'insert-callout-icon';
        replaceLucideSvg(svg, fallbackClass);
    });

    root.querySelectorAll('.rich-inline-chip').forEach((chip) => {
        const name = chip.getAttribute('data-chip-icon');
        if (name && !chip.querySelector('[data-lucide]')) {
            chip.insertAdjacentHTML('afterbegin', `<i data-lucide="${name}" class="w-3.5 h-3.5" aria-hidden="true"></i>`);
        }
    });

    root.querySelectorAll('.rich-block-icon').forEach((wrap) => {
        if (wrap.querySelector('[data-lucide]')) return;
        const block = wrap.closest('.rich-insert-block');
        const name = block?.getAttribute('data-block-icon');
        if (!name) return;
        wrap.innerHTML = `<i data-lucide="${name}" class="w-4 h-4" aria-hidden="true"></i>`;
    });

    root.querySelectorAll('[data-rich-block-edit]').forEach((button) => {
        if (button.querySelector('[data-lucide]')) return;
        button.innerHTML = '<i data-lucide="pencil" class="w-4 h-4" aria-hidden="true"></i>';
    });

    root.querySelectorAll('[data-rich-block-delete]').forEach((button) => {
        if (button.querySelector('[data-lucide]')) return;
        button.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4" aria-hidden="true"></i>';
    });

    root.querySelectorAll('[data-rich-block-drag]').forEach((handle) => {
        if (handle.querySelector('[data-lucide]')) return;
        handle.innerHTML = '<i data-lucide="grip-vertical" class="w-4 h-4" aria-hidden="true"></i>';
    });

    root.querySelectorAll('.rich-reminder-date').forEach((dateEl) => {
        if (dateEl.querySelector('[data-lucide]')) return;
        dateEl.insertAdjacentHTML('afterbegin', '<i data-lucide="calendar-clock" class="w-4 h-4" aria-hidden="true"></i>');
    });
}

function normalizeRichBlocks(root) {
    root.querySelectorAll('.rich-insert-block').forEach((block) => {
        const legacyType = block.getAttribute('data-blocktype');
        const legacyIcon = block.getAttribute('data-blockicon');
        if (!block.getAttribute('data-block-type') && legacyType) block.setAttribute('data-block-type', legacyType);
        if (!block.getAttribute('data-block-icon') && legacyIcon) block.setAttribute('data-block-icon', legacyIcon);

        block.classList.remove('is-editing', 'is-dragging');
        block.querySelectorAll('.rich-block-accent, .rich-block-header, .rich-block-actions, .rich-block-icon, .rich-reminder-date, .rich-checklist-progress').forEach((el) => {
            el.setAttribute('contenteditable', 'false');
        });
        block.querySelectorAll('[data-rich-block-edit], [data-rich-block-delete], [data-rich-block-drag]').forEach((el) => {
            el.setAttribute('contenteditable', 'false');
        });
    });
}

const ALLOWED_TAGS = new Set([
    'A', 'ABBR', 'B', 'BLOCKQUOTE', 'BR', 'CAPTION', 'CITE', 'CODE', 'COL',
    'COLGROUP', 'DD', 'DEL', 'DETAILS', 'DIV', 'DL', 'DT', 'EM', 'FIGCAPTION',
    'FIGURE', 'FONT', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HR', 'I', 'IMG', 'AUDIO',
    'INS', 'KBD', 'LABEL', 'LI', 'MARK', 'OL', 'P', 'PRE', 'Q', 'S', 'SAMP',
    'SECTION', 'SMALL', 'SPAN', 'STRONG', 'SUB', 'SUP', 'TABLE', 'TBODY', 'TD',
    'TFOOT', 'TH', 'THEAD', 'TR', 'U', 'UL', 'INPUT', 'STRIKE', 'BUTTON'
]);

const SAFE_ATTRS = new Set([
    'href', 'src', 'alt', 'title', 'class', 'style', 'colspan', 'rowspan',
    'scope', 'loading', 'target', 'rel', 'type', 'checked', 'disabled',
    'contenteditable', 'data-lucide', 'color', 'size', 'face', 'dir', 'align',
    'controls', 'preload', 'playsinline', 'draggable'
]);

export function sanitizeHTML(html) {
    if (!html) return '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(html), 'text/html');

    const allElements = Array.from(doc.body.querySelectorAll('*'));
    for (const el of allElements) {
        const tag = el.tagName.toUpperCase();
        if (!ALLOWED_TAGS.has(tag)) {
            el.remove();
            continue;
        }

        for (const attr of Array.from(el.attributes)) {
            const name = attr.name.toLowerCase();
            if (name.startsWith('on')) {
                el.removeAttribute(attr.name);
                continue;
            }
            if (!SAFE_ATTRS.has(name) && !name.startsWith('data-')) {
                el.removeAttribute(attr.name);
                continue;
            }

            if (name === 'style') {
                const cleaned = sanitizeStyleValue(attr.value);
                if (cleaned) el.setAttribute('style', cleaned);
                else el.removeAttribute('style');
                continue;
            }

            if (name === 'href') {
                const cleaned = sanitizeUrlAttribute(attr.value, true);
                if (cleaned) {
                    el.setAttribute('href', cleaned);
                    el.setAttribute('rel', 'noopener noreferrer');
                } else {
                    el.removeAttribute('href');
                }
                continue;
            }

            if (name === 'src') {
                const cleaned = sanitizeUrlAttribute(attr.value, true);
                if (cleaned) el.setAttribute('src', cleaned);
                else el.removeAttribute('src');
                continue;
            }

            if (name === 'target') {
                const target = String(attr.value).toLowerCase();
                if (target !== '_blank' && target !== '_self' && target !== '_parent' && target !== '_top') {
                    el.removeAttribute('target');
                }
                continue;
            }

            if (tag === 'INPUT' && name === 'type') {
                const type = String(attr.value).toLowerCase();
                if (type !== 'checkbox' && type !== 'radio' && type !== 'range') {
                    el.setAttribute('type', 'text');
                }
                continue;
            }
        }

        if (tag === 'INPUT') {
            const type = (el.getAttribute('type') || '').toLowerCase();
            if (type !== 'checkbox' && type !== 'radio' && type !== 'range') {
                el.setAttribute('type', 'text');
            }
            el.removeAttribute('onchange');
            el.removeAttribute('onclick');
            el.removeAttribute('oninput');
        }
    }

    const forbidden = doc.body.querySelectorAll('script, iframe, object, embed, link, meta, base, form, textarea, select, option, svg, math');
    forbidden.forEach(node => node.remove());

    const iterator = doc.createNodeIterator(doc.body, NodeFilter.SHOW_COMMENT);
    let currentNode;
    while ((currentNode = iterator.nextNode())) {
        currentNode.parentNode.removeChild(currentNode);
    }

    doc.body.querySelectorAll('img').forEach(img => {
        const cleanedSrc = sanitizeUrlAttribute(img.getAttribute('src'), true);
        if (cleanedSrc) img.setAttribute('src', cleanedSrc);
        else img.removeAttribute('src');
        img.setAttribute('loading', 'lazy');
        if (!img.hasAttribute('alt')) img.setAttribute('alt', 'Imagen de nota');
    });

    doc.body.querySelectorAll('a').forEach(anchor => {
        const href = sanitizeUrlAttribute(anchor.getAttribute('href'), true);
        if (href) {
            anchor.setAttribute('href', href);
            anchor.setAttribute('rel', 'noopener noreferrer');
        } else {
            anchor.removeAttribute('href');
        }
    });

    return doc.body.innerHTML;
}

export function showModal(title, placeholder, initialValue = '') {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-modal');
        const input = document.getElementById('modal-input');
        const errorMsg = document.getElementById('modal-error');
        document.getElementById('modal-title').textContent = title;
        input.value = initialValue;
        input.placeholder = placeholder;
        input.classList.remove('border-red-400');
        if (errorMsg) { errorMsg.classList.add('hidden'); }
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        setTimeout(() => { input.focus(); input.select(); }, 60);

        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        const closeModal = (value) => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            input.classList.remove('border-red-400');
            if (errorMsg) { errorMsg.classList.add('hidden'); }
            resolve(value);
        };

        const tryConfirm = () => {
            const val = input.value.trim();
            if (!val) {
                input.classList.add('border-red-400');
                if (errorMsg) { errorMsg.classList.remove('hidden'); }
                input.focus();
                input.animate([
                    { transform: 'translateX(-4px)' },
                    { transform: 'translateX(4px)' },
                    { transform: 'translateX(-4px)' },
                    { transform: 'translateX(4px)' },
                    { transform: 'translateX(0)' }
                ], { duration: 300, easing: 'ease-out' });
                return;
            }
            closeModal(val);
        };

        newConfirmBtn.onclick = tryConfirm;
        newCancelBtn.onclick = () => closeModal(null);

        const onKeydown = (e) => {
            if (e.key === 'Enter') { e.preventDefault(); tryConfirm(); }
            if (e.key === 'Escape') { closeModal(null); }
        };
        input.removeEventListener('keydown', input._modalKeydown);
        input._modalKeydown = onKeydown;
        input.addEventListener('keydown', onKeydown);

        input.oninput = () => {
            input.classList.remove('border-red-400');
            if (errorMsg) { errorMsg.classList.add('hidden'); }
        };
    });
}

function normalizeDOMStructure(root) {
    root.querySelectorAll('font').forEach(font => {
        const span = root.ownerDocument.createElement('span');
        let style = '';
        if (font.hasAttribute('color')) {
            style += `color: ${font.getAttribute('color')};`;
        }
        if (font.hasAttribute('size')) {
            const sizeMap = { '1': '12px', '2': '14px', '3': '18px', '4': '20px', '5': '28px', '6': '36px', '7': '48px' };
            const s = font.getAttribute('size');
            if (sizeMap[s]) {
                style += `font-size: ${sizeMap[s]};`;
            }
        }
        if (font.hasAttribute('face')) {
            style += `font-family: ${font.getAttribute('face')};`;
        }
        if (font.hasAttribute('style')) {
            let existing = font.getAttribute('style');
            if (!existing.endsWith(';')) existing += ';';
            style += existing;
        }
        if (style) {
            span.setAttribute('style', style);
        }
        while (font.firstChild) {
            span.appendChild(font.firstChild);
        }
        font.parentNode.replaceChild(span, font);
    });

    let changed = true;
    while (changed) {
        changed = false;
        
        const formatTags = ['SPAN', 'B', 'I', 'U', 'STRONG', 'EM', 'STRIKE', 'DEL'];
        
        for (const tag of formatTags) {
            root.querySelectorAll(tag).forEach(el => {
                if (el.innerHTML.trim() === '' && !el.querySelector('br, img')) {
                    el.remove();
                    changed = true;
                }
            });
        }

        root.querySelectorAll('span, b, i, u, strong, em, strike, del').forEach(el => {
            if (el.parentElement && el.parentElement.tagName === el.tagName) {
                const elStyle = (el.getAttribute('style') || '').replace(/\s+/g, '');
                const parentStyle = (el.parentElement.getAttribute('style') || '').replace(/\s+/g, '');
                
                if (elStyle === parentStyle && el.className === el.parentElement.className) {
                    while (el.firstChild) {
                        el.parentNode.insertBefore(el.firstChild, el);
                    }
                    el.remove();
                    changed = true;
                }
            }
        });

        for (const tag of formatTags) {
            root.querySelectorAll(tag).forEach(el => {
                const next = el.nextSibling;
                if (next && next.nodeType === Node.ELEMENT_NODE && next.tagName === el.tagName) {
                    const elStyle = (el.getAttribute('style') || '').replace(/\s+/g, '');
                    const nextStyle = (next.getAttribute('style') || '').replace(/\s+/g, '');
                    
                    if (elStyle === nextStyle && el.className === next.className) {
                        while (next.firstChild) {
                            el.appendChild(next.firstChild);
                        }
                        next.remove();
                        changed = true;
                    }
                }
            });
        }
    }
}

export function cleanHTML(html) {
    if (!html) return '';
    const parser = new DOMParser();
    const preDoc = parser.parseFromString(String(html), 'text/html');
    preDoc.body.querySelectorAll('.voice-note').forEach((note) => {
        note.removeAttribute('data-player-ready');
        note.querySelectorAll('.voice-note-player').forEach(player => {
            const content = note.querySelector('.voice-note-content') || note;
            player.querySelectorAll('audio').forEach(audio => content.appendChild(audio));
            player.remove();
        });
        if (note.dataset && note.dataset.audioFile) {
            note.removeAttribute('data-audio-src');
            note.querySelectorAll('audio').forEach(audio => {
                audio.removeAttribute('src');
                audio.removeAttribute('data-player-ready');
                audio.removeAttribute('data-voice-upgraded');
                audio.classList.add('voice-note-native-audio');
                audio.setAttribute('controls', '');
                audio.setAttribute('preload', 'metadata');
                audio.setAttribute('playsinline', '');
            });
        }
        note.querySelectorAll('.voice-note-meta, .voice-note-header, audio').forEach(el => {
            el.setAttribute('contenteditable', 'false');
        });
    });
    preDoc.body.querySelectorAll('.insert-callout-icon-wrap').forEach((wrap) => {
        wrap.setAttribute('contenteditable', 'false');
        wrap.innerHTML = '<i data-lucide="lightbulb" class="insert-callout-icon" aria-hidden="true"></i>';
    });
    
    normalizeDOMStructure(preDoc.body);
    normalizeInlineChips(preDoc.body);
    normalizeRichBlocks(preDoc.body);
    normalizeLucidePlaceholders(preDoc.body);

    const sanitized = sanitizeHTML(preDoc.body.innerHTML);
    const doc = parser.parseFromString(sanitized, 'text/html');
    
    normalizeDOMStructure(doc.body);
    normalizeInlineChips(doc.body);
    normalizeRichBlocks(doc.body);
    normalizeLucidePlaceholders(doc.body);
    doc.body.querySelectorAll('*').forEach(el => {
        if (el.classList) {
            el.classList.remove('Apple-interchange-newline', 'processed');
            if (el.classList.length === 0) el.removeAttribute('class');
        }
        if (el.hasAttribute('style')) {
            const style = sanitizeStyleValue(el.getAttribute('style'));
            if (style) el.setAttribute('style', style);
            else el.removeAttribute('style');
        }
    });
    return doc.body.innerHTML;
}

export function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function safeHexColor(value, fallback = '#2b2d2e') {
    const raw = String(value ?? '').trim();
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(raw)) return raw;
    return fallback;
}

export function hexToRgba(value, alpha = 1, fallback = 'rgba(43,45,46,1)') {
    const raw = safeHexColor(value, '');
    if (!raw) return fallback;

    let hex = raw.slice(1);
    if (hex.length === 3) {
        hex = hex.split('').map(ch => ch + ch).join('');
    }
    if (hex.length === 8) {
        hex = hex.slice(0, 6);
    }
    if (hex.length !== 6) return fallback;

    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].some(Number.isNaN)) return fallback;

    const clampedAlpha = Math.min(1, Math.max(0, Number(alpha)));
    return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
}

/**
 * Hash djb2 sobre un string.
 *
 * Uso:
 * - Fingerprints rápidos para detectar cambios (no criptográfico).
 * - Salida en base-36 para almacenamiento compacto (ej: "3q4r7a").
 *
 * Nota: no usar para seguridad, firmas o autenticación.
 */
export function hashString(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) + h) ^ str.charCodeAt(i);
        h = h >>> 0; // keep unsigned 32-bit
    }
    return h.toString(36);
}

/**
 * Genera un preview en texto plano (máx. 150 chars) a partir de HTML.
 *
 * Convención:
 * - Devuelve string vacío para notas en blanco (facilita filtros y evita ruido en UI).
 */
export function buildPreview(htmlContent) {
    if (!htmlContent) return '';
    const plain = stripHTML(htmlContent).replace(/\s+/g, ' ').trim();
    if (!plain) return '';
    return plain.length > 150 ? plain.slice(0, 150) + '\u2026' : plain;
}
