/**
 * js/partials-loader.js — Loader de partials HTML (renderer, pre-bootstrap).
 *
 * Motivación:
 * - En Electron con `file://`, `fetch()` puede comportarse distinto según settings/versión.
 * - Se usa `XMLHttpRequest` por compatibilidad y simplicidad en runtime local.
 *
 * Flujo:
 * - Busca placeholders: `<div data-partial="sidebar"></div>`.
 * - Resuelve el archivo: `partials/sidebar.html`.
 * - Inyecta el HTML en el DOM y elimina el placeholder.
 * - Señaliza readiness de dos formas para evitar condiciones de carrera:
 *   - `window.partialsReady = true` para módulos que cargan después.
 *   - Evento `document` `partials:ready` para listeners registrados antes.
 */

function loadPartialSync(name) {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `partials/${name}.html`, true);
        xhr.onload = () => {
            // `status === 0` es un caso válido bajo `file://` en Electron.
            if (xhr.status === 200 || xhr.status === 0) {
                resolve(xhr.responseText);
            } else {
                console.error(`[partials-loader] Failed to load "${name}" (status ${xhr.status})`);
                resolve(`<div class="p-4 border-2 border-dashed border-red-500/50 rounded-lg text-red-500 bg-red-500/10 font-bold m-4 text-center">⚠️ Error loading component: ${name}</div>`);
            }
        };
        xhr.onerror = () => {
            console.error(`[partials-loader] Network error loading "${name}"`);
            resolve(`<div class="p-4 border-2 border-dashed border-red-500/50 rounded-lg text-red-500 bg-red-500/10 font-bold m-4 text-center">📡 Network error loading component: ${name}</div>`);
        };
        xhr.send();
    });
}

(async function loadPartials() {
    const slots = Array.from(document.querySelectorAll('[data-partial]'));

    if (slots.length === 0) {
        window.partialsReady = true;
        document.dispatchEvent(new Event('partials:ready'));
        return;
    }

    await Promise.all(slots.map(async (slot) => {
        const name = slot.getAttribute('data-partial');
        const html = await loadPartialSync(name);
        
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        
        // Mover hijos fuera del wrapper para evitar nodos contenedores extra en el árbol.
        while (wrapper.firstChild) {
            slot.parentNode.insertBefore(wrapper.firstChild, slot);
        }
        slot.remove();
    }));

    // Bandera y evento para coordinar con módulos ES que dependen del DOM final.
    window.partialsReady = true;
    document.dispatchEvent(new Event('partials:ready'));
})();
