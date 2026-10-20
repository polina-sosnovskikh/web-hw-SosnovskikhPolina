// ========================================
// УНИВЕРСАЛЬНАЯ СИСТЕМА МОДАЛЬНЫХ ОКОН
// ========================================
function showModal({ type = 'alert', title = '', message = '', placeholder = '', defaultValue = '', confirmText = 'Понятно', cancelText = 'Отмена' } = {}) {
    return new Promise((resolve) => {
        // Удаляем старые модалки, если есть
        const oldOverlay = document.querySelector('.settings-modal-overlay');
        if (oldOverlay) oldOverlay.remove();

        const overlay = document.createElement('div');
        overlay.className = 'settings-modal-overlay';
        let inputHTML = '';
        if (type === 'prompt') {
            inputHTML = `
                <input 
                    type="text" 
                    class="settings-modal__input" 
                    placeholder="${escapeHTML(placeholder)}" 
                    value="${escapeHTML(defaultValue)}"
                    autocomplete="off"
                >
            `;
        }
        let buttonsHTML = '';
        if (type === 'alert') {
            buttonsHTML = `
                <button class="settings-modal__btn settings-modal__btn--confirm" data-action="confirm">
                    ${escapeHTML(confirmText)}
                </button>
            `;
        } else {
            buttonsHTML = `
                <button class="settings-modal__btn settings-modal__btn--cancel" data-action="cancel">
                    ${escapeHTML(cancelText)}
                </button>
                <button class="settings-modal__btn settings-modal__btn--confirm" data-action="confirm">
                    ${escapeHTML(confirmText)}
                </button>
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
                <div class="settings-modal__buttons">
                    ${buttonsHTML}
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        // Блокируем прокрутку
        document.body.style.overflow = 'hidden';
        // Анимация появления
        requestAnimationFrame(() => {
            overlay.classList.add('settings-modal-overlay--active');
        });

        const close = (value) => {
            overlay.classList.remove('settings-modal-overlay--active');
            setTimeout(() => {
                overlay.remove();
                document.body.style.overflow = '';
            }, 300);
            resolve(value);
        };

        const closeBtn = overlay.querySelector('.settings-modal__close');
        const input = overlay.querySelector('.settings-modal__input');
        const confirmBtn = overlay.querySelector('[data-action="confirm"]');

        // Фокус на input
        if (input) {
            setTimeout(() => input.focus(), 100);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const value = input.value.trim();
                    if (value) {
                        close(type === 'prompt' ? value : true);
                    } else {
                        input.classList.add('settings-modal__input--error');
                        setTimeout(() => input.classList.remove('settings-modal__input--error'), 1500);
                    }
                }
            });
        }

        // Клик по кнопкам
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                close(type === 'prompt' ? null : false);
            }
            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                if (action === 'confirm') {
                    if (type === 'prompt') {
                        const value = input.value.trim();
                        if (value) close(value);
                        else {
                            input.classList.add('settings-modal__input--error');
                            setTimeout(() => input.classList.remove('settings-modal__input--error'), 1500);
                        }
                    } else {
                        close(true);
                    }
                } else if (action === 'cancel') {
                    close(type === 'prompt' ? null : false);
                }
            }
        });

        // Крестик
        closeBtn.addEventListener('click', () => close(type === 'prompt' ? null : false));

        // Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                close(type === 'prompt' ? null : false);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}

// Удобные обёртки
function showSettingsAlert(title, message) {
    return showModal({ type: 'alert', title, message, confirmText: 'Понятно' });
}

function showSettingsPrompt(title, message, placeholder = '', defaultValue = '') {
    return showModal({ type: 'prompt', title, message, placeholder, defaultValue, confirmText: 'Сохранить', cancelText: 'Отмена' });
}

function showSettingsConfirm(title, message) {
    return showModal({ type: 'confirm', title, message, confirmText: 'Да', cancelText: 'Нет' });
}

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
    console.log('Настройки инициализированы');
}

// Редактирование профиля
function initProfileEdit() {
    const editBtn = document.querySelector('.profile__edit-btn');
    if (!editBtn) return;
    editBtn.addEventListener('click', async () => {
        const nameEl = document.querySelector('.profile__name');
        const currentName = nameEl ? nameEl.textContent.trim() : '';
        const newName = await showSettingsPrompt(
            'Редактировать профиль', 
            'Введите новое имя:', 
            'Ваше имя', 
            currentName
        );
        if (newName) {
            if (nameEl) {
                nameEl.textContent = newName;
            }
            localStorage.setItem('user_name', newName);
            await showSettingsAlert('Профиль обновлён', `Ваше имя изменено на "${newName}"`);
        }
    });
    // Восстанавливаем имя из localStorage
    const savedName = localStorage.getItem('user_name');
    if (savedName) {
        const nameEl = document.querySelector('.profile__name');
        if (nameEl) nameEl.textContent = savedName;
    }
}

// Управление аллергенами
function initAllergenManagement() {
    const allergenList = document.querySelector('.allergens__list');
    if (!allergenList) return;

    // Удаление аллергена
    allergenList.addEventListener('click', async (e) => {
        const removeBtn = e.target.closest('.allergen-tag__remove');
        if (removeBtn) {
            const tag = removeBtn.closest('.allergen-tag');
            const allergenName = tag.querySelector('.allergen-tag__text').textContent;
            const confirmed = await showSettingsConfirm(
                'Удалить аллерген', 
                `Вы уверены, что хотите удалить "${allergenName}"?`
            );
            if (confirmed && tag) {
                tag.remove();
                updateAllergenCount();
                saveAllergens();
            }
        }
    });

    // Добавление аллергена
    const addBtn = allergenList.querySelector('.allergen-tag--add');
    if (addBtn) {
        addBtn.addEventListener('click', async () => {
            const allergenName = await showSettingsPrompt(
                'Добавить аллерген',
                'Введите название аллергена:',
                'Например: Амброзия'
            );
            if (allergenName) {
                addAllergen(allergenName);
            }
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
    tag.innerHTML = `
        <span class="allergen-tag__text">${escapeHTML(name)}</span>
        <button class="allergen-tag__remove" type="button" aria-label="Удалить">×</button>
    `;
    if (addBtn) {
        allergenList.insertBefore(tag, addBtn);
    } else {
        allergenList.appendChild(tag);
    }
    updateAllergenCount();
    saveAllergens();
}

function updateAllergenCount() {
    const countEl = document.querySelector('.allergens__count');
    const tags = document.querySelectorAll('.allergen-tag:not(.allergen-tag--add)');
    if (countEl) {
        countEl.textContent = `${tags.length} активны`;
    }
}

function saveAllergens() {
    const tags = document.querySelectorAll('.allergen-tag:not(.allergen-tag--add)');
    const allergens = Array.from(tags).map(tag => {
        const textEl = tag.querySelector('.allergen-tag__text');
        return textEl ? textEl.textContent : '';
    });
    try {
        localStorage.setItem('user_allergens', JSON.stringify(allergens));
    } catch (e) {
        console.error('settings.js: ошибка сохранения аллергенов:', e);
    }
}

// ИСПРАВЛЕНО: добавлена защита от повреждённых данных
function loadAllergens() {
    const savedAllergens = localStorage.getItem('user_allergens');
    const allergenList = document.querySelector('.allergens__list');
    if (!allergenList) return;

    // Очищаем список аллергенов, оставляя только кнопку "+ Добавить"
    const addBtn = allergenList.querySelector('.allergen-tag--add');
    allergenList.innerHTML = '';
    if (addBtn) {
        allergenList.appendChild(addBtn);
    }

    if (savedAllergens) {
        try {
            const allergens = JSON.parse(savedAllergens);
            
            // Валидация: проверяем, что это массив строк
            if (!Array.isArray(allergens)) {
                console.warn('settings.js: данные аллергенов повреждены, очищаем');
                localStorage.removeItem('user_allergens');
                return;
            }
            
            allergens.forEach(allergen => {
                if (typeof allergen === 'string' && allergen.trim()) {
                    addAllergen(allergen.trim());
                }
            });
        } catch (e) {
            console.error('settings.js: ошибка парсинга аллергенов:', e);
            localStorage.removeItem('user_allergens');
        }
    }

    updateAllergenCount();
}

// Переключатели настроек
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
        if (savedState !== null) {
            toggle.checked = savedState === 'true';
        }
    });
}

// Форма связи с поддержкой
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

// Опрос
function initSurvey() {
    const ratingBtns = document.querySelectorAll('.survey__rating-btn');
    const checkboxes = document.querySelectorAll('.survey__checkbox-input');
    const submitBtn = document.querySelector('.survey__submit-btn');

    // Выбор рейтинга с разными цветами
    ratingBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const value = parseInt(btn.dataset.value || btn.textContent.trim());
            // Если уже активна — снимаем выделение (toggle)
            if (btn.classList.contains('survey__rating-btn--active')) {
                btn.classList.remove('survey__rating-btn--active');
                btn.classList.remove(
                    'survey__rating-btn--mint',
                    'survey__rating-btn--yellow',
                    'survey__rating-btn--red'
                );
                return;
            }
            // Снимаем активность и цвета со всех кнопок
            ratingBtns.forEach(b => {
                b.classList.remove('survey__rating-btn--active');
                b.classList.remove(
                    'survey__rating-btn--mint',
                    'survey__rating-btn--yellow',
                    'survey__rating-btn--red'
                );
            });
            // Активируем выбранную кнопку и добавляем нужный цвет
            btn.classList.add('survey__rating-btn--active');
            if (value <= 2) {
                btn.classList.add('survey__rating-btn--mint');
            } else if (value === 3) {
                btn.classList.add('survey__rating-btn--yellow');
            } else {
                btn.classList.add('survey__rating-btn--red');
            }
        });
    });

    // Отправка опроса
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const selectedRating = document.querySelector('.survey__rating-btn--active');
            const selectedCheckboxes = Array.from(checkboxes)
                .filter(cb => cb.checked)
                .map(cb => {
                    const textEl = cb.nextElementSibling;
                    return textEl ? textEl.textContent : '';
                });
            if (!selectedRating) {
                await showSettingsAlert('Оценка не выбрана', 'Пожалуйста, выберите оценку от 1 до 5');
                return;
            }
            if (selectedCheckboxes.length === 0) {
                await showSettingsAlert('Пункты не выбраны', 'Пожалуйста, отметьте хотя бы один пункт');
                return;
            }
            const rating = selectedRating.textContent;
            await showSettingsAlert(
                'Спасибо за отзыв!', 
                `Ваша оценка: ${rating}\n\nПолезное: ${selectedCheckboxes.join(', ')}`
            );
            // Сброс формы
            ratingBtns.forEach(b => {
                b.classList.remove('survey__rating-btn--active');
                b.classList.remove(
                    'survey__rating-btn--mint',
                    'survey__rating-btn--yellow',
                    'survey__rating-btn--red'
                );
            });
            checkboxes.forEach(cb => cb.checked = false);
        });
    }
}

// ========================================
// ESCAPE HTML (ИСПРАВЛЕНО — защита от XSS)
// ========================================
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