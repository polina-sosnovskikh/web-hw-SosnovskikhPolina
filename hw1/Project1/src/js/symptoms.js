import { symptomsData, symptomIcons } from './data.js';
import { getDayData, saveDayData, getViewDate } from './storage.js';

let currentExpandedCategory = null;

// Рендер аккордеона симптомов
export function renderSymptomsAccordion() {
    const container = document.getElementById('symptoms-accordion');
    if (!container) return;

    const viewDate = getViewDate(); // Читаем просматриваемую дату
    const dayData = getDayData(viewDate);
    const selectedSymptoms = dayData.symptoms || []; 

    container.innerHTML = symptomsData
        .map((category) => {
            const isExpanded = currentExpandedCategory === category.category;
            return `
                <div class="symptom-category" data-category="${category.category}">
                    <button class="symptom-category__header ${isExpanded ? 'symptom-category__header--active' : ''}" type="button">
                        <span class="symptom-category__arrow">${isExpanded ? '▼' : '▶'}</span>
                        <span class="symptom-category__name">${category.category}</span>
                    </button>
                    ${
                        isExpanded
                            ? `<div class="symptom-category__items">
                                ${category.items
                                    .map(
                                        (item) => `
                                    <label class="symptom-item">
                                        <input 
                                            type="checkbox" 
                                            class="symptom-item__checkbox" 
                                            data-id="${item.id}" 
                                            data-name="${item.name}" 
                                            data-category="${category.category}"
                                            ${selectedSymptoms.includes(item.id) ? 'checked' : ''}
                                        >
                                        <span class="symptom-item__name">${item.name}</span>
                                    </label>
                                `
                                    )
                                    .join('')}
                            </div>`
                            : ''
                    }
                </div>
            `;
        })
        .join('');

    // Навешиваем обработчики после рендера
    attachAccordionHandlers();
    attachCheckboxHandlers();
}

function attachAccordionHandlers() {
    const headers = document.querySelectorAll('.symptom-category__header');
    headers.forEach((header) => {
        header.addEventListener('click', (e) => {
            e.preventDefault();
            const category = header.closest('.symptom-category').dataset.category;
            currentExpandedCategory = currentExpandedCategory === category ? null : category;
            renderSymptomsAccordion();
        });
    });
}

function attachCheckboxHandlers() {
    const checkboxes = document.querySelectorAll('.symptom-item__checkbox');
    checkboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', (e) => {
            const symptomId = e.target.dataset.id;
            const viewDate = getViewDate(); // Используем просматриваемую дату
            const dayData = getDayData(viewDate);
            const symptoms = dayData.symptoms || [];

            if (e.target.checked) {
                if (!symptoms.includes(symptomId)) {
                    symptoms.push(symptomId);
                }
            } else {
                const filtered = symptoms.filter((id) => id !== symptomId);
                dayData.symptoms = filtered;
            }
            
            if (e.target.checked && !dayData.symptoms.includes(symptomId)) {
                dayData.symptoms = symptoms;
            }
            
            saveDayData(viewDate, { symptoms: dayData.symptoms }); // Сохраняем за нужную дату
            renderTodaySymptoms();
        });
    });
}

// Рендер блока "Симптомы сегодня"
export function renderTodaySymptoms() {
    const container = document.getElementById('today-symptoms-list');
    if (!container) return;

    const viewDate = getViewDate(); // Используем просматриваемую дату
    const dayData = getDayData(viewDate);
    const symptoms = dayData.symptoms || []; 

    if (symptoms.length === 0) {
        container.innerHTML = '<p class="today-symptoms-empty">Симптомы не отмечены</p>';
        return;
    }

    container.innerHTML = symptoms
        .map((symptomId) => {
            const symptomInfo = findSymptomById(symptomId);
            if (!symptomInfo) return '';
            const colorClass = getColorClass(symptomInfo.category);
            const icon = symptomIcons[symptomId] || '•';
            return `
                <div class="symptom-card-main" data-symptom-id="${symptomId}">
                    <div class="symptom-card-main__icon ${colorClass}">
                        <span>${icon}</span>
                    </div>
                    <span class="symptom-card-main__category">${symptomInfo.category}</span>
                    <span class="symptom-card-main__text">${symptomInfo.name}</span>
                    <button class="symptom-card-main__more" data-remove="${symptomId}" type="button" aria-label="Удалить">×</button>
                </div>
            `;
        })
        .join('');

    // Обработчики удаления
    document.querySelectorAll('[data-remove]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const symptomId = btn.dataset.remove;
            removeSymptom(symptomId);
        });
    });
}

function removeSymptom(symptomId) {
    const viewDate = getViewDate(); // Используем просматриваемую дату
    const dayData = getDayData(viewDate);
    dayData.symptoms = (dayData.symptoms || []).filter((id) => id !== symptomId);
    saveDayData(viewDate, { symptoms: dayData.symptoms });

    // Снимаем галочку в аккордеоне
    const checkbox = document.querySelector(`.symptom-item__checkbox[data-id="${symptomId}"]`);
    if (checkbox) checkbox.checked = false;
    
    renderTodaySymptoms();
}

function findSymptomById(id) {
    for (const category of symptomsData) {
        const item = category.items.find((i) => i.id === id);
        if (item) return { ...item, category: category.category };
    }
    return null;
}

function getColorClass(category) {
    const map = {
        'Голова': 'symptom-card-main__icon--runny',
        'Глаза': 'symptom-card-main__icon--eyes',
        'Нос': 'symptom-card-main__icon--cough',
        'Горло': 'symptom-card-main__icon--runny',
        'Легкие': 'symptom-card-main__icon--runny',
        'Кожа': 'symptom-card-main__icon--eyes',
    };
    return map[category] || 'symptom-card-main__icon--runny';
}

// Кнопка "Изменить" — раскрывает аккордеон
export function attachEditSymptomsButton() {
    const btn = document.getElementById('edit-symptoms-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        currentExpandedCategory = currentExpandedCategory ? null : symptomsData[0].category;
        renderSymptomsAccordion();
        // Прокручиваем к аккордеону
        document.getElementById('symptoms-accordion')?.scrollIntoView({ behavior: 'smooth' });
    });
}