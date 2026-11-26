const API_BASE = 'http://localhost:3001/api';
const API_ENDPOINTS = {
    WEATHER: 'https://api.open-meteo.com/v1/forecast',
};

const SPB_COORDS = { lat: 59.93, lon: 30.31 };
const CURRENT_USER = 'polina';

export const api = {
    async getWeather() {
        const params = new URLSearchParams({
            latitude: SPB_COORDS.lat,
            longitude: SPB_COORDS.lon,
            current: 'temperature_2m,wind_speed_10m,relative_humidity_2m',
            timezone: 'Europe/Moscow',
            forecast_days: '1',
        });
        const res = await fetch(`${API_ENDPOINTS.WEATHER}?${params}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    },

    async saveRating(rating, date) {
        const res = await fetch(`${API_BASE}/ratings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating, date, userId: CURRENT_USER }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    },

    async getPosts() {
        const res = await fetch(`${API_BASE}/posts`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    },

    async createPost(text) {
        const res = await fetch(`${API_BASE}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, author: 'Вы', userId: CURRENT_USER }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    },

    async toggleLike(postId) {
        const res = await fetch(`${API_BASE}/posts/${postId}/like`, { method: 'PUT' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    },

        // ========================================
    // НАСТРОЙКИ
    // ========================================
    async getSettings() {
        const res = await fetch(`${API_BASE}/settings`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    },

    async updateSettings(partial) {
        const res = await fetch(`${API_BASE}/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(partial),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    },

    async updateUserName(name) {
        const res = await fetch(`${API_BASE}/settings/name`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    },

    async getAllergens() {
        const res = await fetch(`${API_BASE}/settings/allergens`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    },

    async saveAllergens(allergens) {
        const res = await fetch(`${API_BASE}/settings/allergens`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ allergens }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    },

    async saveToggles(toggles) {
        const res = await fetch(`${API_BASE}/settings/toggles`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ toggles }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    },

    async saveSurvey(surveyData) {
        const res = await fetch(`${API_BASE}/settings/survey`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(surveyData),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    },

    async getSurvey() {
        const res = await fetch(`${API_BASE}/settings/survey`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    },

    async saveContactEmail(email) {
        const res = await fetch(`${API_BASE}/settings/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    },
};