import { api } from './api.js';

const forecastData = {
    date: new Date(),
    personalIndex: 7.8,
    mainFactor: 'Берёза',
    weather: { temperature: '+21°C', condition: 'сухо', wind: 'Ветер западный, 6 м/с (разносит пыльцу)' },
    allergens: [{ name: 'Берёза', level: 'peak', label: 'Пик' }, { name: 'Злаки', level: 'mid', label: 'Средне' }],
    community: ['Ваш последний симптом: легкое першение (вчера в 21:00)', '72% пользователей в вашем районе отмечают зуд и заложенность носа сегодня.'],
    expertAdvice: ['Воздержитесь от утренних прогулок с 6:00 до 11:00.', 'Держите окна закрытыми, используйте кондиционер с HEPA-фильтром.', 'Примите назначенное антигистаминное средство в 9:00.'],
};

function formatDate(date) {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
}

async function loadWeatherFromAPI() {
    const weatherText = document.querySelector('.risk-card__text');
    if (weatherText) weatherText.innerHTML = '<span style="opacity: 0.6;">Загружаем погоду…</span>';

    try {
        const data = await api.getWeather();
        const temp = Math.round(data.current.temperature_2m);
        const wind = Math.round(data.current.wind_speed_10m);
        const humidity = data.current.relative_humidity_2m;

        let condition = 'умеренно';
        if (humidity < 40) condition = 'сухо';
        else if (humidity > 70) condition = 'влажно';

        forecastData.weather = {
            temperature: `${temp > 0 ? '+' : ''}${temp}°C`,
            condition: condition,
            wind: `Ветер ${wind >= 5 ? 'сильный' : 'слабый'}, ${wind} м/с${wind >= 5 ? ' (разносит пыльцу)' : ''}`,
        };
    } catch (error) {
        console.warn('Не удалось загрузить погоду, используем fallback:', error);
    }
}

export async function initForecast() {
    if (!document.querySelector('.forecast-intro')) return;
    
    document.querySelector('.forecast-intro__date').textContent = formatDate(forecastData.date);
    
    const infoBtn = document.querySelector('.personal-index__info-btn');
    const tooltip = document.querySelector('.personal-index__tooltip');
    if (infoBtn && tooltip) {
        const show = () => { tooltip.style.opacity = '1'; tooltip.style.visibility = 'visible'; tooltip.style.transform = 'translateY(0)'; };
        const hide = () => { tooltip.style.opacity = '0'; tooltip.style.visibility = 'hidden'; tooltip.style.transform = 'translateY(-8px)'; };
        infoBtn.addEventListener('mouseenter', show);
        infoBtn.addEventListener('mouseleave', hide);
    }

    document.querySelector('.report__card')?.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Отчёт с прогнозом скоро будет доступен');
    });

    await loadWeatherFromAPI();
    updateForecastData();
}

function updateForecastData() {
    const indexValue = document.querySelector('.personal-index__score-value');
    if (indexValue) indexValue.textContent = forecastData.personalIndex;

    const mainFactor = document.querySelector('.personal-index__factor-text');
    if (mainFactor) mainFactor.textContent = `Рассчитано на основе вашей чувствительности к ${forecastData.mainFactor.toLowerCase()} и текущей розы ветров.`;

    // ИСПРАВЛЕНО: ВСЕГДА перезаписываем, без проверки на пустоту
    const weatherText = document.querySelector('.risk-card__text');
   if (weatherText && forecastData.weather) {
    weatherText.innerHTML = `${forecastData.weather.temperature}, ${forecastData.weather.condition}<br>${forecastData.weather.wind}`;
}

    document.querySelectorAll('.allergen').forEach((el, i) => {
        if (forecastData.allergens[i]) {
            el.querySelector('.allergen__name').textContent = forecastData.allergens[i].name;
            const badge = el.querySelector('.allergen__badge');
            badge.textContent = forecastData.allergens[i].label;
            badge.className = `allergen__badge allergen__badge--${forecastData.allergens[i].level}`;
        }
    });

    document.querySelectorAll('.community__text').forEach((el, i) => { if (forecastData.community[i]) el.textContent = forecastData.community[i]; });
    document.querySelectorAll('.expert__text').forEach((el, i) => { if (forecastData.expertAdvice[i]) el.textContent = forecastData.expertAdvice[i]; });
}