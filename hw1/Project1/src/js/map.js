import { getTodayString, getDayData } from './storage.js';

const placeholderImg = new URL('../assets/working_map.png', import.meta.url).href;
const GEO_STORAGE_KEY = 'vremya_tsveti_geo';

const mapData = {
    currentDate: new Date(),
    activeTab: 'pollen',
    selectedAllergen: 'Берёза',
    allAllergens: ['Берёза', 'Ольха', 'Злаки', 'Дуб', 'Лещина'],
    currentCity: 'Санкт-Петербург',
    userCoordinates: null,
    leafletMap: null,
    userMarker: null,
    pollenMarkers: [],
};

const spbDistrictsPollen = [
    { name: 'Центральный район', lat: 59.9343, lng: 30.3351, level: 'high' },
    { name: 'Адмиралтейский район', lat: 59.9194, lng: 30.3056, level: 'high' },
    { name: 'Василеостровский район', lat: 59.9444, lng: 30.2786, level: 'medium' },
    { name: 'Петроградский район', lat: 59.9667, lng: 30.3117, level: 'medium' },
    { name: 'Выборгский район', lat: 60.0167, lng: 30.3500, level: 'low' },
    { name: 'Калининский район', lat: 60.0167, lng: 30.4167, level: 'low' },
    { name: 'Красногвардейский район', lat: 59.9500, lng: 30.4833, level: 'medium' },
    { name: 'Невский район', lat: 59.9000, lng: 30.4833, level: 'high' },
    { name: 'Фрунзенский район', lat: 59.8667, lng: 30.3500, level: 'medium' },
    { name: 'Московский район', lat: 59.8500, lng: 30.3167, level: 'low' },
    { name: 'Кировский район', lat: 59.8500, lng: 30.2500, level: 'low' },
    { name: 'Красносельский район', lat: 59.8000, lng: 30.1000, level: 'low' },
    { name: 'Приморский район', lat: 60.0167, lng: 30.2000, level: 'medium' },
    { name: 'Курортный район', lat: 60.1000, lng: 29.9500, level: 'low' },
    { name: 'Пушкинский район', lat: 59.7167, lng: 30.4000, level: 'low' },
    { name: 'Колпинский район', lat: 59.7500, lng: 30.5833, level: 'low' },
    { name: 'Кронштадтский район', lat: 59.9917, lng: 29.7667, level: 'low' },
    { name: 'Петродворцовый район', lat: 59.8833, lng: 29.9000, level: 'low' },
];

const levelColors = { high: '#eb5757', medium: '#f9ed7b', low: '#5ed6a2' };
const levelLabels = { high: 'Высокая', medium: 'Средняя', low: 'Низкая' };

function formatDate(date) {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
}

function formatTime(date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function initMap() {
    if (!document.querySelector('.map-area')) return;
    
    updateDate();
    initLeafletMap();
    initTabs();
    initAllergenSelector();
    initSearch();
    initGeoButton();
    updateLocationInfo();
    restoreSavedLocation();
    addPollenMarkers();
    
    // Убеждаемся, что по умолчанию показываем карту пыльцы
    if (mapData.activeTab === 'pollen') {
        const leafletContainer = document.querySelector('.leaflet-container');
        if (leafletContainer) leafletContainer.style.display = 'block';
        
        const mapUIElements = document.querySelectorAll('.map-legend, .map-location, .map-controls');
        mapUIElements.forEach(el => el.style.display = '');
        
        const placeholder = document.querySelector('.map-placeholder');
        if (placeholder) placeholder.remove();
    }
    
    console.log('Карта инициализирована с Leaflet');
}

function updateDate() {
    const dateElement = document.querySelector('.date-bar__text');
    if (dateElement) dateElement.textContent = formatDate(mapData.currentDate);
}

function initLeafletMap() {
    if (typeof L === 'undefined') {
        console.error('map.js: Leaflet не загружен!');
        return;
    }

    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('map.js: контейнер карты не найден!');
        return;
    }

    // Удаляем только старый контейнер Leaflet, если есть
    const oldLeaflet = mapContainer.querySelector('.leaflet-container');
    if (oldLeaflet) oldLeaflet.remove();

    // Инициализируем карту
    mapData.leafletMap = L.map('map', {
        center: [59.9343, 30.3351],
        zoom: 11,
        zoomControl: false,
        attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(mapData.leafletMap);

    bindZoomControls();

    setTimeout(() => {
        if (mapData.leafletMap) mapData.leafletMap.invalidateSize();
    }, 100);
}

function bindZoomControls() {
    const zoomInBtn = document.querySelector('.map-controls__btn--zoom-in');
    const zoomOutBtn = document.querySelector('.map-controls__btn--zoom-out');

    const bindButton = (btn, action) => {
        if (!btn) return;
        
        // 1. Блокируем перетаскивание карты Leaflet при нажатии на кнопку
        btn.addEventListener('mousedown', (e) => e.stopPropagation());
        btn.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });
        
        // 2. Обрабатываем сам клик
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (mapData.leafletMap) {
                action === 'in' ? mapData.leafletMap.zoomIn() : mapData.leafletMap.zoomOut();
            }
        });
    };

    bindButton(zoomInBtn, 'in');
    bindButton(zoomOutBtn, 'out');
}

function addPollenMarkers() {
    if (!mapData.leafletMap) return;
    mapData.pollenMarkers.forEach(marker => marker.remove());
    mapData.pollenMarkers = [];

    // Маппинг уровней на эмодзи
    const levelEmojis = { high: '🔴', medium: '🟡', low: '🟢' };

    spbDistrictsPollen.forEach(district => {
        const emoji = levelEmojis[district.level];
        const label = levelLabels[district.level];

        const marker = L.circleMarker([district.lat, district.lng], {
            radius: 18,
            fillColor: levelColors[district.level],
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
        }).addTo(mapData.leafletMap);

        marker.bindPopup(`
            <div style="font-family: 'Montserrat', sans-serif; min-width: 160px; padding: 4px 0;">
                <strong style="font-size: 14px; color: #454e4a; display: block; margin-bottom: 6px;">
                    ${district.name}
                </strong>
                <span style="font-size: 13px; color: #454e4a; font-weight: 500;">
                    ${emoji} ${mapData.selectedAllergen}: ${label}
                </span>
            </div>
        `);

        mapData.pollenMarkers.push(marker);
    });
}

function restoreSavedLocation() {
    try {
        const saved = localStorage.getItem(GEO_STORAGE_KEY);
        if (saved) {
            const geoData = JSON.parse(saved);
            if (geoData && geoData.city) {
                mapData.currentCity = geoData.city;
                if (geoData.lat && geoData.lng && mapData.leafletMap) {
                    mapData.userCoordinates = { lat: geoData.lat, lng: geoData.lng };
                    mapData.leafletMap.setView([geoData.lat, geoData.lng], 13);
                    addUserMarker(geoData.lat, geoData.lng);
                }
                updateLocationInfo();
                console.log('Геолокация восстановлена:', geoData.city);
            }
        }
    } catch (e) {
        console.error('map.js: ошибка восстановления геолокации:', e);
    }
}

function saveLocation(city, lat, lng) {
    try {
        localStorage.setItem(GEO_STORAGE_KEY, JSON.stringify({ city, lat, lng, timestamp: Date.now() }));
    } catch (e) {
        console.error('map.js: ошибка сохранения геолокации:', e);
    }
}

async function reverseGeocode(lat, lng) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&accept-language=ru`
        );
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();
        const address = data.address || {};
        return address.city || address.town || address.village || address.suburb || address.state || 'Моё местоположение';
    } catch (error) {
        console.error('map.js: ошибка геокодирования:', error);
        return null;
    }
}

function addUserMarker(lat, lng) {
    if (!mapData.leafletMap) return;

    if (mapData.userMarker) {
        mapData.leafletMap.removeLayer(mapData.userMarker);
    }

    const userIcon = L.divIcon({
        className: 'user-location-marker-leaflet',
        html: `
            <div class="user-location-marker__dot"></div>
            <div class="user-location-marker__pulse"></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    });

    mapData.userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(mapData.leafletMap);
    mapData.userMarker.bindPopup('<strong>Вы здесь</strong>').openPopup();
}

function updateLocationInfo() {
    const cityEl = document.querySelector('.map-location__city');
    const timeEl = document.querySelector('.map-location__time');
    if (cityEl) cityEl.textContent = mapData.currentCity;
    if (timeEl) timeEl.textContent = `Обновлено: ${formatTime(new Date())}`;
}

function initSearch() {
    const searchInput = document.getElementById('map-search-input');
    const dropdownToggle = document.getElementById('search-dropdown-toggle');
    const dropdown = document.getElementById('map-search-dropdown');
    const districtList = document.getElementById('map-district-list');
    const emptyMessage = dropdown?.querySelector('.search__dropdown-empty');

    if (!searchInput || !dropdown) return;

    // Открытие/закрытие dropdown по клику на стрелочку
    if (dropdownToggle) {
        dropdownToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown();
        });
    }

    // Открытие dropdown при фокусе на input
    searchInput.addEventListener('focus', () => {
        openDropdown();
    });

    // Фильтрация списка при вводе
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        filterDistricts(query);
        if (!dropdown.classList.contains('search__dropdown--active')) {
            openDropdown();
        }
    });

    // Закрытие при клике вне dropdown
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && e.target !== searchInput && e.target !== dropdownToggle) {
            closeDropdown();
        }
    });

    // Закрытие по Escape
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDropdown();
            searchInput.blur();
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            const city = searchInput.value.trim();
            if (city) {
                selectCity(city);
            }
            closeDropdown();
        }
    });

    // Обработчики клика по элементам списка
    if (districtList) {
        districtList.addEventListener('click', (e) => {
            const item = e.target.closest('.search__dropdown-item');
            if (item) {
                const district = item.dataset.district;
                selectCity(district);
                closeDropdown();
            }
        });
    }

    // Функции управления dropdown
    function openDropdown() {
        dropdown.classList.add('search__dropdown--active');
        if (dropdownToggle) {
            dropdownToggle.classList.add('search__dropdown-toggle--active');
        }
    }

    function closeDropdown() {
        dropdown.classList.remove('search__dropdown--active');
        if (dropdownToggle) {
            dropdownToggle.classList.remove('search__dropdown-toggle--active');
        }
    }

    function toggleDropdown() {
        if (dropdown.classList.contains('search__dropdown--active')) {
            closeDropdown();
        } else {
            openDropdown();
        }
    }

    // Фильтрация районов по введённому тексту
    function filterDistricts(query) {
        if (!districtList) return;
        const items = districtList.querySelectorAll('.search__dropdown-item');
        let visibleCount = 0;

        items.forEach((item) => {
            const text = item.textContent.toLowerCase();
            if (text.includes(query)) {
                item.style.display = '';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        // Показываем "Ничего не найдено" если нет результатов
        if (emptyMessage) {
            emptyMessage.style.display = visibleCount === 0 ? 'block' : 'none';
        }
    }

    // Выбор города/района
    async function selectCity(city) {
        mapData.currentCity = city;
        searchInput.value = city;
        updateLocationInfo();
        
        // Подсвечиваем выбранный район в списке
        highlightSelectedDistrict(city);
        
        // Перелетаем к району на карте
        await geocodeAndFlyTo(city);
    }

    // Подсветка выбранного района в списке
    function highlightSelectedDistrict(city) {
        if (!districtList) return;
        const items = districtList.querySelectorAll('.search__dropdown-item');
        items.forEach((item) => {
            if (item.dataset.district === city) {
                item.classList.add('search__dropdown-item--selected');
            } else {
                item.classList.remove('search__dropdown-item--selected');
            }
        });
    }

    // Подсвечиваем текущий город при загрузке
    highlightSelectedDistrict(mapData.currentCity);
}

function initGeoButton() {
    const geoBtn = document.querySelector('.map-controls__btn--geo');
    if (!geoBtn) return;

    if (!navigator.geolocation) {
        geoBtn.style.opacity = '0.4';
        geoBtn.style.cursor = 'not-allowed';
        geoBtn.addEventListener('click', () => {
            alert('Ваш браузер не поддерживает геолокацию.');
        });
        return;
    }

    geoBtn.addEventListener('click', async () => {
        geoBtn.classList.add('map-controls__btn--loading');
        geoBtn.style.pointerEvents = 'none';

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 300000
                });
            });

            const { latitude, longitude } = position.coords;
            mapData.userCoordinates = { lat: latitude, lng: longitude };

            const city = await reverseGeocode(latitude, longitude);
            mapData.currentCity = city || 'Моё местоположение';

            saveLocation(mapData.currentCity, latitude, longitude);
            updateLocationInfo();
            addUserMarker(latitude, longitude);

            if (mapData.leafletMap) {
                mapData.leafletMap.flyTo([latitude, longitude], 13, { duration: 1.5 });
            }

        } catch (error) {
            let message = 'Не удалось получить геолокацию';
            if (error.code === error.PERMISSION_DENIED) {
                message = 'Доступ к геолокации запрещён. Разрешите доступ в настройках браузера.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                message = 'Информация о местоположении недоступна.';
            } else if (error.code === error.TIMEOUT) {
                message = 'Превышено время ожидания геолокации.';
            }
            alert(message);
        } finally {
            geoBtn.classList.remove('map-controls__btn--loading');
            geoBtn.style.pointerEvents = 'auto';
        }
    });
}

function initTabs() {
    const tabs = document.querySelectorAll('.map-tabs__tab');
    if (!tabs.length) return;

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            tabs.forEach((t) => t.classList.remove('map-tabs__tab--active'));
            tab.classList.add('map-tabs__tab--active');
            mapData.activeTab = tab.textContent.trim().toLowerCase().includes('симптом') ? 'symptoms' : 'pollen';
            toggleMapContent();
        });
    });
}

function toggleMapContent() {
    // Ищем контейнер самой карты (.map), а не внешнюю обертку (.map-area)
    const mapContainer = document.querySelector('.map'); 
    if (!mapContainer) return;

    let placeholder = mapContainer.querySelector('.map-placeholder');
    
    if (mapData.activeTab === 'symptoms') {
        // 1. Скрываем карту Leaflet
        const leafletContainer = mapContainer.querySelector('.leaflet-container');
        if (leafletContainer) leafletContainer.style.display = 'none';
        
        // 2. Скрываем UI элементы карты (легенда, локация, зум)
        const mapUIElements = mapContainer.querySelectorAll('.map-legend, .map-location, .map-controls');
        mapUIElements.forEach(el => el.style.display = 'none');
        
        // 3. Показываем или создаем заглушку
        if (!placeholder) {
            placeholder = document.createElement('div');
            placeholder.className = 'map-placeholder';
            placeholder.innerHTML = `
                <div class="map-placeholder__content">
                    <img class="map-placeholder__icon" src="${placeholderImg}" alt="Карта в разработке">
                    <h3 class="map-placeholder__title">Карта симптомов в разработке</h3>
                    <p class="map-placeholder__text">Этот раздел скоро будет доступен.</p>
                </div>
            `;
            mapContainer.appendChild(placeholder);
        } else {
            placeholder.style.display = 'flex';
        }
    } else {
        // 1. Показываем карту Leaflet
        const leafletContainer = mapContainer.querySelector('.leaflet-container');
        if (leafletContainer) leafletContainer.style.display = 'block';
        
        // 2. Показываем UI элементы
        const mapUIElements = mapContainer.querySelectorAll('.map-legend, .map-location, .map-controls');
        mapUIElements.forEach(el => el.style.display = '');
        
        // 3. Удаляем заглушку
        if (placeholder) {
            placeholder.remove();
        }
        
        // 4. Пересчитываем размеры карты Leaflet, чтобы тайлы не "поехали" после скрытия
        if (mapData.leafletMap) {
            setTimeout(() => mapData.leafletMap.invalidateSize(), 100);
        }
    }
}

function initAllergenSelector() {
    const buttons = document.querySelectorAll('.pollen-selector__btn');
    if (!buttons.length) return;

    buttons.forEach((btn) => {
        btn.setAttribute('aria-pressed', btn.textContent.trim() === mapData.selectedAllergen);
        btn.addEventListener('click', () => {
            buttons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
            btn.setAttribute('aria-pressed', 'true');
            mapData.selectedAllergen = btn.textContent.trim();
            updateAllergenLabel();
            addPollenMarkers();
        });
    });
}

function updateAllergenLabel() {
    const el = document.querySelector('.map-legend__concentration-label');
    if (el) el.textContent = `Концентрация: ${mapData.selectedAllergen}`;
}

async function geocodeAndFlyTo(city) {
    if (!mapData.leafletMap) return;
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1&accept-language=ru`
        );
        if (!response.ok) return;
        const data = await response.json();
        if (data && data.length > 0) {
            mapData.leafletMap.flyTo([parseFloat(data[0].lat), parseFloat(data[0].lon)], 12, { duration: 1.5 });
        }
    } catch (error) {
        console.error('map.js: ошибка геокодирования города:', error);
    }
}