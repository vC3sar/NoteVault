export function refreshIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
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
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const allElements = doc.querySelectorAll('*');
    allElements.forEach(el => {
        if (el.hasAttribute('style')) {
            let style = el.getAttribute('style');
            style = style.replace(/--[a-zA-Z0-9-]+:[^;]+;?/g, '').trim();
            if (style && style !== ' ') {
                el.setAttribute('style', style);
            } else {
                el.removeAttribute('style');
            }
        }
        el.classList.remove('Apple-interchange-newline', 'processed');
        if (el.classList.length === 0) el.removeAttribute('class');
    });

    const iterator = doc.createNodeIterator(doc.body, NodeFilter.SHOW_COMMENT);
    let currentNode;
    while (currentNode = iterator.nextNode()) {
        currentNode.parentNode.removeChild(currentNode);
    }

    const images = doc.querySelectorAll('img');
    images.forEach(img => {
        img.setAttribute('loading', 'lazy');
        if (!img.hasAttribute('alt')) img.setAttribute('alt', 'Imagen de nota');
    });

    return doc.body.innerHTML;
}
