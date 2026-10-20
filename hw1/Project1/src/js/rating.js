import { saveDayData, getTodayString, getDayData, getViewDate } from './storage.js';

// Пути к картинкам маскота
const greenImg = new URL('../assets/good_green_main.png', import.meta.url).href;
const yellowImg = new URL('../assets/med_yellow_main.png', import.meta.url).href;
const redImg = new URL('../assets/bad_red_main.png', import.meta.url).href;

const mascotImages = {
    green: greenImg,
    yellow: yellowImg,
    red: redImg,
};

let selectedRating = null;
let isEventsAttached = false; // Флаг, чтобы не вешать обработчики дважды

export function initRating() {
    const buttons = document.querySelectorAll('#rating-buttons .rating-btn');
    const mascot = document.getElementById('rating-mascot');
    const submitBtn = document.getElementById('rating-submit');
    const ratingContainer = document.getElementById('rating-buttons');

    if (!buttons.length || !mascot || !submitBtn || !ratingContainer) return;

    const viewDate = getViewDate();
    const today = getTodayString();
    const isToday = viewDate === today;

    // 1. Восстанавливаем сохранённую оценку за выбранный день
    const dayData = getDayData(viewDate);
    
    // ИСПРАВЛЕНО: валидация rating — проверяем, что это число от 1 до 5
    if (dayData && typeof dayData.rating === 'number' && dayData.rating >= 1 && dayData.rating <= 5) {
        selectedRating = dayData.rating;
        updateRatingUI(selectedRating);
    } else {
        selectedRating = null;
        mascot.src = mascotImages.green;
        // Сбрасываем цвета звёздочек
        buttons.forEach((btn) => {
            btn.classList.remove('rating-btn--active', 'rating-btn--green', 'rating-btn--yellow', 'rating-btn--red');
        });
    }

    // 2. Управляем состоянием UI (Сегодня vs Прошлые дни)
    if (isToday) {
        // Разблокируем интерфейс
        ratingContainer.style.pointerEvents = 'auto';
        ratingContainer.style.opacity = '1';
        
        // Возвращаем кнопке нормальный вид
        submitBtn.textContent = 'Готово';
        submitBtn.style.cssText = ''; // Сбрасываем inline-стили, чтобы вернулись из CSS
    } else {
        // Блокируем интерфейс (визуально и физически)
        ratingContainer.style.pointerEvents = 'none';
        ratingContainer.style.opacity = '0.5'; // Делаем полупрозрачным
        
        // Превращаем кнопку в подсказку
        submitBtn.textContent = 'Оценивать самочувствие нужно день в день';
        submitBtn.style.fontFamily = "'Montserrat', sans-serif";
        submitBtn.style.backgroundColor = '#f0f0f0';
        submitBtn.style.color = '#888';
        submitBtn.style.cursor = 'default';
        submitBtn.style.fontSize = '0.85rem';
        submitBtn.style.whiteSpace = 'normal'; // Разрешаем перенос текста
        submitBtn.style.lineHeight = '1.3';
        submitBtn.style.height = 'auto';
        submitBtn.style.padding = '12px 16px';
        submitBtn.style.fontWeight = '500';
    }

    // 3. Вешаем события (только один раз при первой инициализации)
    if (!isEventsAttached) {
        attachRatingEvents();
        isEventsAttached = true;
    }
}

function attachRatingEvents() {
    const buttons = document.querySelectorAll('#rating-buttons .rating-btn');
    const submitBtn = document.getElementById('rating-submit');

    // Обработчик звёздочек
    buttons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            // Защита: если это не сегодня, игнорируем клик
            if (getViewDate() !== getTodayString()) return;

            const value = parseInt(btn.dataset.value);
            selectedRating = value;
            updateRatingUI(value);
        });
    });

    // Обработчик кнопки "Готово"
    submitBtn.addEventListener('click', () => {
        // Защита: если это не сегодня, игнорируем клик
        if (getViewDate() !== getTodayString()) return;

        if (!selectedRating) {
            alert('Пожалуйста, выберите оценку от 1 до 5');
            return;
        }
        
        const today = getTodayString();
        saveDayData(today, { rating: selectedRating });
        showThankYouMessage();
    });
}

function updateRatingUI(value) {
    const buttons = document.querySelectorAll('#rating-buttons .rating-btn');
    const mascot = document.getElementById('rating-mascot');

    buttons.forEach((btn) => {
        const btnValue = parseInt(btn.dataset.value);
        btn.classList.remove('rating-btn--active', 'rating-btn--green', 'rating-btn--yellow', 'rating-btn--red');

        if (btnValue === value) {
            btn.classList.add('rating-btn--active');
            if (value <= 2) btn.classList.add('rating-btn--green');
            else if (value === 3) btn.classList.add('rating-btn--yellow');
            else btn.classList.add('rating-btn--red');
        }
    });

    if (!mascot) return;
    mascot.style.opacity = '0';
    setTimeout(() => {
        if (value <= 2) mascot.src = mascotImages.green;
        else if (value === 3) mascot.src = mascotImages.yellow;
        else mascot.src = mascotImages.red;
        mascot.style.opacity = '1';
    }, 200);
}

function showThankYouMessage() {
    const submitBtn = document.getElementById('rating-submit');
    if (!submitBtn) return;

    // Сохраняем текущие стили, чтобы потом вернуть
    const originalText = submitBtn.textContent;
    const originalBg = submitBtn.style.backgroundColor;
    const originalColor = submitBtn.style.color;

    submitBtn.textContent = 'Спасибо за оценку!';
    submitBtn.style.backgroundColor = 'var(--мятный, #5ed6a2)';
    submitBtn.style.color = 'var(--белый, #fff)';

    setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.style.backgroundColor = originalBg;
        submitBtn.style.color = originalColor;
    }, 2500);
}