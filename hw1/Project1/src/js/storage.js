// Ключ для localStorage
const STORAGE_KEY = 'vremya_tsveti_data';

// ========================================
// СОСТОЯНИЕ ПРОСМАТРИВАЕМОЙ ДАТЫ
// ========================================
let currentViewDate = getTodayString(); // По умолчанию смотрим сегодня

export function getViewDate() {
    return currentViewDate;
}

export function setViewDate(date) {
    currentViewDate = date;
}

// ========================================
// РАБОТА С ДАННЫМИ
// ========================================

// Получаем данные за конкретную дату (формат: YYYY-MM-DD)
export function getDayData(date) {
    try {
        const allData = getAllData();
        const dayData = allData[date] || {};
        
        // Валидация полей — защита от повреждённых данных
        return {
            symptoms: Array.isArray(dayData.symptoms) ? dayData.symptoms : [],
            medications: Array.isArray(dayData.medications) ? dayData.medications : [],
            rating: (typeof dayData.rating === 'number' && dayData.rating >= 1 && dayData.rating <= 5) 
                ? dayData.rating 
                : null,
        };
    } catch (e) {
        console.error('storage.js: ошибка чтения данных за дату', date, e);
        return { symptoms: [], medications: [], rating: null };
    }
}

// Сохраняем данные за конкретную дату
export function saveDayData(date, data) {
    try {
        const allData = getAllData();
        allData[date] = { ...allData[date], ...data };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
    } catch (e) {
        console.error('storage.js: ошибка сохранения данных:', e);
    }
}

// Получаем все данные
export function getAllData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        
        const parsed = JSON.parse(raw);
        
        // Валидация: проверяем, что это объект
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            console.warn('storage.js: данные в localStorage повреждены, очищаем');
            localStorage.removeItem(STORAGE_KEY);
            return {};
        }
        
        return parsed;
    } catch (e) {
        console.error('storage.js: ошибка парсинга данных из localStorage:', e);
        // Очищаем битые данные
        localStorage.removeItem(STORAGE_KEY);
        return {};
    }
}

// Получаем сегодняшнюю дату в формате YYYY-MM-DD
export function getTodayString() {
    const today = new Date();
    return formatDate(today);
}

// Форматируем дату
export function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Проверяем, является ли дата прошедшей (не в будущем)
export function isPastDate(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate <= today;
}