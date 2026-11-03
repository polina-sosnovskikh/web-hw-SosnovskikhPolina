// Данные для прогноза
const forecastData = {
    date: new Date(),
    personalIndex: 7.8,
    mainFactor: 'Берёза',
    weather: {
        temperature: '+21°C',
        condition: 'сухо',
        wind: 'Ветер западный, 6 м/с (разносит пыльцу)',
    },
    allergens: [
        { name: 'Берёза', level: 'peak', label: 'Пик' },
        { name: 'Злаки', level: 'mid', label: 'Средне' },
    ],
    community: [
        'Ваш последний симптом: легкое першение (вчера в 21:00)',
        '72% пользователей в вашем районе отмечают зуд и заложенность носа сегодня.',
    ],
    expertAdvice: [
        'Воздержитесь от утренних прогулок с 6:00 до 11:00.',
        'Держите окна закрытыми, используйте кондиционер с HEPA-фильтром.',
        'Примите назначенное антигистаминное средство в 9:00.',
    ],
};

// Форматирование даты
function formatDate(date) {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    
    return `${dayName}, ${day} ${month}`;
}

// ========================================
// МОДАЛЬНОЕ ОКНО "ОТЧЁТ С ПРОГНОЗОМ"
// ========================================

function showForecastReportModal() {
    return new Promise((resolve) => {
        // Удаляем старую модалку, если есть
        const oldOverlay = document.querySelector('.forecast-report-modal-overlay');
        if (oldOverlay) oldOverlay.remove();

        const overlay = document.createElement('div');
        overlay.className = 'forecast-report-modal-overlay';

        overlay.innerHTML = `
            <div class="forecast-report-modal">
                <button class="forecast-report-modal__close" type="button" aria-label="Закрыть">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div class="forecast-report-modal__body">
                    <div class="forecast-report-modal__icon"></div>
                    <h3 class="forecast-report-modal__title">Отчёт с прогнозом в разработке</h3>
                    <p class="forecast-report-modal__message">
                        Приносим свои извинения — функция скачивания отчёта с прогнозом скоро будет доступна.
                        Мы работаем над тем, чтобы вы могли получать подробный прогноз аллергической активности на неделю вперёд.
                    </p>
                </div>
                <div class="forecast-report-modal__buttons">
                    <button class="forecast-report-modal__btn forecast-report-modal__btn--confirm" data-action="confirm">
                        Понятно
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        requestAnimationFrame(() => {
            overlay.classList.add('forecast-report-modal-overlay--active');
        });

        const close = () => {
            overlay.classList.remove('forecast-report-modal-overlay--active');
            setTimeout(() => {
                overlay.remove();
                document.body.style.overflow = '';
            }, 300);
            resolve(true);
        };

        const closeBtn = overlay.querySelector('.forecast-report-modal__close');
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
// ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ ПРОГНОЗА
// ========================================

export function initForecast() {
    if (!document.querySelector('.forecast-intro')) return;

    updateDate();
    initTooltip();
    updateForecastData();
    initReportButton();
}

function updateDate() {
    const dateElement = document.querySelector('.forecast-intro__date');
    if (dateElement) {
        dateElement.textContent = formatDate(forecastData.date);
    }
}

function initTooltip() {
    const infoBtn = document.querySelector('.personal-index__info-btn');
    const tooltip = document.querySelector('.personal-index__tooltip');

    if (!infoBtn || !tooltip) return;

    infoBtn.addEventListener('mouseenter', () => {
        tooltip.style.opacity = '1';
        tooltip.style.visibility = 'visible';
        tooltip.style.transform = 'translateY(0)';
    });

    infoBtn.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
        tooltip.style.transform = 'translateY(-8px)';
    });

    infoBtn.addEventListener('focus', () => {
        tooltip.style.opacity = '1';
        tooltip.style.visibility = 'visible';
        tooltip.style.transform = 'translateY(0)';
    });

    infoBtn.addEventListener('blur', () => {
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
        tooltip.style.transform = 'translateY(-8px)';
    });
}

function updateForecastData() {
    const indexValue = document.querySelector('.personal-index__score-value');
    if (indexValue) {
        indexValue.textContent = forecastData.personalIndex;
    }

    const mainFactor = document.querySelector('.personal-index__factor-text');
    if (mainFactor) {
        mainFactor.textContent = `Рассчитано на основе вашей чувствительности к ${forecastData.mainFactor.toLowerCase()} и текущей розы ветров.`;
    }

const weatherText = document.querySelector('.risk-card__text');
if (weatherText && forecastData.weather && !weatherText.textContent.trim()) {
    weatherText.innerHTML = `${forecastData.weather.temperature}, ${forecastData.weather.condition}<br>${forecastData.weather.wind}`;
}

    const allergenList = document.querySelectorAll('.allergen');
    if (allergenList.length > 0 && forecastData.allergens) {
        forecastData.allergens.forEach((allergen, index) => {
            if (allergenList[index]) {
                const nameEl = allergenList[index].querySelector('.allergen__name');
                const badgeEl = allergenList[index].querySelector('.allergen__badge');
                
                if (nameEl) nameEl.textContent = allergen.name;
                if (badgeEl) {
                    badgeEl.textContent = allergen.label;
                    badgeEl.className = `allergen__badge allergen__badge--${allergen.level}`;
                }
            }
        });
    }

    const communityCards = document.querySelectorAll('.community__text');
    if (communityCards.length > 0 && forecastData.community) {
        forecastData.community.forEach((text, index) => {
            if (communityCards[index]) {
                communityCards[index].textContent = text;
            }
        });
    }

    const expertList = document.querySelectorAll('.expert__text');
    if (expertList.length > 0 && forecastData.expertAdvice) {
        forecastData.expertAdvice.forEach((text, index) => {
            if (expertList[index]) {
                expertList[index].textContent = text;
            }
        });
    }
}

// Обработчик кнопки "посмотреть отчёт с прогнозом"
function initReportButton() {
    const reportBtn = document.querySelector('.report__card');
    if (!reportBtn) return;

    reportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showForecastReportModal();
    });
}