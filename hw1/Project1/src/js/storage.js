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
export function getDayData(date) {
    const allData = getAllData();
    const dayData = allData[date] || {};
    return {
        symptoms: dayData.symptoms || [],
        medications: dayData.medications || [],
        rating: dayData.rating || null,
    };
}

export function saveDayData(date, data) {
    const allData = getAllData();
    allData[date] = { ...allData[date], ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
}

export function getAllData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
}

export function getTodayString() {
    const today = new Date();
    return formatDate(today);
}

export function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function isPastDate(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate <= today;
}