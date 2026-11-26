import { saveDayData, getTodayString, getDayData, getViewDate } from './storage.js';
import { api } from './api.js';

const greenImg = new URL('../assets/good_green_main.png', import.meta.url).href;
const yellowImg = new URL('../assets/med_yellow_main.png', import.meta.url).href;
const redImg = new URL('../assets/bad_red_main.png', import.meta.url).href;
const mascotImages = { green: greenImg, yellow: yellowImg, red: redImg };

let selectedRating = null;
let isEventsAttached = false;

export function initRating() {
  const buttons = document.querySelectorAll('#rating-buttons .rating-btn');
  const mascot = document.getElementById('rating-mascot');
  const submitBtn = document.getElementById('rating-submit');
  const ratingContainer = document.getElementById('rating-buttons');
  const messageEl = document.getElementById('rating-saved-message');

  if (!buttons.length || !mascot || !submitBtn || !ratingContainer) return;

  const viewDate = getViewDate();
  const today = getTodayString();
  const isToday = viewDate === today;

  const dayData = getDayData(viewDate);
  if (dayData && typeof dayData.rating === 'number' && dayData.rating >= 1 && dayData.rating <= 5) {
    selectedRating = dayData.rating;
    updateRatingUI(selectedRating);
    
    if (isToday) {
      showSavedMessage();
      disableSubmitButton();
    }
  } else {
    selectedRating = null;
    mascot.src = mascotImages.green;
    buttons.forEach((btn) => {
      btn.classList.remove('rating-btn--active', 'rating-btn--green', 'rating-btn--yellow', 'rating-btn--red');
    });
    if (messageEl) messageEl.textContent = '';
    enableSubmitButton();
  }

  if (isToday) {
    ratingContainer.style.pointerEvents = 'auto';
    ratingContainer.style.opacity = '1';
    if (!dayData || typeof dayData.rating !== 'number') {
      enableSubmitButton();
    }
  } else {
    ratingContainer.style.pointerEvents = 'none';
    ratingContainer.style.opacity = '0.5';
    submitBtn.textContent = 'Оценивать самочувствие нужно день в день';
    submitBtn.style.cssText = "font-family: 'Montserrat', sans-serif; background-color: #f0f0f0; color: #888; cursor: default; font-size: 0.85rem; white-space: normal; line-height: 1.3; height: auto; padding: 12px 16px; font-weight: 500;";
  }

  if (!isEventsAttached) {
    attachRatingEvents();
    isEventsAttached = true;
  }
}

function attachRatingEvents() {
  const buttons = document.querySelectorAll('#rating-buttons .rating-btn');
  const submitBtn = document.getElementById('rating-submit');

  buttons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      if (getViewDate() !== getTodayString()) return;
      const value = parseInt(btn.dataset.value);
      selectedRating = value;
      updateRatingUI(value);
    });
  });

  submitBtn.addEventListener('click', async () => {
    if (getViewDate() !== getTodayString()) return;
    if (!selectedRating) {
      alert('Пожалуйста, выберите оценку от 1 до 5');
      return;
    }

    const today = getTodayString();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Сохраняем…';
    submitBtn.style.opacity = '0.7';

    try {
      await api.saveRating(selectedRating, today);
      console.log('✅ Оценка сохранена на сервере');
    } catch (error) {
      console.warn('⚠️ Сервер недоступен, сохраняем локально:', error);
    }

    saveDayData(today, { rating: selectedRating });

    showSavedMessage();
    disableSubmitButton();
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
      if (value >= 4) btn.classList.add('rating-btn--green');
      else if (value === 3) btn.classList.add('rating-btn--yellow');
      else btn.classList.add('rating-btn--red');
    }
  });

  if (!mascot) return;
  mascot.style.opacity = '0';
  setTimeout(() => {
    if (value >= 4) mascot.src = mascotImages.green;
    else if (value === 3) mascot.src = mascotImages.yellow;
    else mascot.src = mascotImages.red;
    mascot.style.opacity = '1';
  }, 200);
}

function showSavedMessage() {
  const messageEl = document.getElementById('rating-saved-message');
  if (!messageEl) return;

  const now = new Date();
  const dateStr = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  messageEl.textContent = `Вы уже оценили своё самочувствие за ${dateStr} ${timeStr}, следующая отметка завтра`;
}

function disableSubmitButton() {
  const submitBtn = document.getElementById('rating-submit');
  if (!submitBtn) return;
  
  submitBtn.disabled = true;
  submitBtn.style.opacity = '0.5';
  submitBtn.style.cursor = 'not-allowed';
  submitBtn.style.pointerEvents = 'none';
}

function enableSubmitButton() {
  const submitBtn = document.getElementById('rating-submit');
  if (!submitBtn) return;
  
  submitBtn.disabled = false;
  submitBtn.style.opacity = '1';
  submitBtn.style.cursor = 'pointer';
  submitBtn.style.pointerEvents = 'auto';
  submitBtn.textContent = 'Готово';
  submitBtn.style.cssText = '';
}