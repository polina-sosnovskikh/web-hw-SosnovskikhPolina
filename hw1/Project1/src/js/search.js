import { symptomsData } from './data.js';
import { getAllData, setViewDate, formatDate } from './storage.js';
import { renderSymptomsAccordion, renderTodaySymptoms } from './symptoms.js';
import { renderMedications } from './medications.js';
import { initRating } from './rating.js';

// Локальная функция для красивого отображения даты
function formatDateHuman(dateStr) {
    const months = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    const weekdays = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
    const d = new Date(dateStr);
    return `${weekdays[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

export function initSearch() {
    const searchBtn = document.querySelector('.page-title__btn[aria-label="Поиск"]');
    if (!searchBtn) return;
    searchBtn.addEventListener('click', openSearchModal);
}

function openSearchModal() {
    // Удаляем старую модалку, если вдруг есть
    const old = document.querySelector('.search-modal-overlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.className = 'search-modal-overlay';
    overlay.innerHTML = `
        <div class="search-modal">
            <button class="search-modal__close" type="button" aria-label="Закрыть">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <h3 class="search-modal__title">Поиск</h3>

            <div class="search-modal__tabs">
                <button class="search-tab search-tab--active" data-type="symptom" type="button">Симптомы</button>
                <button class="search-tab" data-type="medication" type="button">Лекарства</button>
            </div>

            <input 
                type="text" 
                class="search-modal__input" 
                id="search-input"
                placeholder="Начните вводить название..."
                autocomplete="off"
            >

            <div class="search-modal__results" id="search-results">
                <p class="search-modal__empty">Введите запрос для поиска</p>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => overlay.classList.add('search-modal-overlay--active'));

    const input = overlay.querySelector('#search-input');
    const results = overlay.querySelector('#search-results');
    const tabs = overlay.querySelectorAll('.search-tab');
    let currentType = 'symptom';

    setTimeout(() => input.focus(), 100);

    // Переключение табов
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            tabs.forEach((t) => t.classList.remove('search-tab--active'));
            tab.classList.add('search-tab--active');
            currentType = tab.dataset.type;
            input.placeholder = currentType === 'symptom'
                ? 'Например: головная боль, зуд...'
                : 'Например: парацетамол, зиртек...';
            // Перезапускаем поиск с новым типом
            performSearch(input.value.trim(), currentType, results);
            input.focus();
        });
    });

    // Живой поиск
    input.addEventListener('input', () => {
        performSearch(input.value.trim(), currentType, results);
    });

    // Закрытие
    const close = () => {
        overlay.classList.remove('search-modal-overlay--active');
        setTimeout(() => {
            overlay.remove();
            document.body.style.overflow = '';
        }, 300);
    };
    overlay.querySelector('.search-modal__close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            close();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

function performSearch(query, type, resultsContainer) {
    if (!query) {
        resultsContainer.innerHTML = '<p class="search-modal__empty">Введите запрос для поиска</p>';
        return;
    }

    const allData = getAllData();
    const results = [];
    const queryLower = query.toLowerCase();

    if (type === 'symptom') {
        // 1. Находим подходящие симптомы в справочнике
        const matchedSymptoms = [];
        symptomsData.forEach((category) => {
            category.items.forEach((item) => {
                if (item.name.toLowerCase().includes(queryLower)) {
                    matchedSymptoms.push({ id: item.id, name: item.name, category: category.category });
                }
            });
        });

        if (matchedSymptoms.length === 0) {
            resultsContainer.innerHTML = '<p class="search-modal__empty">Ничего не найдено</p>';
            return;
        }

        // 2. Ищем дни, когда эти симптомы были отмечены
        matchedSymptoms.forEach((symptom) => {
            Object.entries(allData).forEach(([dateStr, dayData]) => {
                const symptoms = dayData.symptoms || [];
                if (symptoms.includes(symptom.id)) {
                    results.push({
                        date: dateStr,
                        title: symptom.name,
                        subtitle: `Категория: ${symptom.category}`,
                        type: 'symptom',
                    });
                }
            });
        });
    } else {
        // Поиск по лекарствам
        Object.entries(allData).forEach(([dateStr, dayData]) => {
            const medications = dayData.medications || [];
            medications.forEach((med) => {
                if (med.name.toLowerCase().includes(queryLower)) {
                    results.push({
                        date: dateStr,
                        title: `${med.name} — ${med.dose}`,
                        subtitle: `Время приёма: ${med.time}`,
                        type: 'medication',
                    });
                }
            });
        });
    }

    renderResults(results, resultsContainer);
}

function renderResults(results, container) {
    if (results.length === 0) {
        container.innerHTML = '<p class="search-modal__empty">Ничего не найдено</p>';
        return;
    }

    // Сортируем по дате (свежие сверху)
    results.sort((a, b) => b.date.localeCompare(a.date));

    container.innerHTML = results
        .map((r, i) => `
            <div class="search-result" data-index="${i}" data-date="${r.date}">
                <div class="search-result__icon">${r.type === 'symptom' ? '🤒' : '💊'}</div>
                <div class="search-result__info">
                    <div class="search-result__title">${r.title}</div>
                    <div class="search-result__subtitle">${formatDateHuman(r.date)} • ${r.subtitle}</div>
                </div>
            </div>
        `)
        .join('');

    // Клик по результату — переходим на этот день
    container.querySelectorAll('.search-result').forEach((el) => {
        el.addEventListener('click', () => {
            const date = el.dataset.date;
            goToDate(date);
            // Закрываем модалку
            el.closest('.search-modal-overlay').querySelector('.search-modal__close').click();
        });
    });
}

// Переход на выбранную дату: обновляем глобальное состояние и все блоки
function goToDate(dateStr) {
    setViewDate(dateStr);

    // Пытаемся кликнуть по кнопке дня в календаре (если она видна)
    const dayBtn = document.querySelector(`.calendar-main__day[data-date="${dateStr}"]`);
    if (dayBtn) {
        dayBtn.click();
    } else {
        // Если день на другой неделе — просто обновляем блоки вручную
        renderSymptomsAccordion();
        renderTodaySymptoms();
        renderMedications();
        initRating();
    }
}