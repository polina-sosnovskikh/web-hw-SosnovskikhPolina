import { getDayData, saveDayData, getTodayString, formatDate, getViewDate } from './storage.js';

// ========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ========================================

// Экранирование HTML для защиты от XSS
function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag]));
}

// Формируем умный текст для бейджа в зависимости от выбранной даты
function getBadgeText(takenCount, totalCount) {
    const viewDate = getViewDate();
    const today = getTodayString();
    
    let suffix = '';
    if (viewDate === today) {
        suffix = 'сегодня';
    } else {
        // Проверяем, вчера ли это
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = formatDate(yesterday);
        
        if (viewDate === yesterdayStr) {
            suffix = 'вчера';
        } else {
            // Форматируем дату красиво: "15 мая"
            const date = new Date(viewDate);
            const day = date.getDate();
            const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 
                            'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
            const month = months[date.getMonth()];
            suffix = `за ${day} ${month}`;
        }
    }
    
    return `${takenCount}/${totalCount} ${suffix}`;
}

// ========================================
// МОДАЛЬНОЕ ОКНО (встроено в файл)
// ========================================
function showMedicationModal({ title = 'Уведомление', message = '', confirmText = 'Понятно' } = {}) {
    return new Promise((resolve) => {
        const oldOverlay = document.querySelector('.med-modal-overlay');
        if (oldOverlay) oldOverlay.remove();

        const overlay = document.createElement('div');
        overlay.className = 'med-modal-overlay';
        overlay.innerHTML = `
            <div class="med-modal">
                <button class="med-modal__close" type="button" aria-label="Закрыть">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <h3 class="med-modal__title">${escapeHTML(title)}</h3>
                ${message ? `<p class="med-modal__message">${escapeHTML(message)}</p>` : ''}
                <div class="med-modal__buttons">
                    <button class="med-modal__btn med-modal__btn--confirm" data-action="confirm">
                        ${escapeHTML(confirmText)}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        requestAnimationFrame(() => {
            overlay.classList.add('med-modal-overlay--active');
        });

        const close = () => {
            overlay.classList.remove('med-modal-overlay--active');
            setTimeout(() => {
                overlay.remove();
                document.body.style.overflow = '';
            }, 300);
            resolve(true);
        };

        const closeBtn = overlay.querySelector('.med-modal__close');
        const confirmBtn = overlay.querySelector('[data-action="confirm"]');
        closeBtn.addEventListener('click', close);
        confirmBtn.addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                close();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}

// ========================================
// ОСНОВНОЙ КОД
// ========================================
export function initMedications() {
    const list = document.getElementById('medications-list');
    if (!list) return;

    const viewDate = getViewDate();
    const dayData = getDayData(viewDate);

    if (!dayData.medications || dayData.medications.length === 0) {
        renderAddMedicationForm();
    } else {
        renderMedications();
    }
}

function renderAddMedicationForm() {
    const list = document.getElementById('medications-list');
    const badge = document.getElementById('medications-badge');
    if (!list) return;

    // Умный текст бейджа даже для пустого состояния
    if (badge) badge.textContent = getBadgeText(0, 0);

    list.innerHTML = `
        <div class="medication-add-form">
            <input type="time" class="medication-add-form__time" id="new-med-time" value="09:00">
            <input type="text" class="medication-add-form__name" id="new-med-name" placeholder="Название лекарства">
            <input type="text" class="medication-add-form__dose" id="new-med-dose" placeholder="Дозировка">
            <button class="medication-add-form__btn" id="add-med-btn" type="button">Добавить</button>
        </div>
    `;
    document.getElementById('add-med-btn').addEventListener('click', addMedication);
}

async function addMedication() {
    const timeInput = document.getElementById('new-med-time');
    const nameInput = document.getElementById('new-med-name');
    const doseInput = document.getElementById('new-med-dose');

    if (!timeInput.value || !nameInput.value || !doseInput.value) {
        await showMedicationModal({
            title: 'Не все поля заполнены',
            message: 'Пожалуйста, заполните время, название и дозировку лекарства',
            confirmText: 'Понятно'
        });
        return;
    }

    const viewDate = getViewDate();
    let dayData = getDayData(viewDate);
    if (!dayData.medications) dayData.medications = [];

    dayData.medications.push({
        id: 'med-' + Date.now(),
        time: timeInput.value,
        name: nameInput.value,
        dose: doseInput.value,
        taken: false,
    });

    saveDayData(viewDate, { medications: dayData.medications });
    renderMedications();
}

export function renderMedications() {
    const list = document.getElementById('medications-list');
    const badge = document.getElementById('medications-badge');
    if (!list) return;

    const viewDate = getViewDate();
    const dayData = getDayData(viewDate);
    const medications = dayData.medications || [];

    if (medications.length === 0) {
        renderAddMedicationForm();
        return;
    }

    const takenCount = medications.filter((m) => m.taken).length;
    
    // Умный текст бейджа
    if (badge) {
        badge.textContent = getBadgeText(takenCount, medications.length);
    }

    // ИСПРАВЛЕНО: все пользовательские данные экранируются через escapeHTML
    list.innerHTML = medications
        .map(
            (med) => `
                <div class="medication-item" data-med-id="${escapeHTML(med.id)}">
                    <div class="medication-item__check">
                        <input type="checkbox" class="medication-item__input" id="med-${escapeHTML(med.id)}" ${med.taken ? 'checked' : ''}>
                        <label class="medication-item__checkbox" for="med-${escapeHTML(med.id)}"></label>
                    </div>
                    <div class="medication-item__content">
                        <div class="medication-item__time">${escapeHTML(med.time)} — ${escapeHTML(med.name)}</div>
                        <div class="medication-item__desc">${escapeHTML(med.dose)} • ${med.taken ? 'Принято' : 'Ожидает'}</div>
                    </div>
                    <button class="medication-item__more" data-remove-med="${escapeHTML(med.id)}" type="button" aria-label="Удалить">×</button>
                </div>
            `
        )
        .join('');

    // Кнопка "Добавить ещё"
    list.innerHTML += `
        <button class="medication-add-more-btn" id="add-more-med-btn" type="button">
            + Добавить ещё лекарство
        </button>
    `;

    // Обработчики чекбоксов
    list.querySelectorAll('.medication-item__input').forEach((checkbox) => {
        checkbox.addEventListener('change', (e) => {
            const medId = e.target.closest('.medication-item').dataset.medId;
            toggleMedication(medId, e.target.checked);
        });
    });

    // Обработчики удаления
    list.querySelectorAll('[data-remove-med]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const medId = btn.dataset.removeMed;
            removeMedication(medId);
        });
    });

    // Обработчик кнопки "Добавить ещё"
    document.getElementById('add-more-med-btn').addEventListener('click', showAddMedicationForm);
}

function showAddMedicationForm() {
    const list = document.getElementById('medications-list');
    if (!list) return;

    const formHTML = `
        <div class="medication-add-form" id="inline-add-form">
            <input type="time" class="medication-add-form__time" id="new-med-time" value="09:00">
            <input type="text" class="medication-add-form__name" id="new-med-name" placeholder="Название лекарства">
            <input type="text" class="medication-add-form__dose" id="new-med-dose" placeholder="Дозировка">
            <div class="medication-add-form__actions">
                <button class="medication-add-form__btn" id="add-med-btn" type="button">Добавить</button>
                <button class="medication-add-form__cancel" id="cancel-add-btn" type="button">Отмена</button>
            </div>
        </div>
    `;
    list.insertAdjacentHTML('beforeend', formHTML);

    document.getElementById('add-med-btn').addEventListener('click', addMedication);
    document.getElementById('cancel-add-btn').addEventListener('click', () => {
        document.getElementById('inline-add-form').remove();
    });
}

function toggleMedication(medId, isTaken) {
    const viewDate = getViewDate();
    const dayData = getDayData(viewDate);
    const med = dayData.medications.find((m) => m.id === medId);

    if (med) {
        med.taken = isTaken;
        saveDayData(viewDate, { medications: dayData.medications });
        renderMedications();
    }
}

function removeMedication(medId) {
    const viewDate = getViewDate();
    const dayData = getDayData(viewDate);
    dayData.medications = (dayData.medications || []).filter((m) => m.id !== medId);
    saveDayData(viewDate, { medications: dayData.medications });

    if (dayData.medications.length === 0) {
        renderAddMedicationForm();
    } else {
        renderMedications();
    }
}