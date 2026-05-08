import { state, saveAll } from './state.js';
import { refreshIcons } from './utils.js';

let currentDate = new Date();
let selectedDate = new Date();
let scheduleMode = 'lv'; // 'lv' (Lun-Vie) or 'ls' (Lun-Sab)
let editingEventId = null;
let editingScheduleId = null;

const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function initCalendar() {
    renderCalendar();
    selectDay(new Date());
    setScheduleMode('lv'); // Default
}

export function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    document.getElementById('calendar-month-year').textContent = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Adjust firstDay so Monday is 0 instead of Sunday being 0
    let startDay = firstDay === 0 ? 6 : firstDay - 1;
    
    const grid = document.getElementById('calendar-grid-content');
    if (!grid) return;
    grid.innerHTML = '';
    
    const today = new Date();
    
    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        const d = prevMonthDays - i;
        const cell = createDayCell(new Date(year, month - 1, d), true);
        grid.appendChild(cell);
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        const isToday = d.toDateString() === today.toDateString();
        const isSelected = d.toDateString() === selectedDate.toDateString();
        const cell = createDayCell(d, false, isToday, isSelected);
        grid.appendChild(cell);
    }
    
    // Next month padding to complete the grid (usually 6 rows = 42 cells)
    const totalCells = startDay + daysInMonth;
    const remainingCells = 42 - totalCells;
    for (let i = 1; i <= remainingCells; i++) {
        const d = new Date(year, month + 1, i);
        const cell = createDayCell(d, true);
        grid.appendChild(cell);
    }
    
    refreshIcons();
}

function createDayCell(date, isPadding, isToday = false, isSelected = false) {
    const cell = document.createElement('div');
    const dateStr = date.toISOString().split('T')[0];
    
    cell.className = `min-h-[100px] p-2 bg-surface-container-low border border-transparent transition-colors cursor-pointer group hover:bg-surface-container flex flex-col gap-1 ${isPadding ? 'opacity-40' : ''}`;
    
    if (isSelected) {
        cell.classList.add('bg-primary/5', 'border-primary/30');
    }
    
    cell.onclick = () => selectDay(date);
    
    const dayNum = date.getDate();
    const dayHeader = document.createElement('div');
    dayHeader.className = 'flex items-center justify-between';
    
    let daySpanClass = 'w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold';
    if (isToday) {
        daySpanClass += ' bg-primary text-on-primary shadow-md';
    } else if (isSelected) {
        daySpanClass += ' text-primary';
    } else {
        daySpanClass += ' text-on-surface-variant';
    }
    
    dayHeader.innerHTML = `<span class="${daySpanClass}">${dayNum}</span>`;
    cell.appendChild(dayHeader);
    
    // Add events indicators
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'flex-1 overflow-y-auto custom-scrollbar space-y-1 mt-1';
    
    const dayEvents = (state.calendar.events || []).filter(e => e.date === dateStr);
    dayEvents.forEach(e => {
        const evt = document.createElement('div');
        evt.className = 'text-[10px] font-bold px-1.5 py-0.5 rounded truncate bg-opacity-20 border border-opacity-30';
        evt.style.backgroundColor = `${e.color}33`;
        evt.style.borderColor = `${e.color}66`;
        evt.style.color = e.color;
        evt.textContent = e.title;
        eventsContainer.appendChild(evt);
    });

    // Add recurring schedule classes
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // Adjust Sunday if needed, though our schedule is 1-6
    const scheduleItems = (state.calendar.schedule || []).filter(s => s.day === dayOfWeek);
    scheduleItems.forEach(s => {
        const classEvt = document.createElement('div');
        classEvt.className = 'text-[9px] font-semibold px-1.5 py-0.5 rounded truncate border border-transparent flex items-center gap-1';
        classEvt.style.backgroundColor = 'var(--surface-container-high)';
        classEvt.style.color = 'var(--on-surface-variant)';
        classEvt.innerHTML = `<span class="w-1.5 h-1.5 rounded-full shrink-0" style="background-color: ${s.color}"></span> ${s.start} ${s.subject}`;
        eventsContainer.appendChild(classEvt);
    });
    
    cell.appendChild(eventsContainer);
    return cell;
}

export function navigateMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    renderCalendar();
}

export function goToToday() {
    currentDate = new Date();
    selectDay(currentDate);
}

export function selectDay(date) {
    selectedDate = new Date(date);
    
    // If selecting a day outside current month view, navigate there
    if (selectedDate.getMonth() !== currentDate.getMonth() || selectedDate.getFullYear() !== currentDate.getFullYear()) {
        currentDate = new Date(selectedDate);
    }
    
    renderCalendar();
    renderDayDetails(selectedDate);
}

export function renderDayDetails(date) {
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday...
    
    document.getElementById('selected-day-title').textContent = `${dayNames[dayOfWeek]}, ${date.getDate()} de ${monthNames[date.getMonth()]}`;
    
    const eventsList = document.getElementById('selected-day-events');
    eventsList.innerHTML = '';
    
    const dayEvents = (state.calendar.events || []).filter(e => e.date === dateStr);
    
    if (dayEvents.length === 0) {
        eventsList.innerHTML = '<div class="text-sm text-on-surface-variant opacity-60 text-center py-4 bg-surface-container-high rounded-xl border border-outline-variant/10">No hay eventos para este día</div>';
    } else {
        dayEvents.forEach(e => {
            const evt = document.createElement('div');
            evt.className = 'p-3 rounded-xl border border-outline-variant/10 bg-surface-container-high group relative overflow-hidden';
            evt.innerHTML = `
                <div class="absolute left-0 top-0 bottom-0 w-1.5" style="background-color: ${e.color}"></div>
                <div class="pl-3 flex justify-between items-center gap-2">
                    <div>
                        <h5 class="font-bold text-sm text-on-surface">${e.title}</h5>
                        ${e.description ? `<p class="text-xs text-on-surface-variant mt-1">${e.description}</p>` : ''}
                    </div>
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        <button onclick="window.calendarEngine.showEventModal('${e.id}')" class="text-on-surface-variant hover:text-primary transition-all p-1 active:scale-95"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                        <button onclick="window.calendarEngine.deleteEvent('${e.id}')" class="text-on-surface-variant hover:text-error transition-all p-1 active:scale-95"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </div>
            `;
            eventsList.appendChild(evt);
        });
    }
    refreshIcons();
}

export function showEventModal(id = null) {
    editingEventId = id;
    const modalTitle = document.querySelector('#event-modal-overlay h4');
    
    if (id) {
        const event = state.calendar.events.find(e => e.id === id);
        if (event) {
            document.getElementById('event-title').value = event.title;
            document.getElementById('event-desc').value = event.description || '';
            document.getElementById('event-color').value = event.color || '#4338ca';
            if (modalTitle) modalTitle.textContent = 'Editar Evento';
        }
    } else {
        document.getElementById('event-title').value = '';
        document.getElementById('event-desc').value = '';
        document.getElementById('event-color').value = '#4338ca';
        if (modalTitle) modalTitle.textContent = 'Añadir Evento';
    }
    
    document.getElementById('event-modal-overlay').classList.remove('hidden');
}

export async function saveEvent() {
    const title = document.getElementById('event-title').value.trim();
    const desc = document.getElementById('event-desc').value.trim();
    const color = document.getElementById('event-color').value;
    
    if (!title) return; // Add simple validation if needed
    
    if (editingEventId) {
        const index = state.calendar.events.findIndex(e => e.id === editingEventId);
        if (index !== -1) {
            state.calendar.events[index] = {
                ...state.calendar.events[index],
                title,
                description: desc,
                color
            };
        }
    } else {
        const newEvent = {
            id: Date.now().toString(),
            date: selectedDate.toISOString().split('T')[0],
            title,
            description: desc,
            color
        };
        if (!state.calendar.events) state.calendar.events = [];
        state.calendar.events.push(newEvent);
    }
    
    await saveAll();
    
    document.getElementById('event-modal-overlay').classList.add('hidden');
    renderCalendar();
    renderDayDetails(selectedDate);
}

export async function deleteEvent(id) {
    state.calendar.events = state.calendar.events.filter(e => e.id !== id);
    await saveAll();
    renderCalendar();
    renderDayDetails(selectedDate);
}

export function showScheduleModal() {
    editingScheduleId = null;
    document.getElementById('schedule-subject').value = '';
    document.getElementById('schedule-start').value = '';
    document.getElementById('schedule-end').value = '';
    document.getElementById('schedule-color').value = '#10b981';
    document.getElementById('schedule-day').value = '1';
    
    const addBtn = document.querySelector('#schedule-modal-overlay button[onclick*="addScheduleItem"]');
    if (addBtn) addBtn.innerHTML = '<i data-lucide="plus" class="w-4 h-4"></i> Añadir al Horario';

    renderScheduleModalList();
    document.getElementById('schedule-modal-overlay').classList.remove('hidden');
}

export function setScheduleMode(mode) {
    scheduleMode = mode;
    document.getElementById('tab-schedule-l-v').className = mode === 'lv' ? 'flex-1 py-1.5 text-xs font-bold rounded-lg text-on-surface bg-surface-container-lowest shadow-sm transition-all' : 'flex-1 py-1.5 text-xs font-bold rounded-lg text-on-surface-variant hover:text-on-surface transition-all';
    document.getElementById('tab-schedule-s').className = mode === 's' ? 'flex-1 py-1.5 text-xs font-bold rounded-lg text-on-surface bg-surface-container-lowest shadow-sm transition-all' : 'flex-1 py-1.5 text-xs font-bold rounded-lg text-on-surface-variant hover:text-on-surface transition-all';
    
    renderScheduleList();
}

export async function addScheduleItem() {
    const subject = document.getElementById('schedule-subject').value.trim();
    const start = document.getElementById('schedule-start').value;
    const end = document.getElementById('schedule-end').value;
    const color = document.getElementById('schedule-color').value;
    const day = parseInt(document.getElementById('schedule-day').value);
    
    if (!subject || !start || !end) return;
    
    if (editingScheduleId) {
        const index = state.calendar.schedule.findIndex(s => s.id === editingScheduleId);
        if (index !== -1) {
            state.calendar.schedule[index] = {
                ...state.calendar.schedule[index],
                day,
                start,
                end,
                subject,
                color
            };
        }
    } else {
        const newItem = {
            id: Date.now().toString(),
            day,
            start,
            end,
            subject,
            color
        };
        if (!state.calendar.schedule) state.calendar.schedule = [];
        state.calendar.schedule.push(newItem);
    }
    
    // Sort by start time
    state.calendar.schedule.sort((a, b) => a.start.localeCompare(b.start));
    
    await saveAll();
    
    renderScheduleModalList();
    renderScheduleList();
    renderCalendar();
    renderDayDetails(selectedDate);
    
    editingScheduleId = null;
    const addBtn = document.querySelector('#schedule-modal-overlay button[onclick*="addScheduleItem"]');
    if (addBtn) addBtn.innerHTML = '<i data-lucide="plus" class="w-4 h-4"></i> Añadir al Horario';

    // Reset inputs
    document.getElementById('schedule-subject').value = '';
    document.getElementById('schedule-start').value = '';
    document.getElementById('schedule-end').value = '';
}

export function editScheduleItem(id) {
    editingScheduleId = id;
    const item = state.calendar.schedule.find(s => s.id === id);
    if (!item) return;

    document.getElementById('schedule-subject').value = item.subject;
    document.getElementById('schedule-start').value = item.start;
    document.getElementById('schedule-end').value = item.end;
    document.getElementById('schedule-color').value = item.color;
    document.getElementById('schedule-day').value = item.day.toString();

    const addBtn = document.querySelector('#schedule-modal-overlay button[onclick*="addScheduleItem"]');
    if (addBtn) addBtn.innerHTML = '<i data-lucide="save" class="w-4 h-4"></i> Guardar Cambios';

    document.querySelector('#schedule-modal-overlay .space-y-4').scrollTop = 0;
}

export async function deleteScheduleItem(id) {
    state.calendar.schedule = state.calendar.schedule.filter(s => s.id !== id);
    await saveAll();
    renderScheduleModalList();
    renderScheduleList();
    renderCalendar();
    renderDayDetails(selectedDate);
}

export function renderScheduleList() {
    const list = document.getElementById('schedule-list');
    if (!list) return;
    list.innerHTML = '';
    
    const startDay = scheduleMode === 'lv' ? 1 : 6;
    const endDay = scheduleMode === 'lv' ? 5 : 6;
    let hasItems = false;
    
    for (let day = startDay; day <= endDay; day++) {
        const dayItems = (state.calendar.schedule || []).filter(s => s.day === day);
        if (dayItems.length === 0) continue;
        
        hasItems = true;
        
        const dayHeader = document.createElement('div');
        dayHeader.className = 'text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 mt-4 mb-2 -ml-3';
        dayHeader.textContent = dayNames[day];
        list.appendChild(dayHeader);
        
        dayItems.forEach(item => {
            const el = document.createElement('div');
            el.className = 'relative mb-3';
            el.innerHTML = `
                <div class="absolute -left-4 top-1.5 w-2 h-2 rounded-full border-2 border-surface-container-lowest" style="background-color: ${item.color}"></div>
                <div class="bg-surface-container-high rounded-lg p-2.5 border border-outline-variant/10 shadow-sm">
                    <div class="flex items-center gap-2 mb-1">
                        <i data-lucide="clock" class="w-3 h-3 text-on-surface-variant opacity-60"></i>
                        <span class="text-[11px] font-bold text-on-surface-variant">${item.start} - ${item.end}</span>
                    </div>
                    <div class="text-sm font-bold text-on-surface leading-tight">${item.subject}</div>
                </div>
            `;
            list.appendChild(el);
        });
    }
    
    if (!hasItems) {
        list.innerHTML = `
            <div class="text-center py-6 bg-surface-container-high rounded-xl border border-outline-variant/10 -ml-3">
                <i data-lucide="calendar-plus" class="w-8 h-8 mx-auto text-on-surface-variant opacity-40 mb-3"></i>
                <p class="text-xs text-on-surface-variant opacity-80 mb-4 px-4">Tu horario escolar está vacío. Configúralo para ver tus clases aquí.</p>
                <button onclick="window.calendarEngine.showScheduleModal()" class="px-4 py-2 text-xs font-bold bg-primary text-on-primary rounded-lg shadow-sm hover:bg-indigo-700 transition-colors active:scale-95">Configurar mi horario escolar</button>
            </div>
        `;
    }
    
    refreshIcons();
}

function renderScheduleModalList() {
    const list = document.getElementById('schedule-modal-list');
    list.innerHTML = '';
    
    if (!state.calendar.schedule || state.calendar.schedule.length === 0) {
        list.innerHTML = '<div class="text-xs text-on-surface-variant opacity-60 text-center py-4 bg-surface-container rounded-lg border border-outline-variant/10">Aún no hay clases.<br>Rellena tu horario escolar manualmente arriba.</div>';
        return;
    }
    
    for (let day = 1; day <= 6; day++) {
        const dayItems = state.calendar.schedule.filter(s => s.day === day);
        if (dayItems.length === 0) continue;
        
        const group = document.createElement('div');
        group.className = 'mb-3';
        group.innerHTML = `<div class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 mb-1">${dayNames[day]}</div>`;
        
        dayItems.forEach(item => {
            const el = document.createElement('div');
            el.className = 'flex items-center justify-between bg-surface-container p-2 rounded-lg mb-1 border border-outline-variant/10';
            el.innerHTML = `
                <div class="flex items-center gap-3 overflow-hidden">
                    <div class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${item.color}"></div>
                    <div class="truncate">
                        <div class="text-xs font-bold text-on-surface truncate">${item.subject}</div>
                        <div class="text-[10px] font-bold text-on-surface-variant opacity-70">${item.start} - ${item.end}</div>
                    </div>
                </div>
                <div class="flex items-center gap-1">
                    <button onclick="window.calendarEngine.editScheduleItem('${item.id}')" class="text-on-surface-variant hover:text-primary p-1.5 transition-colors active:scale-95"><i data-lucide="edit-3" class="w-3.5 h-3.5"></i></button>
                    <button onclick="window.calendarEngine.deleteScheduleItem('${item.id}')" class="text-on-surface-variant hover:text-error p-1.5 transition-colors active:scale-95"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                </div>
            `;
            group.appendChild(el);
        });
        
        list.appendChild(group);
    }
    
    refreshIcons();
}
