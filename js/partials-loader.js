/**
 * partials-loader.js
 * Loads HTML partial files via XMLHttpRequest (reliable with file:// in Electron)
 * and injects them into the DOM, then signals readiness via:
 *   - window.partialsReady = true  (for modules that load after this script)
 *   - document event 'partials:ready'  (for listeners registered before dispatch)
 *
 * Usage in HTML: <div data-partial="sidebar"></div>
 * File resolved: partials/sidebar.html
 */

function loadPartialSync(name) {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `partials/${name}.html`, true);
        xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 0) { // status 0 = file:// success
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
        
        // Move all children out of the wrapper to keep a clean DOM
        while (wrapper.firstChild) {
            slot.parentNode.insertBefore(wrapper.firstChild, slot);
        }
        slot.remove();
    }));

    // Set flag for ES modules that check after loading
    window.partialsReady = true;
    document.dispatchEvent(new Event('partials:ready'));
})();
