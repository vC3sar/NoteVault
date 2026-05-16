export function refreshIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
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

const ALLOWED_TAGS = new Set([
    'A', 'ABBR', 'B', 'BLOCKQUOTE', 'BR', 'CAPTION', 'CITE', 'CODE', 'COL',
    'COLGROUP', 'DD', 'DEL', 'DETAILS', 'DIV', 'DL', 'DT', 'EM', 'FIGCAPTION',
    'FIGURE', 'FONT', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HR', 'I', 'IMG',
    'INS', 'KBD', 'LABEL', 'LI', 'MARK', 'OL', 'P', 'PRE', 'Q', 'S', 'SAMP',
    'SECTION', 'SMALL', 'SPAN', 'STRONG', 'SUB', 'SUP', 'TABLE', 'TBODY', 'TD',
    'TFOOT', 'TH', 'THEAD', 'TR', 'U', 'UL', 'INPUT'
]);

const SAFE_ATTRS = new Set([
    'href', 'src', 'alt', 'title', 'class', 'style', 'colspan', 'rowspan',
    'scope', 'loading', 'target', 'rel', 'type', 'checked', 'disabled',
    'contenteditable', 'data-lucide', 'color', 'size', 'face', 'dir', 'align'
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
                if (type !== 'checkbox' && type !== 'radio') {
                    el.setAttribute('type', 'text');
                }
                continue;
            }
        }

        if (tag === 'INPUT') {
            const type = (el.getAttribute('type') || '').toLowerCase();
            if (type !== 'checkbox' && type !== 'radio') {
                el.setAttribute('type', 'text');
            }
            el.removeAttribute('onchange');
            el.removeAttribute('onclick');
            el.removeAttribute('oninput');
        }
    }

    const forbidden = doc.body.querySelectorAll('script, iframe, object, embed, link, meta, base, form, textarea, select, option, button, svg, math');
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

export function cleanHTML(html) {
    if (!html) return '';
    const sanitized = sanitizeHTML(html);
    const parser = new DOMParser();
    const doc = parser.parseFromString(sanitized, 'text/html');
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
