import { getTodayString, getDayData } from './storage.js';

// Импортируем картинку для заглушки
const placeholderImg = new URL('../assets/working_map.png', import.meta.url).href;

// Данные для карты
const mapData = {
    currentDate: new Date(),
    activeTab: 'pollen',
    selectedAllergen: 'Берёза',
    allAllergens: ['Берёза', 'Ольха', 'Злаки', 'Дуб', 'Лещина'],
    zoomLevel: 1,
    panX: 0,
    panY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    currentCity: 'Санкт-Петербург',
};

// Районы Санкт-Петербурга
const spbDistricts = [
    'Адмиралтейский', 'Василеостровский', 'Выборгский',
    'Калининский', 'Кировский', 'Колпинский',
    'Красногвардейский', 'Красносельский', 'Кронштадтский',
    'Курортный', 'Московский', 'Невский',
    'Петроградский', 'Приморский', 'Пушкинский',
    'Фрунзенский', 'Центральный'
];

// Форматирование даты
function formatDate(date) {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    return `${dayName}, ${day} ${month}`;
}

// Форматирование времени
function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

export function initMap() {
    if (!document.querySelector('.map-area')) return;
    updateDate();
    initTabs();
    initAllergenSelector();
    initMapDrag();
    initMapControls();
    initSearch(); 
    initGeoButton(); 
    updateMapTransform();
    updateLocationInfo(); 
    console.log('Карта инициализирована');
}

function updateDate() {
    const dateElement = document.querySelector('.date-bar__text');
    if (dateElement) {
        dateElement.textContent = formatDate(mapData.currentDate);
    }
}

// ========================================
// Обновление информации о локации
// ========================================
function updateLocationInfo() {
    const cityEl = document.querySelector('.map-location__city');
    const timeEl = document.querySelector('.map-location__time');
    
    if (cityEl) {
        cityEl.textContent = mapData.currentCity;
    }
    if (timeEl) {
        timeEl.textContent = `Обновлено: ${formatTime(new Date())}`;
    }
}
// ========================================
// Кастомный выпадающий список поиска
// ========================================
function initSearch() {
    const searchInput = document.getElementById('city-search-input');
    const dropdownToggle = document.getElementById('dropdown-toggle');
    const dropdown = document.getElementById('city-dropdown');
    const districtList = document.getElementById('district-list');
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
    function selectCity(city) {
        mapData.currentCity = city;
        searchInput.value = city;
        updateLocationInfo();
        highlightSelectedDistrict(city);
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

// ========================================
// Кнопка геолокации
// ========================================
function initGeoButton() {
    const geoBtn = document.querySelector('.map-controls__btn--geo');
    if (!geoBtn) return;

    geoBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            alert('Геолокация не поддерживается вашим браузером');
            return;
        }

        // Меняем иконку на "загрузку"
        geoBtn.style.opacity = '0.6';
        geoBtn.style.pointerEvents = 'none';

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                console.log('Геолокация:', latitude, longitude);
                
                // Обновляем город на "Моё местоположение"
                mapData.currentCity = 'Моё местоположение';
                updateLocationInfo();
                
                // Возвращаем кнопку в нормальное состояние
                geoBtn.style.opacity = '1';
                geoBtn.style.pointerEvents = 'auto';
                
                // Центрируем карту на текущей позиции
                mapData.panX = 0;
                mapData.panY = 0;
                updateMapTransform();
            },
            (error) => {
                let message = 'Не удалось получить геолокацию';
                if (error.code === error.PERMISSION_DENIED) {
                    message = 'Доступ к геолокации запрещён. Разрешите доступ в настройках браузера.';
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    message = 'Информация о местоположении недоступна';
                } else if (error.code === error.TIMEOUT) {
                    message = 'Превышено время ожидания геолокации';
                }
                alert(message);
                
                geoBtn.style.opacity = '1';
                geoBtn.style.pointerEvents = 'auto';
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

function initTabs() {
    const tabs = document.querySelectorAll('.map-tabs__tab');
    if (!tabs.length) return;

    tabs.forEach((tab) => {
        const tabText = tab.textContent.trim().toLowerCase();
        tab.addEventListener('click', () => {
            tabs.forEach((t) => t.classList.remove('map-tabs__tab--active'));
            tab.classList.add('map-tabs__tab--active');
            if (tabText.includes('симптом')) {
                mapData.activeTab = 'symptoms';
            } else {
                mapData.activeTab = 'pollen';
            }
            toggleMapContent();
        });
    });
}

function toggleMapContent() {
    const mapContainer = document.querySelector('.map');
    if (!mapContainer) return;

    const oldPlaceholder = mapContainer.querySelector('.map-placeholder');
    if (oldPlaceholder) oldPlaceholder.remove();

    if (mapData.activeTab === 'symptoms') {
        const elementsToHide = mapContainer.querySelectorAll(
            '.map__layers, .map__image, .map__vector, .map-legend, .map-location, .map-controls'
        );
        elementsToHide.forEach(el => el.style.display = 'none');

        const placeholder = document.createElement('div');
        placeholder.className = 'map-placeholder';
        placeholder.innerHTML = `
            <div class="map-placeholder__content">
                <img class="map-placeholder__icon" src="${placeholderImg}" alt="Карта в разработке">
                <h3 class="map-placeholder__title">Карта симптомов в разработке</h3>
                <p class="map-placeholder__text">
                    Приносим свои извинения — этот раздел скоро будет доступен.
                    Мы работаем над тем, чтобы вы могли видеть карту симптомов других пользователей.
                </p>
            </div>
        `;
        mapContainer.appendChild(placeholder);
    } else {
        const elementsToShow = mapContainer.querySelectorAll(
            '.map__layers, .map__image, .map__vector, .map-legend, .map-location, .map-controls'
        );
        elementsToShow.forEach(el => el.style.display = '');
    }
}

function initAllergenSelector() {
    const buttons = document.querySelectorAll('.pollen-selector__btn');
    if (!buttons.length) return;

    buttons.forEach((btn) => {
        const allergen = btn.textContent.trim();
        if (allergen === mapData.selectedAllergen) {
            btn.setAttribute('aria-pressed', 'true');
        } else {
            btn.setAttribute('aria-pressed', 'false');
        }
        btn.addEventListener('click', () => {
            buttons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
            btn.setAttribute('aria-pressed', 'true');
            mapData.selectedAllergen = allergen;
            updateAllergenLabel(); // <-- НОВОЕ: обновляем подпись аллергена
            console.log('Выбран аллерген:', mapData.selectedAllergen);
        });
    });
}

// ========================================
// Обновление подписи аллергена в легенде
// ========================================
function updateAllergenLabel() {
    // Находим блок концентрации в легенде карты
    const concentrationEl = document.querySelector('.map-legend__concentration-label');
    if (concentrationEl) {
        concentrationEl.textContent = `Концентрация: ${mapData.selectedAllergen}`;
    }
}

function initMapDrag() {
    const mapArea = document.querySelector('.map');
    if (!mapArea) return;

    mapArea.style.cursor = 'grab';

    mapArea.addEventListener('mousedown', (e) => {
        if (mapData.activeTab !== 'pollen') return;
        mapData.isDragging = true;
        mapData.dragStartX = e.clientX - mapData.panX;
        mapData.dragStartY = e.clientY - mapData.panY;
        mapArea.style.cursor = 'grabbing';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!mapData.isDragging) return;
        mapData.panX = e.clientX - mapData.dragStartX;
        mapData.panY = e.clientY - mapData.dragStartY;
        updateMapTransform();
    });

    document.addEventListener('mouseup', () => {
        if (mapData.isDragging) {
            mapData.isDragging = false;
            mapArea.style.cursor = 'grab';
        }
    });

    mapArea.addEventListener('mouseleave', () => {
        if (mapData.isDragging) {
            mapData.isDragging = false;
            mapArea.style.cursor = 'grab';
        }
    });
}

function initMapControls() {
    const zoomInBtn = document.querySelector('.map-controls__btn--zoom-in');
    const zoomOutBtn = document.querySelector('.map-controls__btn--zoom-out');
    
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            if (mapData.activeTab !== 'pollen') return;
            mapData.zoomLevel = Math.min(mapData.zoomLevel + 0.2, 3);
            updateMapTransform();
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            if (mapData.activeTab !== 'pollen') return;
            mapData.zoomLevel = Math.max(mapData.zoomLevel - 0.2, 0.5);
            updateMapTransform();
        });
    }
}

function updateMapTransform() {
    const mapContainer = document.querySelector('.map');
    if (!mapContainer) return;

    const layers = mapContainer.querySelectorAll('.map__layers, .map__image, .map__vector');
    if (layers.length === 0) return;

    layers.forEach((layer) => {
        layer.style.transform = `translate(${mapData.panX}px, ${mapData.panY}px) scale(${mapData.zoomLevel})`;
        layer.style.transformOrigin = 'center center';
        layer.style.transition = mapData.isDragging ? 'none' : 'transform 0.2s ease';
    });
}