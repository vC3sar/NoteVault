This file is a merged representation of the entire codebase, combined into a single document by Repomix.
The content has been processed where comments have been removed, empty lines have been removed, content has been compressed (code blocks are separated by ⋮---- delimiter).

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Code comments have been removed from supported file types
- Empty lines have been removed from all files
- Content has been compressed - code blocks are separated by ⋮---- delimiter
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
.github/workflows/main.yml
img/logo.ico
img/logo.png
index.html
js/calendar.js
js/editor.js
js/events.js
js/ipc.js
js/notebooks.js
js/notes.js
js/partials-loader.js
js/state.js
js/tailwind-config.js
js/ui.js
js/utils.js
lib/lucide.min.js
lib/tailwind.min.js
LICENSE.txt
main.js
modules/ipc-handlers.js
modules/media.js
modules/menu.js
modules/tray.js
modules/window.js
mp4/notevault.mp4
package.json
partials/context-menu.html
partials/modal-notebook.html
partials/modal-profile.html
partials/modal-settings.html
partials/navbar.html
partials/sidebar.html
partials/view-calendar.html
partials/view-dashboard.html
partials/view-notebook.html
partials/view-trash.html
pnpm-workspace.yaml
preload.js
README.md
renderer.js
styles.css
```

# Files

## File: .github/workflows/main.yml
````yaml
name: 'Dependency review'
on:
  pull_request:
    branches: [ "master" ]
permissions:
  contents: read
  pull-requests: write
jobs:
  dependency-review:
    runs-on: ubuntu-latest
    steps:
      - name: 'Checkout repository'
        uses: actions/checkout@v4
      - name: 'Dependency Review'
        uses: actions/dependency-review-action@v4
        with:
          comment-summary-in-pr: always
````

## File: js/tailwind-config.js
````javascript

````

## File: lib/lucide.min.js
````javascript
(function(a,n)
````

## File: lib/tailwind.min.js
````javascript
(()=>
⋮----
`)}toString()
⋮----
`,colon:": ",commentLeft:" ",commentRight:" ",emptyBody:"",indent:"    ",semicolon:!1};function vx(r)
`))
`)&&(t=t.replace(/[^\n]+$/,"")),!1}),t&&(t=t.replace(/\S/g,"")),t}rawBeforeComment(e,t)
⋮----
`)&&(i=i.replace(/[^\n]+$/,"")),!1}),typeof i=="undefined"?i=this.raw(t,null,"beforeDecl"):i&&(i=i.replace(/\S/g,"")),i}rawBeforeDecl(e,t)
⋮----
`)&&(i=i.replace(/[^\n]+$/,"")),!1}),typeof i=="undefined"?i=this.raw(t,null,"beforeRule"):i&&(i=i.replace(/\S/g,"")),i}rawBeforeOpen(e)
`)&&(t=t.replace(/[^\n]+$/,"")),!1}),t&&(t=t.replace(/\S/g,"")),t}rawColon(e)
`);return t=s[s.length-1],t=t.replace(/\S/g,""),!1}}),t}rawSemicolon(e)
`?(t=1,i+=1):t+=1}return n}var un=class
⋮----
https://www.w3ctech.com/topic/2226`));let o=t(...a);return o.postcssPlugin=e,o.postcssVersion=new Ta().version,o}let s;return Object.defineProperty(n,"postcss",
⋮----
`),v=y.length-1,v>0?(k=a+v,S=w-y[v].length):(k=a,S=s),T=D.comment,a=k,p=k,d=w-S):c===D.slash?(w=o,T=c,p=a,d=o-s,l=w+1):(w=OA(t,o),T=D.word,p=a,d=w-s),l=w+1;break}e.push([T,a,o-s,p,d,o,l]),S&&(s=S,S=null),o=l}return e}});var kd=x((ki,xd)=>
⋮----
`,CHAR_NO_BREAK_SPACE:"\xA0",CHAR_PERCENT:"%",CHAR_PLUS:"+",CHAR_QUESTION_MARK:"?",CHAR_RIGHT_ANGLE_BRACKET:">",CHAR_RIGHT_CURLY_BRACE:"}",CHAR_RIGHT_SQUARE_BRACKET:"]",CHAR_SEMICOLON:";",CHAR_SINGLE_QUOTE:"'",CHAR_SPACE:" ",CHAR_TAB:"	",CHAR_UNDERSCORE:"_",CHAR_VERTICAL_LINE:"|",CHAR_ZERO_WIDTH_NOBREAK_SPACE:"\uFEFF"}});var Nm=x((s6,Mm)=>
`))if(n=n.trim(),!i.has(n))if(i.add(n),Li.get(e).has(n))for(let s of Li.get(e).get(n))t.add(s);else
`))});c.push([p,d,h])}}for(let[l,[c,f]]of o)
⋮----
`),t}].filter(Boolean)}};Ql.exports.postcss=!0});var _y=x((Gq,Cy)=>
⋮----
`;function V5(r)
⋮----
`))}gv.exports=Dr;function Dr(...r)
````

## File: LICENSE.txt
````
TERMINOS Y CONDICIONES DE USO - NOTEVAULT

Bienvenido a NoteVault: Tu boveda personal de conocimiento academico.

Al instalar y utilizar esta aplicacion, aceptas los siguientes terminos:

1. USO DE LA APLICACION
NoteVault es una herramienta de gestion universitaria, construida sobre Electron, disenada para organizar libretas personalizadas, escribir mediante un editor de texto enriquecido y gestionar contenido multimedia. El uso de esta herramienta para la organizacion academica o personal es responsabilidad exclusiva del usuario.

2. PRIVACIDAD Y ALMACENAMIENTO DE DATOS
Todos los datos, notas, imagenes y configuraciones generados en NoteVault se almacenan de forma estrictamente LOCAL en el sistema de archivos de tu dispositivo. No recopilamos, transmitimos, ni almacenamos tu informacion personal en servidores externos. Eres el unico propietario y responsable de mantener copias de seguridad (backups) de tu propia informacion.

3. ESTADO DEL SOFTWARE
La aplicacion se proporciona en version Estable (1.3.0). Aunque NoteVault incorpora funciones como autoguardado y papelera de reciclaje temporal, el desarrollador no se hace responsable de la perdida accidental de datos.

4. LICENCIA DE USO PERSONAL Y RESTRICCIONES
Copyright (c) 2025 vC3sar (vazquezsg.ovh)

Se concede permiso para descargar, instalar, modificar y utilizar este software EXCLUSIVAMENTE con fines personales y no comerciales. 

Queda estrictamente prohibido:
- El uso del software con fines comerciales, empresariales o lucrativos.
- Vender, revender, alquilar, sublicenciar o distribuir el software (modificado o no) a cambio de una compensacion economica.
- Eliminar, ocultar o alterar los avisos de derechos de autor y creditos originales del desarrollador (vC3sar).

Cualquier copia o modificacion del software para uso personal debe mantener intacto este aviso de derechos de autor y las restricciones de uso.

EL SOFTWARE SE PROPORCIONA "TAL CUAL", SIN GARANTIA DE NINGUN TIPO. EN NINGUN CASO EL AUTOR (vC3sar) SERA RESPONSABLE DE NINGUNA RECLAMACION O DANO DERIVADO DEL USO DE ESTE SOFTWARE.

---------------------------------------------
Desarrollado por vC3sar - vazquezsg.ovh
````

## File: partials/modal-profile.html
````html
<div id="profile-modal"
    class="fixed inset-0 bg-black/60 backdrop-blur-md hidden items-center justify-center z-50 transition-opacity">
    <div
        class="bg-surface-container-lowest rounded-[2rem] w-[480px] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.3)] animate-[fadeIn_0.3s_ease-out] overflow-hidden border border-white/10">
        <div class="p-10">
            <div class="flex items-center gap-6 mb-10">
                <div
                    class="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-inner">
                    <i data-lucide="user" class="w-8 h-8 text-indigo-600 dark:text-indigo-400"></i>
                </div>
                <div>
                    <h4 class="text-2xl font-black text-on-surface tracking-tight leading-tight">Configuración del
                        Perfil</h4>
                    <p class="text-xs font-bold text-on-surface-variant/50 uppercase tracking-widest mt-1">
                        Personalización</p>
                </div>
            </div>
            <div class="space-y-8">
                <div class="relative group">
                    <div
                        class="absolute -top-2.5 left-4 px-1.5 bg-surface-container-lowest text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest transition-all group-focus-within:text-primary z-10">
                        Nombre Completo
                    </div>
                    <input type="text" id="profile-name-input" placeholder="¿Cómo te llamas?"
                        class="w-full bg-transparent border-2 border-outline-variant/20 dark:border-white/10 rounded-2xl px-5 py-4 text-on-surface font-bold outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:font-normal placeholder:opacity-30">
                </div>
                <div class="relative group">
                    <div
                        class="absolute -top-2.5 left-4 px-1.5 bg-surface-container-lowest text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest transition-all group-focus-within:text-primary z-10">
                        Correo Electrónico
                    </div>
                    <input type="email" id="profile-email-input" placeholder="tu@email.com"
                        class="w-full bg-transparent border-2 border-outline-variant/20 dark:border-white/10 rounded-2xl px-5 py-4 text-on-surface font-bold outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:font-normal placeholder:opacity-30">
                </div>
                <div class="relative group">
                    <div
                        class="absolute -top-2.5 left-4 px-1.5 bg-surface-container-lowest text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest transition-all group-focus-within:text-primary z-10">
                        Idioma de Preferencia
                    </div>
                    <select id="profile-lang-input"
                        class="w-full bg-transparent border-2 border-outline-variant/20 dark:border-white/10 rounded-2xl px-5 py-4 text-on-surface font-bold outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 appearance-none transition-all cursor-pointer">
                        <option value="es">Español</option>
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                    </select>
                    <div
                        class="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/40">
                        <i data-lucide="chevron-down" class="w-5 h-5"></i>
                    </div>
                </div>
            </div>
            <div class="flex items-center justify-end gap-3 mt-12">
                <button id="profile-cancel"
                    class="px-6 py-3.5 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container-high transition-all active:scale-95 text-sm">Cancelar</button>
                <button id="profile-confirm"
                    class="px-8 py-3.5 rounded-xl font-black bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all text-sm">Guardar
                    Cambios</button>
            </div>
        </div>
    </div>
</div>
````

## File: partials/modal-settings.html
````html
<div id="settings-modal"
    class="fixed inset-0 bg-black/40 backdrop-blur-sm hidden items-center justify-center z-50 transition-opacity">
    <div class="bg-surface-container-lowest p-6 rounded-2xl w-[400px] shadow-2xl animate-[fadeIn_0.2s_ease-out]">
        <h4 class="text-xl font-bold mb-6 text-on-surface flex items-center gap-2"><i data-lucide="settings"></i>
            Ajustes</h4>
        <div class="mb-4">
            <label class="block text-sm font-semibold text-on-surface-variant mb-2">Tema de la aplicación:</label>
            <select id="theme-input"
                class="w-full bg-indigo-100/80 dark:bg-black/20 border border-indigo-200 dark:border-white/10 rounded-xl px-4 py-3 text-on-surface outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all">
                <option value="system">Tema del Sistema</option>
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
            </select>
        </div>
        <div class="mb-4">
            <label class="block text-sm font-semibold text-on-surface-variant mb-2">Días para borrar notas de
                papelera:</label>
            <input type="number" id="trash-retention-input" min="1" max="365" value="30"
                class="w-full bg-indigo-100/80 dark:bg-black/20 border border-indigo-200 dark:border-white/10 rounded-xl px-4 py-3 text-on-surface outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all">
        </div>
        <div class="mb-4">
            <label class="block text-sm font-semibold text-on-surface-variant mb-2">Autoguardar cada
                (minutos):</label>
            <input type="number" id="autosave-interval-input" min="1" max="60" value="5"
                class="w-full bg-indigo-100/80 dark:bg-black/20 border border-indigo-200 dark:border-white/10 rounded-xl px-4 py-3 text-on-surface outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all">
        </div>
        <div class="mb-8">
            <div
                class="flex items-center justify-between bg-indigo-100/80 dark:bg-black/20 border border-indigo-200 dark:border-white/10 rounded-xl p-3.5 shadow-sm">
                <div>
                    <div class="text-sm font-semibold text-on-surface">Reproductor multimedia</div>
                    <div class="text-xs text-on-surface-variant mt-0.5 opacity-80">Muestra Spotify y otros
                        reproductores en la barra lateral</div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                    <input type="checkbox" id="media-player-toggle" class="sr-only peer">
                    <div
                        class="w-11 h-6 bg-outline-variant/50 dark:bg-outline-variant/80 rounded-full peer peer-checked:bg-primary transition-colors duration-300 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300 peer-checked:after:translate-x-5">
                    </div>
                </label>
            </div>
        </div>
        <div class="flex justify-end gap-3">
            <button id="settings-cancel"
                class="px-5 py-2.5 rounded-lg font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors">Cancelar</button>
            <button id="settings-confirm"
                class="px-5 py-2.5 rounded-lg font-bold bg-primary text-on-primary shadow-md hover:bg-indigo-700 transition-colors">Guardar</button>
        </div>
    </div>
</div>
````

## File: partials/navbar.html
````html
<header
    class="w-full h-16 shrink-0 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-md shadow-[0_12px_32px_rgba(42,20,180,0.04)] flex items-center justify-between px-8 z-20">
    <div class="flex items-center gap-8">
        <button id="toggle-sidebar"
            class="p-2 hover:bg-surface-container-highest rounded-full transition-colors hidden md:block text-on-surface-variant">
            <i data-lucide="panel-left"></i>
        </button>
        <div id="navbar-view-info" class="hidden">
            <span id="navbar-subtitle"
                class="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-[0.2em]">Todas
                tus libretas</span>
        </div>
        <div id="search-container" class="relative group hidden">
            <i data-lucide="search"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm group-focus-within:text-primary transition-colors"></i>
            <input type="text" id="search-notes"
                class="pl-10 pr-4 py-2 bg-surface-container-high border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50 outline-none"
                placeholder="Buscar en la libreta activa...">
        </div>
    </div>
    <div class="flex items-center gap-4">
        <div id="dashboard-actions" class="flex items-center gap-4">
            <div id="search-notebooks-container-nav" class="relative group">
                <i data-lucide="search"
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm group-focus-within:text-primary transition-colors"></i>
                <input type="text" id="search-notebooks"
                    class="pl-10 pr-4 py-2 bg-surface-container-high border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50 outline-none"
                    placeholder="Buscar libreta...">
            </div>
            <button id="add-notebook"
                class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md shadow-indigo-200 dark:shadow-none transition-all active:scale-95 flex items-center gap-2">
                <i data-lucide="plus" style="width:16px;height:16px;"></i> Nueva Libreta
            </button>
        </div>
        <button id="add-note" style="display:none;"
            class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md shadow-indigo-200 dark:shadow-none transition-all active:scale-95 flex items-center gap-2">
            <i data-lucide="plus-circle" style="width:16px;height:16px;"></i> Nueva Nota
        </button>
    </div>
</header>
````

## File: partials/view-calendar.html
````html
<div id="calendar-view" class="hidden flex-1 overflow-hidden">
    <div class="flex-1 flex overflow-hidden">
        <div class="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 flex flex-col">
            <div class="flex items-center justify-between mb-8">
                <h2 id="calendar-month-year" class="text-3xl font-extrabold tracking-tight text-on-surface">Mayo
                    2026</h2>
                <div class="flex items-center gap-2">
                    <button onclick="window.calendarEngine.navigateMonth(-1)"
                        class="p-2 text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-high rounded-lg active:scale-95"><i
                            data-lucide="chevron-left" class="w-5 h-5"></i></button>
                    <button onclick="window.calendarEngine.goToToday()"
                        class="px-4 py-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-high rounded-lg active:scale-95">Hoy</button>
                    <button onclick="window.calendarEngine.navigateMonth(1)"
                        class="p-2 text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-high rounded-lg active:scale-95"><i
                            data-lucide="chevron-right" class="w-5 h-5"></i></button>
                </div>
            </div>
            <div
                class="grid grid-cols-7 gap-px bg-outline-variant/20 rounded-2xl overflow-hidden border border-outline-variant/20 flex-1 min-h-[500px]">
                <div
                    class="bg-surface-container-lowest py-3 text-center text-xs font-black uppercase tracking-widest text-on-surface-variant/70">
                    Lun</div>
                <div
                    class="bg-surface-container-lowest py-3 text-center text-xs font-black uppercase tracking-widest text-on-surface-variant/70">
                    Mar</div>
                <div
                    class="bg-surface-container-lowest py-3 text-center text-xs font-black uppercase tracking-widest text-on-surface-variant/70">
                    Mié</div>
                <div
                    class="bg-surface-container-lowest py-3 text-center text-xs font-black uppercase tracking-widest text-on-surface-variant/70">
                    Jue</div>
                <div
                    class="bg-surface-container-lowest py-3 text-center text-xs font-black uppercase tracking-widest text-on-surface-variant/70">
                    Vie</div>
                <div
                    class="bg-surface-container-lowest py-3 text-center text-xs font-black uppercase tracking-widest text-on-surface-variant/70">
                    Sáb</div>
                <div
                    class="bg-surface-container-lowest py-3 text-center text-xs font-black uppercase tracking-widest text-on-surface-variant/70">
                    Dom</div>
                <div id="calendar-grid-content" class="contents"></div>
            </div>
        </div>
        <aside
            class="w-80 md:w-96 border-l border-outline-variant/10 bg-surface-container-lowest flex flex-col shrink-0 overflow-hidden">
            <div class="p-6 border-b border-outline-variant/10">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold text-xl text-on-surface">Horario Escolar</h3>
                    <button onclick="window.calendarEngine.showScheduleModal()"
                        title="Gestionar Clases y Horario"
                        class="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors active:scale-95 text-xs font-bold">
                        <i data-lucide="plus-circle" class="w-4 h-4"></i>
                        Gestionar Clases
                    </button>
                </div>
                <div class="bg-surface-container-low rounded-xl p-1 flex">
                    <button id="tab-schedule-l-v" onclick="window.calendarEngine.setScheduleMode('lv')"
                        class="flex-1 py-1.5 text-xs font-bold rounded-lg text-on-surface bg-surface-container-lowest shadow-sm transition-all">Lunes
                        a Viernes</button>
                    <button id="tab-schedule-s" onclick="window.calendarEngine.setScheduleMode('s')"
                        class="flex-1 py-1.5 text-xs font-bold rounded-lg text-on-surface-variant hover:text-on-surface transition-all">Solo
                        Sábados</button>
                </div>
            </div>
            <div class="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                <div>
                    <div class="flex items-center justify-between mb-3">
                        <h4 id="selected-day-title"
                            class="text-xs font-black uppercase tracking-widest text-on-surface-variant">Día
                            Seleccionado</h4>
                        <button onclick="window.calendarEngine.showEventModal()"
                            class="text-primary hover:text-primary/80 transition-colors"><i
                                data-lucide="plus-circle" class="w-4 h-4"></i></button>
                    </div>
                    <div id="selected-day-events" class="space-y-2">
                        <div class="text-sm text-on-surface-variant opacity-60 text-center py-4">Selecciona un
                            día</div>
                    </div>
                </div>
                <div>
                    <h4 class="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-3">
                        Horario Recurrente</h4>
                    <div id="schedule-list"
                        class="space-y-2 relative pl-3 border-l-2 border-outline-variant/20">
                    </div>
                </div>
            </div>
        </aside>
    </div>
</div>
````

## File: partials/view-notebook.html
````html
<div id="notebook-view" class="flex-1 flex overflow-hidden" style="display:none;">
    <section id="notes-panel"
        class="w-72 md:w-80 border-r border-outline-variant/10 bg-surface-container-lowest flex flex-col overflow-hidden shrink-0 transition-all duration-300">
        <div class="p-4 border-b border-outline-variant/10 flex items-center justify-between gap-1">
            <h3 id="panel-notebook-name" class="font-bold text-lg text-on-surface truncate flex-1">Nombre
                Libreta</h3>
            <button id="panel-add-note" title="Nueva nota"
                class="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors active:scale-95">
                <i data-lucide="plus" style="width:16px;height:16px;"></i>
            </button>
            <button id="collapse-notes-panel" title="Ocultar notas" onclick="window.toggleNotesPanel()"
                class="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors active:scale-95">
                <i data-lucide="panel-left-close" class="w-4 h-4"></i>
            </button>
        </div>
        <div class="relative flex-1 overflow-hidden">
            <div id="notes-list" class="absolute inset-0 overflow-y-auto custom-scrollbar p-3 space-y-1"></div>
            <div id="notes-empty-state"
                class="hidden absolute inset-0 flex-col items-center justify-center p-8 text-center text-on-surface-variant pointer-events-none select-none">
                <i data-lucide="notebook-pen" class="w-10 h-10 mb-3 opacity-30"></i>
                <p class="text-sm font-medium opacity-60">Aún no hay notas,<br>crea una para comenzar.</p>
            </div>
        </div>
    </section>
    <section id="editor-panel" class="flex-1 bg-surface-container-low flex flex-col overflow-hidden relative">
        <button id="show-notes-panel-btn" title="Ver Lista de Notas" onclick="window.toggleNotesPanel()"
            class="hidden absolute top-6 left-6 md:left-8 p-2.5 bg-surface-container/80 backdrop-blur-sm rounded-xl shadow-sm border border-outline-variant/20 text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors z-20">
            <i data-lucide="panel-left" class="w-5 h-5"></i>
        </button>
        <button id="toggle-attachments" title="Ver Adjuntos"
            class="hidden absolute top-6 right-8 p-2.5 bg-surface-container/80 backdrop-blur-sm rounded-xl shadow-sm border border-outline-variant/20 text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors z-20">
            <i data-lucide="paperclip" class="w-5 h-5"></i>
        </button>
        <div id="editor-empty-state"
            class="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-on-surface-variant z-10 bg-surface-container-low">
            <i data-lucide="file-edit" class="w-16 h-16 mb-4 opacity-40"></i>
            <h3 class="text-xl font-bold text-on-surface">Ninguna nota seleccionada</h3>
            <p class="text-sm mt-2 opacity-80">Selecciona una nota de la lista o crea una nueva.</p>
        </div>
        <div id="editor-container" class="flex-1 overflow-y-auto p-8 md:p-12 xl:px-16 w-full mb-20">
            <input type="text" id="note-title" placeholder="Título de la nota..."
                class="text-4xl font-extrabold tracking-tight text-on-surface bg-transparent border-none outline-none mb-6 w-full placeholder:text-on-surface-variant/30 leading-tight">
            <div id="editor" contenteditable="true" spellcheck="true" placeholder="Escribe tus apuntes aquí..."
                class="text-lg text-on-surface leading-relaxed outline-none min-h-[50vh]"></div>
        </div>
        <div id="editor-status-bar"
            class="hidden absolute bottom-6 right-8 flex items-center bg-surface-container-lowest border border-outline-variant/20 rounded-full px-4 py-2 shadow-lg gap-3 z-20">
            <div class="flex items-center gap-1.5 px-3 border-r border-outline-variant/20 mr-1">
                <i data-lucide="type" class="w-4 h-4 text-primary"></i>
                <span id="word-count" class="text-sm font-semibold text-on-surface-variant">0 palabras</span>
            </div>
            <button id="zoom-out" title="Alejar"
                class="text-on-surface-variant hover:text-primary transition-colors"><i
                    data-lucide="minus"></i></button>
            <input type="range" id="zoom-slider" min="50" max="200" value="100" step="10"
                class="w-24 accent-primary">
            <button id="zoom-in" title="Acercar"
                class="text-on-surface-variant hover:text-primary transition-colors"><i
                    data-lucide="plus"></i></button>
            <span id="zoom-label"
                class="text-sm font-semibold min-w-[3ch] text-right text-on-surface-variant">100%</span>
        </div>
    </section>
    <section id="attachments-panel"
        class="w-72 border-l border-outline-variant/10 bg-surface-container-lowest hidden flex-col overflow-hidden shrink-0 transition-all duration-300">
        <div
            class="p-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface/50 backdrop-blur-sm shrink-0">
            <h3 class="font-bold text-sm text-on-surface flex items-center gap-2 uppercase tracking-wide"><i
                    data-lucide="paperclip" class="w-4 h-4 text-primary"></i> Adjuntos</h3>
            <button id="close-attachments"
                class="text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg p-1.5 transition-colors"><i
                    data-lucide="x" class="w-4 h-4"></i></button>
        </div>
        <div class="px-4 py-3 border-b border-outline-variant/10 shrink-0">
            <div class="relative group">
                <i data-lucide="search"
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4 group-focus-within:text-primary transition-colors"></i>
                <input type="text" id="search-attachments"
                    class="w-full pl-9 pr-3 py-2 bg-surface-container border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-on-surface-variant/60"
                    placeholder="Buscar imágenes...">
            </div>
        </div>
        <div id="attachments-list" class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        </div>
    </section>
</div>
````

## File: partials/view-trash.html
````html
<div id="trash-view" class="flex-1 overflow-y-auto p-8 custom-scrollbar relative hidden">
    <div class="mb-12 flex items-end justify-between max-w-7xl mx-auto w-full">
        <div class="pr-8">
            <h2 class="text-4xl font-extrabold tracking-tighter text-on-surface mb-2">Papelera</h2>
            <p class="text-on-surface-variant text-lg font-medium opacity-70">Notas eliminadas (se borrarán en
                30 días por defecto - Puedes cambiarlo en la configuración)</p>
        </div>
        <button id="empty-trash"
            class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-error border border-error/20 dark:border-error/40 hover:bg-error-container rounded-xl transition-colors">
            <i data-lucide="trash-2" style="width:16px;"></i> Vaciar papelera
        </button>
    </div>
    <div id="trash-list"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto w-full">
    </div>
    <div id="trash-empty-state"
        class="hidden flex-col items-center justify-center p-20 text-center text-on-surface-variant">
        <i data-lucide="trash" class="w-16 h-16 mb-4 opacity-40"></i>
        <h3 class="text-xl font-bold text-on-surface">La papelera está vacía</h3>
        <p class="text-sm mt-2 opacity-80">Las notas que elimines aparecerán aquí.</p>
    </div>
</div>
````

## File: pnpm-workspace.yaml
````yaml
allowBuilds:
  electron: false
  electron-winstaller: false
````

## File: js/partials-loader.js
````javascript
function loadPartialSync(name)
⋮----
xhr.onload = () =>
xhr.onerror = () =>
````

## File: modules/tray.js
````javascript
function createTray(getWindow)
⋮----
click: () =>
⋮----
⋮----
function destroyTray()
⋮----
function notifyMinimized()
````

## File: partials/modal-notebook.html
````html
<div id="custom-modal"
    class="fixed inset-0 bg-black/40 backdrop-blur-sm hidden items-center justify-center z-[60] transition-opacity">
    <div class="bg-surface-container-lowest p-6 rounded-2xl w-[400px] shadow-2xl animate-[fadeIn_0.2s_ease-out]">
        <h4 id="modal-title" class="text-xl font-bold mb-2 text-on-surface">Nueva entrada</h4>
        <input type="text" id="modal-input" placeholder="Escribe aquí..."
            class="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface outline-none focus:ring-2 focus:ring-primary/20 mb-1 font-semibold text-lg">
        <p id="modal-error" class="text-xs text-red-500 font-semibold mb-3 hidden">El nombre no puede estar vacío.
        </p>
        <div id="notebook-extra-fields" style="display: none;">
            <div class="mb-4 flex gap-4 p-1 bg-surface-container-high rounded-lg w-fit">
                <label
                    class="cursor-pointer px-4 py-1.5 rounded-md font-medium text-sm transition-colors data-[active=true]:bg-surface-container-lowest data-[active=true]:shadow-sm text-on-surface-variant"
                    data-mode-label="color">
                    <input type="radio" name="cover-mode" value="color" checked class="hidden">
                    <span class="flex items-center gap-1.5"><i data-lucide="palette" style="width:14px;"></i>
                        Color</span>
                </label>
                <label
                    class="cursor-pointer px-4 py-1.5 rounded-md font-medium text-sm transition-colors data-[active=true]:bg-surface-container-lowest data-[active=true]:shadow-sm text-on-surface-variant opacity-60"
                    data-mode-label="image">
                    <input type="radio" name="cover-mode" value="image" class="hidden">
                    <span class="flex items-center gap-1.5"><i data-lucide="image" style="width:14px;"></i>
                        Imagen</span>
                </label>
            </div>
            <div id="cover-color-section" class="mb-4">
                <input type="color" id="modal-color" value="#4338ca"
                    class="w-full h-12 cursor-pointer border-0 rounded-lg p-0 overflow-hidden outline-none bg-transparent">
            </div>
            <div id="cover-image-section" style="display: none;" class="mb-4">
                <input type="file" id="modal-image-file" accept="image/*"
                    class="w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-primary hover:file:bg-indigo-100 transition-all cursor-pointer">
                <p id="current-image-name" class="text-xs text-on-surface-variant mt-2 font-medium"></p>
            </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
            <button id="modal-cancel"
                class="px-5 py-2.5 rounded-lg font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors">Cancelar</button>
            <button id="modal-confirm"
                class="px-5 py-2.5 rounded-lg font-bold bg-primary text-on-primary shadow-md hover:bg-indigo-700 transition-colors">Aceptar</button>
        </div>
    </div>
</div>
<div id="event-modal-overlay"
    class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity hidden">
    <div class="bg-surface-container-lowest p-6 rounded-2xl w-[400px] shadow-2xl animate-[fadeIn_0.2s_ease-out]">
        <h4 class="text-xl font-bold mb-4 text-on-surface">Añadir Evento</h4>
        <div class="space-y-4">
            <div>
                <label
                    class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Título</label>
                <input type="text" id="event-title" placeholder="Ej: Reunión de proyecto"
                    class="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-2.5 text-on-surface outline-none focus:ring-2 focus:ring-primary/20 font-medium">
            </div>
            <div>
                <label
                    class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Descripción</label>
                <textarea id="event-desc" rows="3" placeholder="Detalles opcionales..."
                    class="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-2.5 text-on-surface outline-none focus:ring-2 focus:ring-primary/20 font-medium custom-scrollbar"></textarea>
            </div>
            <div>
                <label
                    class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Color</label>
                <input type="color" id="event-color" value="#4338ca"
                    class="w-full h-10 cursor-pointer border-0 rounded-lg p-0 overflow-hidden outline-none bg-transparent">
            </div>
        </div>
        <div class="flex justify-end gap-3 mt-8">
            <button onclick="document.getElementById('event-modal-overlay').classList.add('hidden')"
                class="px-5 py-2.5 rounded-lg font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors">Cancelar</button>
            <button onclick="window.calendarEngine.saveEvent()"
                class="px-5 py-2.5 rounded-lg font-bold bg-primary text-on-primary shadow-md hover:bg-indigo-700 transition-colors">Guardar</button>
        </div>
    </div>
</div>
<div id="schedule-modal-overlay"
    class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity hidden">
    <div
        class="bg-surface-container-lowest p-6 rounded-2xl w-[450px] shadow-2xl animate-[fadeIn_0.2s_ease-out] max-h-[90vh] flex flex-col">
        <h4 class="text-xl font-bold mb-4 text-on-surface">Gestionar Clases y Horario</h4>
        <div class="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2 mb-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label
                        class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Día</label>
                    <select id="schedule-day"
                        class="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-2.5 text-on-surface outline-none focus:ring-2 focus:ring-primary/20 font-medium">
                        <option value="1">Lunes</option>
                        <option value="2">Martes</option>
                        <option value="3">Miércoles</option>
                        <option value="4">Jueves</option>
                        <option value="5">Viernes</option>
                        <option value="6">Sábado</option>
                    </select>
                </div>
                <div>
                    <label
                        class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Color</label>
                    <input type="color" id="schedule-color" value="#10b981"
                        class="w-full h-[42px] cursor-pointer border-0 rounded-lg p-0 overflow-hidden outline-none bg-transparent">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label
                        class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Inicio</label>
                    <input type="time" id="schedule-start"
                        class="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-2.5 text-on-surface outline-none focus:ring-2 focus:ring-primary/20 font-medium">
                </div>
                <div>
                    <label
                        class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Fin</label>
                    <input type="time" id="schedule-end"
                        class="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-2.5 text-on-surface outline-none focus:ring-2 focus:ring-primary/20 font-medium">
                </div>
            </div>
            <div>
                <label class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Materia /
                    Actividad</label>
                <input type="text" id="schedule-subject" placeholder="Ej: Matemáticas"
                    class="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-2.5 text-on-surface outline-none focus:ring-2 focus:ring-primary/20 font-medium">
            </div>
            <div class="pt-4 border-t border-outline-variant/10">
                <button id="schedule-add-btn" onclick="window.calendarEngine.addScheduleItem()"
                    class="w-full py-2.5 rounded-lg font-bold bg-primary text-on-primary shadow-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                    <i data-lucide="plus" class="w-4 h-4"></i> Añadir al Horario
                </button>
            </div>
            <div id="schedule-modal-list" class="space-y-2 mt-4">
            </div>
        </div>
        <div class="flex justify-end pt-4 border-t border-outline-variant/10 shrink-0">
            <button onclick="document.getElementById('schedule-modal-overlay').classList.add('hidden')"
                class="px-5 py-2.5 rounded-lg font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors">Cerrar</button>
        </div>
    </div>
</div>
<input type="color" id="text-color-picker"
    class="opacity-0 absolute w-0 h-0 p-0 m-0 cursor-pointer pointer-events-none" style="display:none;">
````

## File: partials/sidebar.html
````html
<aside
    class="w-64 border-r border-outline-variant/20 bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-md flex flex-col h-full py-6 px-4 transition-all duration-300 ease-in-out"
    id="sidebar">
    <div class="mb-8 px-2 cursor-pointer flex items-center gap-3 overflow-hidden" onclick="showDashboard('all')">
        <div
            class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shrink-0 border border-indigo-400/20">
            <i data-lucide="book-marked" class="text-white w-5 h-5 drop-shadow-sm"></i>
        </div>
        <div class="sidebar-text transition-opacity duration-300 flex flex-col items-start justify-center">
            <h1 class="font-extrabold text-indigo-700 dark:text-indigo-400 whitespace-nowrap logo-font leading-none">
                NoteVault
            </h1>
            <p style="padding-left: 1px;" id="pro-edition"
                class="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mt-1 opacity-70 cursor-pointer select-none">
                Pro Edition</p>
        </div>
    </div>
    <nav class="flex-1 flex flex-col overflow-hidden min-h-0">
        <div id="main-nav-links" class="flex flex-col space-y-1 shrink-0">
            <a id="nav-library" title="Librería"
                class="nav-item active text-slate-600 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/40 rounded-lg flex items-center gap-3 px-3 py-2.5 cursor-pointer active:scale-95 transition-colors duration-200 font-medium text-sm overflow-hidden"
                onclick="showDashboard('all')">
                <i data-lucide="library" class="shrink-0"></i>
                <span class="sidebar-text whitespace-nowrap transition-opacity duration-300">Librería</span>
            </a>
            <a id="nav-favorites" title="Favoritos"
                class="nav-item text-slate-600 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/40 rounded-lg flex items-center gap-3 px-3 py-2.5 cursor-pointer active:scale-95 transition-colors duration-200 font-medium text-sm overflow-hidden"
                onclick="showDashboard('favorites')">
                <i data-lucide="star" class="shrink-0"></i>
                <span class="sidebar-text whitespace-nowrap transition-opacity duration-300">Favoritos</span>
            </a>
            <a id="nav-calendar" title="Calendario y Horario"
                class="nav-item text-slate-600 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/40 rounded-lg flex items-center gap-3 px-3 py-2.5 cursor-pointer active:scale-95 transition-colors duration-200 font-medium text-sm overflow-hidden"
                onclick="window.showCalendar()">
                <i data-lucide="calendar-days" class="shrink-0"></i>
                <span class="sidebar-text whitespace-nowrap transition-opacity duration-300">Calendario</span>
            </a>
            <a id="nav-trash" title="Papelera"
                class="nav-item text-slate-600 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/40 rounded-lg flex items-center gap-3 px-3 py-2.5 cursor-pointer active:scale-95 transition-colors duration-200 font-medium text-sm overflow-hidden"
                onclick="showTrash()">
                <i data-lucide="trash-2" class="shrink-0"></i>
                <span class="sidebar-text whitespace-nowrap transition-opacity duration-300">Papelera</span>
            </a>
        </div>
        <div class="mt-6 pt-6 border-t border-outline-variant/10 flex-1 overflow-hidden flex flex-col">
            <h4
                class="text-xs text-on-surface-variant font-bold uppercase tracking-widest px-3 mb-2 flex items-center justify-between overflow-hidden">
                <span class="sidebar-text whitespace-nowrap transition-opacity duration-300">Mis Libretas</span>
                <button class="hover:text-primary transition-colors shrink-0"
                    onclick="document.getElementById('add-notebook').click()"><i data-lucide="plus"
                        style="width:14px;height:14px;"></i></button>
            </h4>
            <div id="notebook-list" class="space-y-0.5 overflow-y-auto flex-1 custom-scrollbar -mx-2 px-2 pb-4">
            </div>
        </div>
        <div id="media-player" class="hidden mt-4 pt-4 border-t border-outline-variant/10 shrink-0">
            <div class="flex items-center justify-between mb-2 overflow-hidden">
                <span
                    class="text-xs font-bold uppercase tracking-widest text-on-surface-variant sidebar-text whitespace-nowrap transition-opacity duration-300">Reproduciendo</span>
                <button
                    onclick="document.getElementById('media-player').classList.add('hidden'); window.mediaTempDisabled = true;"
                    class="text-on-surface-variant hover:text-error transition-colors shrink-0"><i data-lucide="x"
                        class="w-3 h-3"></i></button>
            </div>
            <div class="glass-player-card p-4 relative group">
                <div
                    class="absolute inset-0 bg-gradient-to-br from-indigo-500/10 dark:from-indigo-500/15 via-transparent to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500 rounded-[8px]">
                </div>
                <div class="relative z-10">
                    <div class="truncate text-sm font-extrabold text-indigo-950 dark:text-white drop-shadow-sm sidebar-text transition-opacity duration-300"
                        id="media-title">Sin reproducción</div>
                    <div class="truncate text-xs text-indigo-600 dark:text-slate-400 font-medium mt-0.5 sidebar-text transition-opacity duration-300"
                        id="media-artist">...</div>
                    <div class="flex items-center justify-center gap-5 mt-1">
                        <button onclick="window.api.mediaPrev()" title="Anterior" class="player-btn-secondary"><i
                                data-lucide="skip-back" class="w-4 h-4 fill-current"></i></button>
                        <button onclick="window.api.mediaToggle()" title="Reproducir/Pausa"
                            class="player-play-btn w-11 h-11 rounded-full flex items-center justify-center">
                            <i data-lucide="play" id="media-play-icon" class="w-5 h-5 fill-current ml-0.5"></i>
                        </button>
                        <button onclick="window.api.mediaNext()" title="Siguiente" class="player-btn-secondary"><i
                                data-lucide="skip-forward" class="w-4 h-4 fill-current"></i></button>
                    </div>
                </div>
            </div>
        </div>
    </nav>
    <div id="bottom-nav-links" class="mt-auto pt-4 border-t border-outline-variant/10 space-y-1">
        <a id="settings-btn" title="Configuración"
            class="nav-item text-slate-600 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/40 rounded-lg flex items-center gap-3 px-3 py-2.5 cursor-pointer active:scale-95 transition-colors duration-200 font-medium text-sm overflow-hidden">
            <i data-lucide="settings" class="shrink-0"></i>
            <span class="sidebar-text whitespace-nowrap transition-opacity duration-300">Configuración</span>
        </a>
        <a id="profile-btn" title="Perfil"
            class="nav-item text-slate-600 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/40 rounded-lg flex items-center gap-3 px-3 py-2.5 cursor-pointer active:scale-95 transition-colors duration-200 font-medium text-sm overflow-hidden">
            <i data-lucide="user" class="shrink-0"></i>
            <span class="sidebar-text whitespace-nowrap transition-opacity duration-300">Perfil</span>
        </a>
    </div>
</aside>
````

## File: partials/view-dashboard.html
````html
<div id="dashboard" class="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
    <div id="user-greeting" class="hidden mb-12 animate-[fadeIn_0.5s_ease-out] max-w-7xl mx-auto w-full">
        <h1 id="user-greeting-text" class="text-4xl font-black text-on-surface tracking-tighter"></h1>
        <div class="h-1.5 w-24 bg-indigo-500 mt-3 rounded-full opacity-60"></div>
    </div>
    <div id="notebook-loader" class="flex justify-center items-center p-12">
        <div class="dots-loader">
            <div></div>
            <div></div>
            <div></div>
        </div>
    </div>
    <div id="notebook-grid"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto w-full">
    </div>
    <div id="empty-state"
        class="hidden flex-col items-center justify-center p-20 text-center text-on-surface-variant">
        <i data-lucide="book-x" class="w-16 h-16 mb-4 opacity-40"></i>
        <h3 class="text-xl font-bold text-on-surface">No hay libretas aquí</h3>
        <p class="text-sm mt-2 opacity-80">Empieza creando una nueva libreta.</p>
        <button onclick="document.getElementById('add-notebook').click()"
            class="mt-6 font-semibold text-primary hover:underline">Crear libreta</button>
    </div>
    <div id="recent-notes-section" class="hidden max-w-7xl mx-auto w-full mt-10 mb-4">
        <div class="flex items-center gap-3 mb-4">
            <i data-lucide="clock" class="w-4 h-4" style="color: var(--color-text-tertiary, #9ca3af);"></i>
            <h2 class="uppercase" style="font-size: 11px; letter-spacing: 0.1em; color: var(--color-text-tertiary, #9ca3af);">
                Notas Recientes</h2>
        </div>
        <div id="recent-notes-list"
            class="flex flex-col gap-2">
        </div>
    </div>
</div>
````

## File: preload.js
````javascript
saveData: (data)
loadData: ()
⋮----
saveNoteContent: (id, content) => ipcRenderer.invoke('save-note-content',
loadNote: (id)
⋮----
uploadCover: (path)
savePastedImage: (data)
deleteAttachment: (url)
deleteCover: (path)
deleteNoteFile: (id)
⋮----
showNotebookMenu: (data)
onNotebookAction: (callback)
showNoteMenu: (data)
onNoteAction: (callback)
⋮----
showEditMenu: ()
onEditAction: (callback)
showImageMenu: ()
onImageAction: (callback)
⋮----
onAppClosing: (callback)
onForceSave: (callback)
sendSafeCloseReady: ()
⋮----
onMediaUpdate: (callback)
mediaToggle: ()
mediaNext: ()
mediaPrev: ()
checkMediaNow: ()
⋮----
onMenuAction: (callback)
````

## File: modules/ipc-handlers.js
````javascript
function registerIpcHandlers(
⋮----
function normalizePath(input)
⋮----
function isInsideDir(baseDir, candidate)
⋮----
function sanitizeFileId(id)
⋮----
async function readJsonFile(filePath)
⋮----
async function pathExists(filePath)
⋮----
async function loadPersistedData()
⋮----
async function writeAtomicJson(filePath, data)
⋮----
async function safeDeleteInsideDir(baseDir, candidatePath)
⋮----
click: () =>
⋮----
````

## File: modules/media.js
````javascript
function initMedia(getWindow)
⋮----
function checkMedia(getWindow)
````

## File: modules/menu.js
````javascript
function setupMenu(mainWindow, debug)
⋮----
click: () =>
````

## File: partials/context-menu.html
````html
<div id="custom-context-menu"
    class="fixed hidden z-[100] bg-surface-container-lowest/90 dark:bg-slate-900/95 backdrop-blur-xl border border-outline-variant/30 dark:border-white/10 rounded-2xl shadow-2xl min-w-[220px] py-2 animate-[fadeIn_0.15s_ease-out] overflow-visible">
    <div class="flex flex-col">
        <button data-action="bold"
            class="menu-item flex items-center justify-between px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors text-sm font-medium text-on-surface dark:text-slate-200">
            <div class="flex items-center gap-3"><i data-lucide="bold" class="w-4 h-4 text-primary"></i> Negrita
            </div>
            <span class="text-[10px] opacity-40 font-bold">Ctrl+B</span>
        </button>
        <button data-action="italic"
            class="menu-item flex items-center justify-between px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors text-sm font-medium text-on-surface dark:text-slate-200">
            <div class="flex items-center gap-3"><i data-lucide="italic" class="w-4 h-4 text-primary"></i> Cursiva
            </div>
            <span class="text-[10px] opacity-40 font-bold">Ctrl+I</span>
        </button>
        <button data-action="underline"
            class="menu-item flex items-center justify-between px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors text-sm font-medium text-on-surface dark:text-slate-200">
            <div class="flex items-center gap-3"><i data-lucide="underline" class="w-4 h-4 text-primary"></i>
                Subrayado</div>
            <span class="text-[10px] opacity-40 font-bold">Ctrl+U</span>
        </button>
        <button data-action="strikethrough"
            class="menu-item flex items-center justify-between px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors text-sm font-medium text-on-surface dark:text-slate-200">
            <div class="flex items-center gap-3"><i data-lucide="strikethrough" class="w-4 h-4 text-primary"></i>
                Tachado</div>
        </button>
        <div class="h-px bg-outline-variant/10 dark:bg-white/5 my-1 mx-2"></div>
        <div class="group/sub relative">
            <div
                class="menu-item flex items-center justify-between px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors text-sm font-medium text-on-surface dark:text-slate-200 cursor-default">
                <div class="flex items-center gap-3"><i data-lucide="text-quote" class="w-4 h-4 text-primary"></i>
                    Tamaño de fuente</div>
                <i data-lucide="chevron-right" class="w-3 h-3 opacity-40"></i>
            </div>
            <div
                class="invisible opacity-0 group-hover/sub:visible group-hover/sub:opacity-100 transition-all duration-200 flex flex-col absolute left-full top-0 ml-[-2px] bg-surface-container-lowest/95 dark:bg-slate-900/98 backdrop-blur-xl border border-outline-variant/30 dark:border-white/10 rounded-2xl shadow-2xl min-w-[160px] py-2">
                <button data-action="fontSize" data-value="12px"
                    class="px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left">Pequeño
                    (12px)</button>
                <button data-action="fontSize" data-value="18px"
                    class="px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left">Normal
                    (18px)</button>
                <button data-action="fontSize" data-value="20px"
                    class="px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left">Mediano
                    (20px)</button>
                <button data-action="fontSize" data-value="28px"
                    class="px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left">Grande
                    (28px)</button>
                <button data-action="fontSize" data-value="36px"
                    class="px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left">Extra
                    Grande (36px)</button>
            </div>
        </div>
        <div class="group/sub relative">
            <div
                class="menu-item flex items-center justify-between px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors text-sm font-medium text-on-surface dark:text-slate-200 cursor-default">
                <div class="flex items-center gap-3"><i data-lucide="highlighter" class="w-4 h-4 text-primary"></i>
                    Resaltar texto</div>
                <i data-lucide="chevron-right" class="w-3 h-3 opacity-40"></i>
            </div>
            <div
                id="highlight-submenu"
                class="invisible opacity-0 group-hover/sub:visible group-hover/sub:opacity-100 transition-all duration-200 flex flex-col absolute left-full top-0 ml-[-2px] bg-surface-container-lowest/95 dark:bg-slate-900/98 backdrop-blur-xl border border-outline-variant/30 dark:border-white/10 rounded-2xl shadow-2xl min-w-[160px] py-2 max-h-72 overflow-y-auto overflow-x-hidden custom-scrollbar overscroll-contain">
                <button data-action="highlight" data-value="yellow"
                    class="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left">
                    <div class="w-3 h-3 rounded-full bg-[#fef08a] border border-black/10"></div> Amarillo
                </button>
                <button data-action="highlight" data-value="green"
                    class="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left">
                    <div class="w-3 h-3 rounded-full bg-[#86efac] border border-black/10"></div> Verde
                </button>
                <button data-action="highlight" data-value="blue"
                    class="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left">
                    <div class="w-3 h-3 rounded-full bg-[#bfdbfe] border border-black/10"></div> Azul
                </button>
                <button data-action="highlight" data-value="red"
                    class="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left">
                    <div class="w-3 h-3 rounded-full bg-[#fecaca] border border-black/10"></div> Rojo
                </button>
                <button data-action="highlight" data-value="orange"
                    class="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left">
                    <div class="w-3 h-3 rounded-full bg-[#fdba74] border border-black/10"></div> Naranja
                </button>
                <button data-action="highlight" data-value="pink"
                    class="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left">
                    <div class="w-3 h-3 rounded-full bg-[#f9a8d4] border border-black/10"></div> Rosa
                </button>
                <button data-action="highlight" data-value="purple"
                    class="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left">
                    <div class="w-3 h-3 rounded-full bg-[#d8b4fe] border border-black/10"></div> Morado
                </button>
                <button data-action="highlight" data-value="indigo"
                    class="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left">
                    <div class="w-3 h-3 rounded-full bg-[#c7d2fe] border border-black/10"></div> Índigo
                </button>
                <button data-action="highlight" data-value="teal"
                    class="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left">
                    <div class="w-3 h-3 rounded-full bg-[#99f6e4] border border-black/10"></div> Verde azulado
                </button>
                <button data-action="highlight" data-value="cyan"
                    class="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left">
                    <div class="w-3 h-3 rounded-full bg-[#a5f3fc] border border-black/10"></div> Cian
                </button>
                <button data-action="highlight" data-value="lime"
                    class="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left">
                    <div class="w-3 h-3 rounded-full bg-[#d9f99d] border border-black/10"></div> Lima
                </button>
                <button data-action="highlight" data-value="amber"
                    class="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left">
                    <div class="w-3 h-3 rounded-full bg-[#fde68a] border border-black/10"></div> Ámbar
                </button>
                <button data-action="highlight" data-value="rose"
                    class="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left">
                    <div class="w-3 h-3 rounded-full bg-[#fecdd3] border border-black/10"></div> Rosa fuerte
                </button>
                <button data-action="highlight" data-value="gray"
                    class="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left">
                    <div class="w-3 h-3 rounded-full bg-[#e5e7eb] border border-black/10"></div> Gris
                </button>
                <button data-action="highlight" data-value="brown"
                    class="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left">
                    <div class="w-3 h-3 rounded-full bg-[#d6b38a] border border-black/10"></div> Café
                </button>
                <button data-action="highlight" data-value="mint"
                    class="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left">
                    <div class="w-3 h-3 rounded-full bg-[#bbf7d0] border border-black/10"></div> Menta
                </button>
                <button data-action="highlight" data-value="none"
                    class="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left"><i
                        data-lucide="eraser" class="w-3 h-3"></i> Quitar resaltado</button>
            </div>
        </div>
        <div class="group/sub relative">
            <div
                class="menu-item flex items-center justify-between px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors text-sm font-medium text-on-surface dark:text-slate-200 cursor-default">
                <div class="flex items-center gap-3"><i data-lucide="palette" class="w-4 h-4 text-primary"></i>
                    Color de texto</div>
                <i data-lucide="chevron-right" class="w-3 h-3 opacity-40"></i>
            </div>
            <div
                class="invisible opacity-0 group-hover/sub:visible group-hover/sub:opacity-100 transition-all duration-200 flex flex-col absolute left-full top-0 ml-[-2px] bg-surface-container-lowest/95 dark:bg-slate-900/98 backdrop-blur-xl border border-outline-variant/30 dark:border-white/10 rounded-2xl shadow-2xl min-w-[160px] py-2">
                <button data-action="foreColor" data-value="#e74c3c"
                    class="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left">
                    <div class="w-3 h-3 rounded-full bg-[#e74c3c]"></div> Rojo
                </button>
                <button data-action="foreColor" data-value="#2383e2"
                    class="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left">
                    <div class="w-3 h-3 rounded-full bg-[#2383e2]"></div> Azul
                </button>
                <button data-action="foreColor" data-value="#2ecc71"
                    class="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left">
                    <div class="w-3 h-3 rounded-full bg-[#2ecc71]"></div> Verde
                </button>
                <button data-action="foreColor" data-value="#f39c12"
                    class="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left">
                    <div class="w-3 h-3 rounded-full bg-[#f39c12]"></div> Naranja
                </button>
                <button data-action="pick-custom-color"
                    class="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left"><i
                        data-lucide="pipette" class="w-3 h-3"></i> Personalizado...</button>
                <button data-action="removeColor"
                    class="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20 text-xs font-medium text-on-surface dark:text-slate-200 text-left"><i
                        data-lucide="undo" class="w-3 h-3"></i> Quitar color</button>
            </div>
        </div>
        <div class="h-px bg-outline-variant/10 dark:bg-white/5 my-1 mx-2"></div>
        <button data-action="removeFormat"
            class="menu-item flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors text-sm font-bold text-red-500 dark:text-red-400">
            <i data-lucide="eraser" class="w-4 h-4"></i> Limpiar todo el formato
        </button>
    </div>
</div>
````

## File: js/notes.js
````javascript
export function renderNotesList()
⋮----
item.onclick = (e) =>
⋮----
item.querySelector('.item-options').onclick = (e) =>
⋮----
item.oncontextmenu = (e) =>
⋮----
export function cleanupOrphans()
⋮----
export async function selectNote(id)
⋮----
export async function addNote()
⋮----
export function renderTrashList()
⋮----
card.querySelector('.restore-btn').onclick = ()
card.querySelector('.delete-forever-btn').onclick = ()
⋮----
export async function restoreNote(id)
⋮----
export async function permanentlyDeleteNote(id)
⋮----
export async function cleanupTrash()
````

## File: js/utils.js
````javascript
export function refreshIcons()
⋮----
export function escapeHTML(value)
⋮----
export function stripHTML(html)
⋮----
function sanitizeStyleValue(styleValue)
⋮----
function sanitizeUrlAttribute(value, allowData = false)
⋮----
function unwrapElement(el)
⋮----
export function sanitizeHTML(html)
⋮----
export function showModal(title, placeholder, initialValue = '')
⋮----
const closeModal = (value) =>
⋮----
const tryConfirm = () =>
⋮----
newCancelBtn.onclick = ()
⋮----
const onKeydown = (e) =>
⋮----
input.oninput = () =>
⋮----
export function cleanHTML(html)
⋮----
export function createId()
⋮----
export function safeHexColor(value, fallback = '#2b2d2e')
⋮----
export function hexToRgba(value, alpha = 1, fallback = 'rgba(43,45,46,1)')
⋮----
/**
 * Hash djb2 sobre un string.
 *
 * Uso:
 * - Fingerprints rápidos para detectar cambios (no criptográfico).
 * - Salida en base-36 para almacenamiento compacto (ej: "3q4r7a").
 *
 * Nota: no usar para seguridad, firmas o autenticación.
 */
export function hashString(str)
⋮----
h = h >>> 0; // keep unsigned 32-bit
⋮----
/**
 * Genera un preview en texto plano (máx. 150 chars) a partir de HTML.
 *
 * Convención:
 * - Devuelve string vacío para notas en blanco (facilita filtros y evita ruido en UI).
 */
export function buildPreview(htmlContent)
````

## File: README.md
````markdown
<div align="center">

<img src="https://img.shields.io/badge/version-1.3.0-e8ff47?style=for-the-badge&labelColor=111111" alt="Version"/>
<img src="https://img.shields.io/badge/platform-Windows-4a9eff?style=for-the-badge&logo=windows&logoColor=white&labelColor=111111" alt="Platform"/>
<img src="https://img.shields.io/badge/Electron-JS-47b4e8?style=for-the-badge&logo=electron&logoColor=white&labelColor=111111" alt="Electron"/>
<img src="https://img.shields.io/badge/license-Personal_Use-ff4757?style=for-the-badge&labelColor=111111" alt="License"/>

<br/><br/>

```
███╗   ██╗ ██████╗ ████████╗███████╗██╗   ██╗ █████╗ ██╗   ██╗██╗  ████████╗
████╗  ██║██╔═══██╗╚══██╔══╝██╔════╝██║   ██║██╔══██╗██║   ██║██║  ╚══██╔══╝
██╔██╗ ██║██║   ██║   ██║   █████╗  ██║   ██║███████║██║   ██║██║     ██║   
██║╚██╗██║██║   ██║   ██║   ██╔══╝  ╚██╗ ██╔╝██╔══██║██║   ██║██║     ██║   
██║ ╚████║╚██████╔╝   ██║   ███████╗ ╚████╔╝ ██║  ██║╚██████╔╝███████╗██║   
╚═╝  ╚═══╝ ╚═════╝    ╚═╝   ╚══════╝  ╚═══╝  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝   
```

### 📔 University Manager · Pro Edition

**Tu bóveda personal de conocimiento académico.**  
Aplicación de escritorio moderna construida sobre Electron con estética OLED premium y glassmorphism.

<br/>

[🚀 Instalación rápida](#-instalación) · [✨ Características](#-características) · [⌨️ Shortcuts](#️-atajos-de-teclado) · [⚙️ Configuración](#️-configuración)

</div>

---

## ✨ Características

<table>
<tr>
<td width="50%" valign="top">

### 📁 Organización Inteligente
- **Libretas personalizadas** con colores o portadas de imagen
- **Buscador avanzado** desde el dashboard principal
- **Sección de Favoritos** para acceso rápido
- **Papelera con retención configurable** (30 días por defecto) y limpieza automática

</td>
<td width="50%" valign="top">

### ✍️ Editor de Texto Enriquecido
- **Formato completo**: negrita, cursiva, subrayado, colores y resaltados
- **Listas de tareas interactivas** con checkboxes funcionales
- **Control de zoom** para mayor comodidad visual
- **Contador de palabras en tiempo real**

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🖼️ Gestión Multimedia
- **Panel de adjuntos**: visualiza y busca imágenes y enlaces insertados
- **Redimensionado de imágenes**: 25% / 50% / 75% / 100% con control de alineación
- **Integración con reproductores** (Spotify y otros) desde la barra lateral

</td>
<td width="50%" valign="top">

### 🎨 Estética Premium
- **Modo OLED Dark** con negros profundos y acentos vibrantes
- **Efectos de transparencia** (`backdrop-blur`) para sensación de profundidad
- **Tipografía Inter** optimizada para pantallas de alta resolución

</td>
</tr>
</table>

---

## 🚀 Instalación

### Requisitos previos

| Herramienta | Versión recomendada | Enlace |
|---|---|---|
| Node.js | LTS | [nodejs.org](https://nodejs.org/) |
| npm | incluido con Node | — |

### Pasos

```bash
# 1 · Clonar el repositorio
git clone https://github.com/vC3sar/NoteVault.git
cd NoteVault

# 2 · Instalar dependencias
npm install

# 3 · Ejecutar en modo desarrollo
npm start

# 4 · Construir ejecutable para producción
npm run build
```

> **Tip:** Para desarrollo, `npm start` abre NoteVault con DevTools disponible via `F12`.

---

## ⌨️ Atajos de Teclado

### Editor

| Atajo | Acción |
|---|---|
| `Ctrl + B` | **Negrita** |
| `Ctrl + I` | *Cursiva* |
| `Ctrl + U` | Subrayado |

### Navegación

| Atajo | Acción |
|---|---|
| `Ctrl + L` | Ir a la Librería |
| `Ctrl + F` | Ir a Favoritos |
| `Ctrl + T` | Ir a la Papelera |

### Debug

| Atajo | Acción |
|---|---|
| `Ctrl + R` | Recargar aplicación |
| `F12` | Abrir DevTools |

---

## ⚙️ Configuración

Accede al panel de **Ajustes** desde la barra lateral para personalizar:

```
Ajustes
├── 🎨 Temas ............... Sistema / Claro / Oscuro / OLED
├── 🗑️ Retención papelera .. Días antes del borrado definitivo
├── 💾 Autoguardado ........ Intervalo en minutos
└── 🎵 Reproductor ......... Mostrar / ocultar en la sidebar
```

---

## 🛠️ Stack Tecnológico

```
NoteVault
├── Core
│   ├── JavaScript (ES6+)
│   ├── Node.js
│   └── Electron
├── Estilos
│   ├── Tailwind CSS (JIT mode)
│   └── CSS3 Custom Properties
├── UI
│   └── Lucide Icons
├── Almacenamiento
│   └── Sistema de archivos local (JSON + HTML)
└── Integraciones
    └── win-media-control-enhanced (Windows Media Session API)
```

---

## 📁 Estructura del Proyecto

```
NoteVault/
├── main.js              ← Proceso principal de Electron
├── preload.js           ← Bridge renderer ↔ main
├── package.json
├── src/
│   ├── renderer/        ← UI (HTML + JS + CSS)
│   ├── components/      ← Componentes reutilizables
│   └── styles/          ← Tailwind + estilos globales
├── assets/
│   └── icons/
└── data/                ← Almacenamiento local (generado en runtime)
    ├── notebooks/
    └── settings.json
```

> **Nota:** La carpeta `data/` se genera automáticamente en el primer arranque.

---

## 📄 Licencia

```text
Licencia de Uso Personal · Copyright (c) 2025 vC3sar · vazquezsg.ovh
```

Prohibido su uso comercial, venta o reventa. Consulta el archivo [`LICENSE.txt`](LICENSE.txt) para los términos completos.

---

<div align="center">

Hecho con ❤️ por **[vC3sar](https://vazquezsg.ovh)** · Vazquezsg.ovh

*NoteVault — Tu bóveda personal de conocimiento.*

</div>
````

## File: js/calendar.js
````javascript
export function initCalendar()
⋮----
export function renderCalendar()
⋮----
// Relleno con días del mes anterior para completar la grilla.
⋮----
// Días del mes actual.
⋮----
// Relleno con días del mes siguiente para completar la grilla (6 filas = 42 celdas).
⋮----
function createDayCell(date, isPadding, isToday = false, isSelected = false)
⋮----
cell.onclick = ()
⋮----
export function navigateMonth(delta)
⋮----
export function goToToday()
⋮----
export function selectDay(date)
⋮----
export function renderDayDetails(date)
⋮----
export function showEventModal(id = null)
⋮----
export async function saveEvent()
⋮----
export async function deleteEvent(id)
⋮----
export function showScheduleModal()
⋮----
export function setScheduleMode(mode)
⋮----
export async function addScheduleItem()
⋮----
export function editScheduleItem(id)
⋮----
export async function deleteScheduleItem(id)
⋮----
export function renderScheduleList()
⋮----
function renderScheduleModalList()
````

## File: js/events.js
````javascript
export function setupEventListeners()
⋮----
item.onclick = ()
⋮----
// Preferencia del SO: reaccionar sólo cuando el tema está configurado como `system`.
````

## File: js/ipc.js
````javascript

````

## File: js/state.js
````javascript
function normalizeNote(note)
⋮----
// Compatibilidad hacia atrás: versiones antiguas persistían `content` completo en JSON.
// Si llega aquí, generamos `preview`/`previewHash` en caliente. El renderer también
// ejecuta un backfill cuando el `.html` existe pero el preview falta.
⋮----
function normalizeNotebook(notebook)
⋮----
function normalizeTrashNote(note)
⋮----
export function normalizeLoadedData(data)
⋮----
function serializeNoteForDisk(note)
⋮----
export async function saveAll()
````

## File: modules/window.js
````javascript
function createWindow(debug, checkMedia)
⋮----
click: ()
````

## File: package.json
````json
{
  "name": "notevault",
  "version": "1.3.1",
  "description": "NoteVault Electron App",
  "main": "main.js",
  "author": "vc3sar",
  "scripts": {
    "start": "electron .",
    "prebuild": "if exist dist rd /s /q dist",
    "build": "electron-builder"
  },
  "build": {
    "appId": "ovh.vazquezsg.NoteVault",
    "productName": "NoteVault",
    "compression": "maximum",
    "win": {
      "icon": "img/logo.ico",
      "target": "nsis"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "license": "LICENSE.txt"
    }
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^26.8.1"
  },
  "dependencies": {
    "win-media-control-enhanced": "latest"
  },
  "pnpm": {
    "onlyBuiltDependencies": [
      "electron",
      "electron-winstaller",
      "app-builder-bin",
      "7zip-bin"
    ]
  }
}
````

## File: js/editor.js
````javascript
export function executeEditAction(data)
⋮----
export async function forceSaveNote()
⋮----
return; // Sin cambios, omitir I/O
⋮----
export const handleInput = () =>
⋮----
export function updateWordCount()
⋮----
export function updateAttachmentsIfNeeded(resetSearch = false)
⋮----
export function renderAttachments(searchTerm = '')
⋮----
div.onclick = () =>
⋮----
export function setupEditor()
⋮----
const positionContextMenu = (menu, clientX, clientY) =>
⋮----
const setupHighlightSubmenuScroll = () =>
⋮----
reader.onload = (ev)
````

## File: main.js
````javascript

````

## File: renderer.js
````javascript
async function initApp()
⋮----
async function backfillPreviews()
⋮----
} catch (_) { /* nota sin archivo `.html` todavía */ }
⋮----
if (!html) continue; // Nota vacía: no generar preview.
⋮----
// Si el hash coincide con el guardado, el preview ya es válido (sólo faltaría persistir).
⋮----
if (!newPreview) continue; // sigue vacía
⋮----
// Si los partials ya se cargaron (el loader corrió antes que este módulo), arrancar ya.
// Si no, esperar el evento.
⋮----
export function startPeriodicAutosave()
````

## File: js/notebooks.js
````javascript
export function renderNotebookGrid(searchQuery = '')
⋮----
card.onclick = (e) =>
⋮----
card.querySelector('.card-options').onclick = (e) =>
⋮----
card.oncontextmenu = (e) =>
⋮----
export function renderSidebar()
⋮----
item.onclick = (e) =>
⋮----
item.oncontextmenu = (e) =>
⋮----
export function selectNotebook(id)
⋮----
export async function addNotebook()
⋮----
function timeAgo(timestamp)
⋮----
export function renderRecentNotes()
⋮----
function hashString(str)
⋮----
item.onclick = () =>
````

## File: js/ui.js
````javascript
export function applyTheme(theme)
⋮----
export function showDashboard(view = state.currentView)
⋮----
export function showTrash()
⋮----
export function showCalendar()
⋮----
export function updateZoom(newZoom)
⋮----
export function toggleSidebar()
⋮----
export function refreshSidebarState()
⋮----
export function updateGreeting()
⋮----
const render = () =>
⋮----
export function toggleNotesPanel()
````

## File: index.html
````html
<!DOCTYPE html>
<html lang="es" class="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy"
        content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: file: blob:;">
    <title>NoteVault - University Manager</title>
    <script src="lib/tailwind.min.js"></script>
    <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@800&display=swap"
        rel="stylesheet" />
    <link rel="stylesheet" href="styles.css">
    <script src="js/tailwind-config.js"></script>
</head>
<body class="bg-surface text-on-surface flex h-screen overflow-hidden font-sans">
    <div id="video-loader" class="fixed inset-0 z-50 flex items-center justify-center bg-[#111111] transition-opacity duration-500">
        <video id="intro-video" class="w-full h-full object-cover" autoplay muted playsinline>
            <source src="mp4/notevault.mp4" type="video/mp4">
        </video>
    </div>
    <div data-partial="sidebar"></div>
    <main class="flex-1 flex flex-col bg-surface-container-low overflow-hidden relative">
        <div data-partial="navbar"></div>
        <div data-partial="view-dashboard"></div>
        <div data-partial="view-trash"></div>
        <div data-partial="view-calendar"></div>
        <div data-partial="view-notebook"></div>
    </main>
    <div data-partial="modal-settings"></div>
    <div data-partial="modal-profile"></div>
    <div data-partial="modal-notebook"></div>
    <div data-partial="context-menu"></div>
    <script src="lib/lucide.min.js"></script>
    <script src="js/partials-loader.js"></script>
    <script type="module" src="renderer.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const videoLoader = document.getElementById('video-loader');
            const introVideo = document.getElementById('intro-video');
            if (introVideo && videoLoader) {
                // When video finishes playing
                introVideo.addEventListener('ended', () => {
                    videoLoader.style.opacity = '0';
                    setTimeout(() => {
                        videoLoader.remove();
                    }, 500); // Wait for transition to finish
                });
                // Fail-safe in case video cannot auto-play or encounters an error
                introVideo.addEventListener('error', () => {
                    videoLoader.remove();
                });
            }
        });
    </script>
</body>
</html>
````

## File: styles.css
````css
body {
⋮----
.logo-font {
⋮----
.dots-loader {
⋮----
.dots-loader div {
⋮----
.dots-loader div:nth-child(1) {
⋮----
.dots-loader div:nth-child(2) {
⋮----
.gold-letter {
⋮----
#notebook-view {
⋮----
#dashboard {
⋮----
[data-lucide] {
⋮----
#editor {
⋮----
#editor s,
⋮----
.dark #editor,
⋮----
[contenteditable]:empty:before {
⋮----
.nav-item.active {
⋮----
.dark .nav-item.active {
⋮----
.custom-scrollbar {
⋮----
.dark .custom-scrollbar {
⋮----
.custom-scrollbar::-webkit-scrollbar {
⋮----
.custom-scrollbar:hover::-webkit-scrollbar {
⋮----
.custom-scrollbar::-webkit-scrollbar-track {
⋮----
.custom-scrollbar::-webkit-scrollbar-thumb {
⋮----
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
⋮----
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
⋮----
.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
⋮----
input[type="color"]::-webkit-color-swatch-wrapper {
⋮----
input[type="color"]::-webkit-color-swatch {
⋮----
.notebook-spine {
⋮----
.notebook-spine::after {
⋮----
.notebook-ring {
⋮----
.dark .notebook-ring {
⋮----
/* Dark Mode Graphite */
:root {
⋮----
.dark {
⋮----
.dark .bg-surface {
⋮----
.dark .text-on-surface {
⋮----
.dark .bg-surface-container-low {
⋮----
.dark .bg-surface-container {
⋮----
.dark .bg-surface-container-high {
⋮----
.dark .bg-surface-container-highest {
⋮----
.dark .bg-surface-container-lowest {
⋮----
.dark .bg-surface-bright {
⋮----
.dark .text-on-surface-variant {
⋮----
.dark .bg-surface-variant {
⋮----
.dark .hover\:bg-surface:hover {
⋮----
.dark .hover\:bg-surface-container-low:hover {
⋮----
.dark .hover\:bg-surface-container:hover {
⋮----
.dark .hover\:bg-surface-container-high:hover {
⋮----
.dark .hover\:bg-surface-container-highest:hover {
⋮----
.dark .hover\:bg-surface-container-lowest:hover {
⋮----
.dark .hover\:bg-surface-bright:hover {
⋮----
.dark .hover\:bg-surface-variant:hover {
⋮----
.dark .border-outline-variant\/5 {
⋮----
.dark .border-outline-variant\/10 {
⋮----
.dark .border-outline-variant\/20 {
⋮----
.dark .border-outline-variant\/30 {
⋮----
.dark .text-on-surface-variant\/30 {
⋮----
.dark .text-on-surface-variant\/50 {
⋮----
.dark .text-on-surface-variant\/60 {
⋮----
.dark .bg-surface-container\/80 {
⋮----
.dark .hover\:bg-surface-container\/80:hover {
⋮----
.dark .hover\:bg-surface-container\/50:hover {
⋮----
.dark .hover\:bg-surface\/50:hover {
⋮----
.dark .bg-surface-container\/50 {
⋮----
.dark .bg-surface\/50 {
⋮----
.dark input, .dark select, .dark textarea {
⋮----
.dark select option {
⋮----
.dark ::placeholder {
⋮----
.dark .text-primary {
⋮----
.dark .bg-primary {
⋮----
.dark .text-on-primary {
⋮----
.dark .border-primary {
⋮----
.dark .accent-primary {
⋮----
.dark .group-focus-within\:text-primary:focus-within {
⋮----
.dark .group-hover\:text-primary:hover {
⋮----
.dark .hover\:text-primary:hover {
⋮----
.dark .focus\:ring-primary\/20:focus {
⋮----
.dark .bg-primary\/5 {
⋮----
.dark .bg-primary\/10 {
⋮----
.dark .bg-primary\/20 {
⋮----
.dark .border-primary\/10 {
⋮----
.dark .border-primary\/20 {
⋮----
.dark .shadow-primary\/20 {
⋮----
/* execCommand genera font tags con colores oscuros en dark mode */
.dark #editor font[color="#37352f"],
⋮----
/* ===== Tamaños de fuente (Mapeo de execCommand 1-7) ===== */
#editor font[size="1"] {
⋮----
#editor font[size="2"] {
⋮----
#editor font[size="3"] {
⋮----
#editor font[size="4"] {
⋮----
#editor font[size="5"] {
⋮----
#editor font[size="6"] {
⋮----
#editor font[size="7"] {
⋮----
/* ===== Resaltados: Efecto marcador (Background) ===== */
/* Soporta tanto mis clases como el estilo generado por execCommand('backColor') */
.highlight-yellow,
⋮----
.highlight-blue,
⋮----
.highlight-green,
⋮----
.highlight-red,
⋮----
.highlight-orange,
⋮----
.highlight-pink,
⋮----
.highlight-purple,
⋮----
.highlight-indigo,
⋮----
.highlight-teal,
⋮----
.highlight-cyan,
⋮----
.highlight-lime,
⋮----
.highlight-amber,
⋮----
.highlight-rose,
⋮----
.highlight-gray,
⋮----
.highlight-brown,
⋮----
.highlight-mint,
⋮----
.dark .highlight-yellow,
⋮----
.dark .highlight-blue,
⋮----
.dark .highlight-green,
⋮----
.dark .highlight-red,
⋮----
.dark .highlight-orange,
⋮----
.dark .highlight-pink,
⋮----
.dark .highlight-purple,
⋮----
.dark .highlight-indigo,
⋮----
.dark .highlight-teal,
⋮----
.dark .highlight-cyan,
⋮----
.dark .highlight-lime,
⋮----
.dark .highlight-amber,
⋮----
.dark .highlight-rose,
⋮----
.dark .highlight-gray,
⋮----
.dark .highlight-brown,
⋮----
.dark .highlight-mint,
⋮----
.dark #custom-context-menu,
⋮----
.dark #custom-context-menu .menu-item:hover,
⋮----
.dark #custom-context-menu .h-px {
⋮----
.flash-highlight {
⋮----
#sidebar.collapsed {
⋮----
#sidebar.collapsed .sidebar-text {
⋮----
#sidebar.collapsed .mb-8.px-2 {
⋮----
#sidebar.collapsed .nav-item,
⋮----
#sidebar.collapsed .nav-item i,
⋮----
#sidebar.collapsed h4 {
⋮----
#sidebar.collapsed #media-player {
⋮----
#sidebar.collapsed #media-player .bg-slate-800 {
⋮----
#sidebar.collapsed #media-player .flex.items-center.justify-between.mb-2 {
⋮----
#sidebar.collapsed .mt-auto.pt-4.border-t {
⋮----
#sidebar.collapsed .notebook-item {
#sidebar.collapsed #notebook-list {
#sidebar.collapsed #notebook-list { margin: 0; padding: 0; }
#sidebar.collapsed #notebook-list a { justify-content: center; padding: 12px 0; }
#sidebar.collapsed #notebook-list a div.shrink-0 { margin: 0 !important; }
⋮----
#sidebar.collapsed #notebook-list a.is-favorite { background-color: rgba(251, 191, 36, 0.08) !important; position: relative; box-shadow: inset 0 0 10px rgba(251, 191, 36, 0.1); }
#sidebar.collapsed #notebook-list a.is-favorite::after { content: ''; position: absolute; left: 4px; top: 50%; transform: translateY(-50%); width: 3px; height: 16px; background-color: #fbbf24; border-radius: 0 4px 4px 0; box-shadow: 0 0 8px rgba(251, 191, 36, 0.6); }
.dark #sidebar.collapsed #notebook-list a.is-favorite { background-color: rgba(251, 191, 36, 0.12) !important; box-shadow: inset 0 0 15px rgba(251, 191, 36, 0.15); }
#sidebar.collapsed .notebook-fav-icon { display: none !important; }
⋮----
/* ===== Notes Panel Collapse ===== */
#notes-panel.collapsed {
⋮----
/* ===== Responsive Sidebar Menu for Short Screens ===== */
⋮----
#sidebar:not(.collapsed) #main-nav-links,
#sidebar:not(.collapsed) #main-nav-links > * + *,
⋮----
margin-top: 0 !important; /* override space-y-1 */
⋮----
#sidebar:not(.collapsed) #main-nav-links .nav-item,
#sidebar:not(.collapsed) #main-nav-links .sidebar-text,
⋮----
/* ===== Premium Media Player Styles ===== */
.glass-player-card {
⋮----
background: rgba(245, 247, 255, 0.98) !important; /* Más opaco y con tinte azul */
⋮----
border: 1px solid rgba(99, 102, 241, 0.3) !important; /* Borde más saturado */
⋮----
.dark .glass-player-card {
⋮----
.glass-player-card:hover {
⋮----
.player-btn-secondary {
⋮----
color: #6366f1; /* Indigo 500 (más vivo que slate) */
⋮----
.dark .player-btn-secondary {
⋮----
color: #94a3b8; /* Slate 400 */
⋮----
.player-btn-secondary:hover {
⋮----
color: #4f46e5; /* Indigo 600 */
⋮----
.dark .player-btn-secondary:hover {
⋮----
.player-btn-secondary:active {
⋮----
.player-play-btn {
⋮----
.player-play-btn:hover {
⋮----
transform: scale(1.08) rotate(3deg); /* Slightly less scale and rotation to avoid clipping */
⋮----
.player-play-btn:active {
⋮----
.player-play-btn::after {
⋮----
.player-play-btn:hover::after {
````
