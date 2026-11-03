import { getTodayString, formatDate, getDayData, setViewDate } from './storage.js';
import { renderSymptomsAccordion, renderTodaySymptoms } from './symptoms.js';
import { renderMedications } from './medications.js';
import { initRating } from './rating.js'; 

let currentWeekDate = new Date();
let selectedDate = getTodayString();

const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
const weekdayNames = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

export function initCalendar() {
    const prevBtn = document.querySelector('.calendar-main__nav--prev');
    const nextBtn = document.querySelector('.calendar-main__nav--next');
    const titleEl = document.querySelector('.calendar-main__title');

    if (!prevBtn || !nextBtn || !titleEl) return;

    currentWeekDate = new Date();
    renderCalendar();

    prevBtn.addEventListener('click', () => {
        currentWeekDate.setDate(currentWeekDate.getDate() - 7);
        renderCalendar();
    });

    nextBtn.addEventListener('click', () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(currentWeekDate);
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(0, 0, 0, 0);

        if (nextWeek > today) return;

        currentWeekDate.setDate(currentWeekDate.getDate() + 7);
        renderCalendar();
    });
}

function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function getWeekTitle(monday) {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const startMonth = monday.getMonth();
    const startYear = monday.getFullYear();
    const endMonth = sunday.getMonth();
    const endYear = sunday.getFullYear();

    if (startMonth === endMonth && startYear === endYear) {
        return `${monthNames[startMonth]} ${startYear}`;
    }
    if (startYear === endYear) {
        return `${monthNames[startMonth]} — ${monthNames[endMonth]} ${startYear}`;
    }
    return `${monthNames[startMonth]} ${startYear} — ${monthNames[endMonth]} ${endYear}`;
}

export function renderCalendar() {
    const grid = document.querySelector('.calendar-main__grid');
    const titleEl = document.querySelector('.calendar-main__title');

    if (!grid || !titleEl) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = getTodayString();

    const monday = getMonday(currentWeekDate);
    titleEl.textContent = getWeekTitle(monday);

    let html = weekdayNames.map((d) => `<span class="calendar-main__weekday">${d}</span>`).join('');

    for (let i = 0; i < 7; i++) {
        const date = new Date(monday.getTime());
        date.setDate(monday.getDate() + i);

        const dateStr = formatDate(date);
        const isToday = dateStr === todayStr;
        const isFuture = date > today;
        const isSelected = dateStr === selectedDate;
        const dayOfMonth = date.getDate();

        let classes = 'calendar-main__day';

        if (isToday) {
            classes += isSelected ? ' calendar-main__day--today' : ' calendar-main__day--today-dim';
        } else if (isFuture) {
            classes += isSelected ? ' calendar-main__day--future-selected' : ' calendar-main__day--future';
        } else {
            if (isSelected) classes += ' calendar-main__day--selected';
        }

        html += `
            <button class="${classes}" data-date="${dateStr}">
                ${dayOfMonth}
            </button>
        `;
    }

    grid.innerHTML = html;

    grid.querySelectorAll('.calendar-main__day').forEach((btn) => {
        btn.addEventListener('click', () => {
            selectedDate = btn.dataset.date;
            setViewDate(selectedDate); // Сохраняем дату в глобальное состояние
            
            renderCalendar(); // Перерисовываем календарь
            
            // Обновляем все зависимые блоки
            renderSymptomsAccordion();
            renderTodaySymptoms();
            renderMedications();
            initRating(); 
        });
    });
}