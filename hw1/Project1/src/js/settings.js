// ========================================
// УНИВЕРСАЛЬНАЯ СИСТЕМА МОДАЛЬНЫХ ОКОН
// ========================================
function showModal({ type = 'alert', title = '', message = '', placeholder = '', defaultValue = '', confirmText = 'Понятно', cancelText = 'Отмена' } = {}) {
    return new Promise((resolve) => {
        const oldOverlay = document.querySelector('.settings-modal-overlay');
        if (oldOverlay) oldOverlay.remove();

        const overlay = document.createElement('div');
        overlay.className = 'settings-modal-overlay';
        let inputHTML = '';
        if (type === 'prompt') {
            inputHTML = `<input type="text" class="settings-modal__input" placeholder="${escapeHTML(placeholder)}" value="${escapeHTML(defaultValue)}" autocomplete="off">`;
        }
        let buttonsHTML = '';
        if (type === 'alert') {
            buttonsHTML = `<button class="settings-modal__btn settings-modal__btn--confirm" data-action="confirm">${escapeHTML(confirmText)}</button>`;
        } else {
            buttonsHTML = `
                <button class="settings-modal__btn settings-modal__btn--cancel" data-action="cancel">${escapeHTML(cancelText)}</button>
                <button class="settings-modal__btn settings-modal__btn--confirm" data-action="confirm">${escapeHTML(confirmText)}</button>
            `;
        }
        overlay.innerHTML = `
            <div class="settings-modal">
                <button class="settings-modal__close" type="button" aria-label="Закрыть">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <h3 class="settings-modal__title">${escapeHTML(title)}</h3>
                ${message ? `<p class="settings-modal__message">${escapeHTML(message)}</p>` : ''}
                ${inputHTML}
                <div class="settings-modal__buttons">${buttonsHTML}</div>
            </div>
        `;
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => overlay.classList.add('settings-modal-overlay--active'));

        const close = (value) => {
            overlay.classList.remove('settings-modal-overlay--active');
            setTimeout(() => { overlay.remove(); document.body.style.overflow = ''; }, 300);
            resolve(value);
        };

        const closeBtn = overlay.querySelector('.settings-modal__close');
        const input = overlay.querySelector('.settings-modal__input');
        const confirmBtn = overlay.querySelector('[data-action="confirm"]');

        if (input) {
            setTimeout(() => input.focus(), 100);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const value = input.value.trim();
                    if (value) close(type === 'prompt' ? value : true);
                    else { input.classList.add('settings-modal__input--error'); setTimeout(() => input.classList.remove('settings-modal__input--error'), 1500); }
                }
            });
        }

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close(type === 'prompt' ? null : false);
            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                if (action === 'confirm') {
                    if (type === 'prompt') {
                        const value = input.value.trim();
                        if (value) close(value);
                        else { input.classList.add('settings-modal__input--error'); setTimeout(() => input.classList.remove('settings-modal__input--error'), 1500); }
                    } else close(true);
                } else if (action === 'cancel') close(type === 'prompt' ? null : false);
            }
        });

        closeBtn.addEventListener('click', () => close(type === 'prompt' ? null : false));

        const handleEscape = (e) => {
            if (e.key === 'Escape') { close(type === 'prompt' ? null : false); document.removeEventListener('keydown', handleEscape); }
        };
        document.addEventListener('keydown', handleEscape);
    });
}

function showSettingsAlert(title, message) { return showModal({ type: 'alert', title, message, confirmText: 'Понятно' }); }
function showSettingsPrompt(title, message, placeholder = '', defaultValue = '') { return showModal({ type: 'prompt', title, message, placeholder, defaultValue, confirmText: 'Сохранить', cancelText: 'Отмена' }); }
function showSettingsConfirm(title, message) { return showModal({ type: 'confirm', title, message, confirmText: 'Да', cancelText: 'Нет' }); }

// ========================================
// ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ НАСТРОЕК
// ========================================
export function initSettings() {
    if (!document.querySelector('.profile')) return;
    initProfileEdit();
    initAllergenManagement();
    initToggles();
    initContactForm();
    initSurvey();
    initNotificationSettings();
    console.log('Настройки инициализированы');
}

// ========================================
// РЕДАКТИРОВАНИЕ ПРОФИЛЯ
// ========================================
function initProfileEdit() {
    const editBtn = document.querySelector('.profile__edit-btn');
    if (!editBtn) return;

    editBtn.addEventListener('click', async () => {
        const nameEl = document.querySelector('.profile__name');
        const currentName = nameEl ? nameEl.textContent.trim() : '';
        const newName = await showSettingsPrompt('Редактировать профиль', 'Введите новое имя:', 'Ваше имя', currentName);

        if (newName) {
            if (nameEl) nameEl.textContent = newName;
            localStorage.setItem('user_name', newName);
            await showSettingsAlert('Профиль обновлён', `Ваше имя изменено на "${newName}"`);
        }
    });

    const savedName = localStorage.getItem('user_name');
    if (savedName) {
        const nameEl = document.querySelector('.profile__name');
        if (nameEl) nameEl.textContent = savedName;
    }
}

// ========================================
// УПРАВЛЕНИЕ АЛЛЕРГЕНАМИ
// ========================================
function initAllergenManagement() {
    const allergenList = document.querySelector('.allergens__list');
    if (!allergenList) return;

    allergenList.addEventListener('click', async (e) => {
        const removeBtn = e.target.closest('.allergen-tag__remove');
        if (removeBtn) {
            const tag = removeBtn.closest('.allergen-tag');
            const allergenName = tag.querySelector('.allergen-tag__text').textContent;
            const confirmed = await showSettingsConfirm('Удалить аллерген', `Вы уверены, что хотите удалить "${allergenName}"?`);
            if (confirmed && tag) {
                tag.remove();
                updateAllergenCount();
                saveAllergens();
            }
        }
    });

    const addBtn = allergenList.querySelector('.allergen-tag--add');
    if (addBtn) {
        addBtn.addEventListener('click', async () => {
            const allergenName = await showSettingsPrompt('Добавить аллерген', 'Введите название аллергена:', 'Например: Амброзия');
            if (allergenName) addAllergen(allergenName);
        });
    }

    loadAllergens();
}

function addAllergen(name) {
    const allergenList = document.querySelector('.allergens__list');
    if (!allergenList) return;
    const addBtn = allergenList.querySelector('.allergen-tag--add');
    const tag = document.createElement('div');
    tag.className = 'allergen-tag';
    tag.innerHTML = `<span class="allergen-tag__text">${escapeHTML(name)}</span> <button class="allergen-tag__remove" type="button" aria-label="Удалить">×</button>`;
    if (addBtn) allergenList.insertBefore(tag, addBtn);
    else allergenList.appendChild(tag);
    updateAllergenCount();
    saveAllergens();
}

function updateAllergenCount() {
    const countEl = document.querySelector('.allergens__count');
    const tags = document.querySelectorAll('.allergen-tag:not(.allergen-tag--add)');
    if (countEl) countEl.textContent = `${tags.length} активны`;
}

function saveAllergens() {
    const tags = document.querySelectorAll('.allergen-tag:not(.allergen-tag--add)');
    const allergens = Array.from(tags).map(tag => {
        const textEl = tag.querySelector('.allergen-tag__text');
        return textEl ? textEl.textContent : '';
    });
    try { localStorage.setItem('user_allergens', JSON.stringify(allergens)); } catch (e) { console.error(e); }
}

function loadAllergens() {
    const savedAllergens = localStorage.getItem('user_allergens');
    const allergenList = document.querySelector('.allergens__list');
    if (!allergenList) return;

    const addBtn = allergenList.querySelector('.allergen-tag--add');
    allergenList.innerHTML = '';
    if (addBtn) allergenList.appendChild(addBtn);

    if (savedAllergens) {
        try {
            const allergens = JSON.parse(savedAllergens);
            if (!Array.isArray(allergens)) { localStorage.removeItem('user_allergens'); return; }
            allergens.forEach(allergen => {
                if (typeof allergen === 'string' && allergen.trim()) addAllergen(allergen.trim());
            });
        } catch (e) {
            console.error('settings.js: ошибка парсинга аллергенов:', e);
            localStorage.removeItem('user_allergens');
        }
    }
    updateAllergenCount();
}

// ========================================
// ПЕРЕКЛЮЧАТЕЛИ НАСТРОЕК
// ========================================
function initToggles() {
    const toggles = document.querySelectorAll('.toggle__input');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            const settingName = e.target.closest('.settings-menu__item').querySelector('.settings-menu__label').textContent;
            const isEnabled = e.target.checked;
            localStorage.setItem(`setting_${settingName}`, isEnabled);
        });
    });
    toggles.forEach(toggle => {
        const settingName = toggle.closest('.settings-menu__item').querySelector('.settings-menu__label').textContent;
        const savedState = localStorage.getItem(`setting_${settingName}`);
        if (savedState !== null) toggle.checked = savedState === 'true';
    });
}

// ========================================
// ФОРМА СВЯЗИ С ПОДДЕРЖКОЙ
// ========================================
function initContactForm() {
    const input = document.querySelector('.contact-support__input');
    if (!input) return;
    input.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = input.value.trim();
            if (value) {
                await showSettingsAlert('Спасибо!', `Мы свяжемся с вами по контакту: ${value}`);
                input.value = '';
            }
        }
    });
}

// ========================================
// ОПРОС — НОВАЯ ЛОГИКА
// ========================================
const SURVEY_STORAGE_KEY = 'vremya_tsveti_survey_completed';
const SURVEY_COOLDOWN_DAYS = 7;

function initSurvey() {
    const surveySection = document.querySelector('.survey');
    const ratingBtns = document.querySelectorAll('.survey__rating-btn');
    const checkboxes = document.querySelectorAll('.survey__checkbox-input');
    const submitBtn = document.querySelector('.survey__submit-btn');
    const messageEl = document.querySelector('.survey__completed-message');

    if (!surveySection || !submitBtn) return;

    // Проверяем, когда был пройден опрос
    const surveyStatus = checkSurveyStatus();

    if (surveyStatus.completed) {
        // Опрос уже пройден — показываем сообщение и делаем неактивным
        disableSurvey(surveyStatus.completedAt);
    } else {
        // Опрос доступен — настраиваем обычную логику
        setupActiveSurvey(ratingBtns, checkboxes, submitBtn, messageEl);
    }
}

function checkSurveyStatus() {
    try {
        const raw = localStorage.getItem(SURVEY_STORAGE_KEY);
        if (!raw) return { completed: false };
        const data = JSON.parse(raw);
        if (!data || !data.completedAt) return { completed: false };

        const completedAt = new Date(data.completedAt);
        const now = new Date();
        const diffDays = (now - completedAt) / (1000 * 60 * 60 * 24);

        if (diffDays >= SURVEY_COOLDOWN_DAYS) {
            // Прошло больше недели — можно проходить снова
            localStorage.removeItem(SURVEY_STORAGE_KEY);
            return { completed: false };
        }

        return { completed: true, completedAt };
    } catch (e) {
        console.error('Ошибка проверки статуса опроса:', e);
        return { completed: false };
    }
}

function disableSurvey(completedAt) {
    const surveySection = document.querySelector('.survey');
    const ratingBtns = document.querySelectorAll('.survey__rating-btn');
    const checkboxes = document.querySelectorAll('.survey__checkbox-input');
    const submitBtn = document.querySelector('.survey__submit-btn');
    const messageEl = document.querySelector('.survey__completed-message');

    if (!surveySection) return;

    // Добавляем класс для визуального отключения
    surveySection.classList.add('survey--disabled');

    // Отключаем все интерактивные элементы
    ratingBtns.forEach(btn => {
        btn.disabled = true;
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    });

    checkboxes.forEach(cb => {
        cb.disabled = true;
        cb.style.pointerEvents = 'none';
    });

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.pointerEvents = 'none';
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
    }

    // Показываем сообщение
    if (messageEl) {
        const completedDate = new Date(completedAt);
        const nextAvailable = new Date(completedDate);
        nextAvailable.setDate(nextAvailable.getDate() + SURVEY_COOLDOWN_DAYS);

        const options = { day: 'numeric', month: 'long' };
        const completedStr = completedDate.toLocaleDateString('ru-RU', options);
        const nextStr = nextAvailable.toLocaleDateString('ru-RU', options);

        messageEl.textContent = `Вы уже прошли опрос ${completedStr}. Новый опрос появится ${nextStr}.`;
        messageEl.style.display = 'block';
    }

    console.log('Опрос отключён до:', new Date(completedAt).toLocaleDateString('ru-RU'));
}

function setupActiveSurvey(ratingBtns, checkboxes, submitBtn, messageEl) {
    // Скрываем сообщение если есть
    if (messageEl) messageEl.style.display = 'none';

    // Выбор рейтинга
    ratingBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const value = parseInt(btn.dataset.value || btn.textContent.trim());
            if (btn.classList.contains('survey__rating-btn--active')) {
                btn.classList.remove('survey__rating-btn--active', 'survey__rating-btn--mint', 'survey__rating-btn--yellow', 'survey__rating-btn--red');
                return;
            }
            ratingBtns.forEach(b => {
                b.classList.remove('survey__rating-btn--active', 'survey__rating-btn--mint', 'survey__rating-btn--yellow', 'survey__rating-btn--red');
            });
            btn.classList.add('survey__rating-btn--active');
            if (value >= 4) btn.classList.add('survey__rating-btn--mint');
            else if (value === 3) btn.classList.add('survey__rating-btn--yellow');
            else btn.classList.add('survey__rating-btn--red');
        });
    });

    // Отправка опроса
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const selectedRating = document.querySelector('.survey__rating-btn--active');
            const selectedCheckboxes = Array.from(checkboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);

            if (!selectedRating) {
                await showSettingsAlert('Оценка не выбрана', 'Пожалуйста, выберите оценку от 1 до 5');
                return;
            }
            if (selectedCheckboxes.length === 0) {
                await showSettingsAlert('Пункты не выбраны', 'Пожалуйста, отметьте хотя бы один пункт');
                return;
            }

            const surveyData = {
                rating: parseInt(selectedRating.textContent),
                useful: selectedCheckboxes,
                completedAt: new Date().toISOString(),
            };

            // Сохраняем факт прохождения опроса
            localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(surveyData));

            await showSettingsAlert('Спасибо за отзыв!', `Ваша оценка: ${surveyData.rating}\n\nПолезное: ${selectedCheckboxes.join(', ')}`);

            // Сброс формы и отключение опроса
            ratingBtns.forEach(b => b.classList.remove('survey__rating-btn--active', 'survey__rating-btn--mint', 'survey__rating-btn--yellow', 'survey__rating-btn--red'));
            checkboxes.forEach(cb => cb.checked = false);

            // Отключаем опрос и показываем сообщение
            disableSurvey(surveyData.completedAt);
        });
    }
}

// ========================================
// NOTIFICATION API
// ========================================
function initNotificationSettings() {
    const notificationToggle = Array.from(document.querySelectorAll('.toggle__input')).find(toggle => {
        const label = toggle.closest('.settings-menu__item')?.querySelector('.settings-menu__label');
        return label && label.textContent.trim() === 'Уведомления';
    });

    if (!notificationToggle) {
        console.warn('settings.js: toggle "Уведомления" не найден');
        return;
    }

    if (window.location.protocol === 'file:') {
        console.warn('settings.js: Notification API не работает через file://');
        notificationToggle.addEventListener('change', async (e) => {
            if (e.target.checked) {
                e.target.checked = false;
                await showSettingsAlert('Уведомления недоступны', 'Запустите сайт через локальный сервер (localhost) или HTTPS.');
            }
        });
        return;
    }

    if (!('Notification' in window)) {
        notificationToggle.disabled = true;
        notificationToggle.checked = false;
        return;
    }

    const currentPermission = Notification.permission;
    if (currentPermission === 'granted') {
        notificationToggle.checked = true;
        localStorage.setItem('setting_Уведомления', 'true');
    } else if (currentPermission === 'denied') {
        notificationToggle.checked = false;
        notificationToggle.disabled = true;
        localStorage.setItem('setting_Уведомления', 'false');
    }

    notificationToggle.addEventListener('change', async (e) => {
        const isEnabled = e.target.checked;
        if (isEnabled) {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    localStorage.setItem('setting_Уведомления', 'true');
                    sendTestNotification();
                } else {
                    e.target.checked = false;
                    localStorage.setItem('setting_Уведомления', 'false');
                    if (permission === 'denied') {
                        e.target.disabled = true;
                        await showSettingsAlert('Уведомления заблокированы', 'Разрешите их в настройках браузера.');
                    }
                }
            } catch (err) {
                console.error('Ошибка запроса разрешения:', err);
                e.target.checked = false;
            }
        } else {
            localStorage.setItem('setting_Уведомления', 'false');
        }
    });
}

function sendTestNotification() {
    if (Notification.permission !== 'granted') return;
    const notification = new Notification('🌿 Время Цвести', {
        body: 'Уведомления работают! Вы будете получать оповещения о высокой концентрации пыльцы.',
        icon: 'assets/logo.png',
        badge: 'assets/badge.png',
        tag: 'test-notification',
        requireInteraction: false,
    });
    notification.onclick = () => { window.focus(); notification.close(); };
}

// ========================================
// ESCAPE HTML
// ========================================
function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[tag]));
}