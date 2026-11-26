// Импортируем картинки через Parcel
const likeOutline = new URL('../assets/like.png', import.meta.url).href;
const likeFilled = new URL('../assets/like_checked.png', import.meta.url).href;
const commentOutline = new URL('../assets/add_comment.png', import.meta.url).href;
const commentFilled = new URL('../assets/add_comment_checked.png', import.meta.url).href;

import { api } from './api.js';

// Ключи для localStorage
const POSTS_STORAGE_KEY = 'vremya_tsveti_community_posts';
const LIKES_STORAGE_KEY = 'vremya_tsveti_likes';

const currentUser = {
    name: 'Вы',
    avatarClass: 'post__avatar--a',
    initial: 'В'
};

// Русские посты по теме аллергии (fallback если сервер недоступен)
const RUSSIAN_POSTS = [
    {
        id: 'ru-1',
        author: 'Анна Светлова',
        text: 'Как вы спасаетесь от берёзы? В этом году пыльца просто везде 🌳🤧',
        timestamp: Date.now() - 2 * 3600000,
        likes: 24,
        liked: false
    },
    {
        id: 'ru-2',
        author: 'Максим Котов',
        text: 'Нашёл отличный очиститель воздуха с HEPA-фильтром! Стало намного легче дышать ночью. Всем советую не открывать окна до обеда.',
        timestamp: Date.now() - 5 * 3600000,
        likes: 18,
        liked: false
    },
    {
        id: 'ru-3',
        author: 'Елена П.',
        text: 'Кто-нибудь пробовал солевые пещеры для облегчения симптомов? Есть ли смысл идти в пик цветения берёзы?',
        timestamp: Date.now() - 24 * 3600000,
        likes: 12,
        liked: false
    },
    {
        id: 'ru-4',
        author: 'Игорь Л.',
        text: 'Аллерголог назначил курс АСИТ. Кто проходил — поделитесь опытом, сильно ли помогает в долгосрочной перспективе?',
        timestamp: Date.now() - 2 * 24 * 3600000,
        likes: 31,
        liked: false
    },
    {
        id: 'ru-5',
        author: 'Ольга М.',
        text: 'Сегодня индекс пыльцы зашкаливает. Закрыла все окна, включила кондиционер, приняла цетиризин. Держитесь, друзья! 🌿',
        timestamp: Date.now() - 3 * 24 * 3600000,
        likes: 27,
        liked: false
    }
];

// ========================================
// НОРМАЛИЗАЦИЯ ПОСТОВ (назначение аватаров)
// ========================================
function normalizePost(post) {
    if (!post.avatarClass) {
        // Назначаем цвет аватара на основе имени автора
        const authorInitial = post.author ? post.author[0].toLowerCase() : 'a';
        
        // Распределяем по трём цветам: мятный, жёлтый, красный
        if (['а', 'a', 'е', 'е', 'о', 'о'].includes(authorInitial)) {
            post.avatarClass = 'post__avatar--a'; // мятный
        } else if (['м', 'm', 'и', 'и', 'д', 'д'].includes(authorInitial)) {
            post.avatarClass = 'post__avatar--m'; // жёлтый
        } else {
            post.avatarClass = 'post__avatar--e'; // красный
        }
    }
    
    // Добавляем инициал если нет
    if (!post.initial) {
        post.initial = post.author ? post.author[0] : '?';
    }
    
    return post;
}

// ========================================
// ИНИЦИАЛИЗАЦИЯ СООБЩЕСТВА
// ========================================
export async function initCommunity() {
    if (!document.querySelector('.feed__list')) return;

    const feedList = document.querySelector('.feed__list');
    feedList.innerHTML = '<div style="text-align:center;padding:40px;opacity:0.6;">Загружаем ленту…</div>';

    try {
        // Пробуем загрузить с сервера
        let posts = await api.getPosts();
        
        // Если сервер вернул пустой массив или ошибку
        if (!posts || posts.length === 0) {
            // Проверяем localStorage
            const existing = getPostsFromStorage();
            if (existing.length === 0) {
                // Если и в localStorage пусто — используем русские посты
                savePostsToStorage(RUSSIAN_POSTS);
            }
            posts = getPostsFromStorage();
        } else {
            // Сохраняем серверные посты в localStorage
            savePostsToStorage(posts);
        }

        // Нормализуем все посты (добавляем avatarClass)
        posts = posts.map(normalizePost);

        // Собираем все посты (из localStorage + серверные)
        const allPosts = collectAllPosts();
        allPosts.sort((a, b) => b.timestamp - a.timestamp);

        // Рендерим
        feedList.innerHTML = '';
        allPosts.forEach(post => {
            feedList.insertAdjacentHTML('beforeend', buildPostHTML(post));
        });

        // Инициализируем интерактивность
        initLikes();
        initComments();
        initFab();
        initHeaderButtons();
        createPostModal();
        createNotificationModal();

        console.log('Сообщество инициализировано, постов:', allPosts.length);
    } catch (error) {
        console.warn('Бэкенд недоступен, используем локальное хранилище:', error);
        
        // Fallback на localStorage
        const existing = getPostsFromStorage();
        if (existing.length === 0) {
            savePostsToStorage(RUSSIAN_POSTS);
        }
        
        const allPosts = collectAllPosts().map(normalizePost);
        allPosts.sort((a, b) => b.timestamp - a.timestamp);
        
        feedList.innerHTML = '';
        allPosts.forEach(post => {
            feedList.insertAdjacentHTML('beforeend', buildPostHTML(post));
        });
        
        initLikes();
        initComments();
        initFab();
        initHeaderButtons();
        createPostModal();
        createNotificationModal();
    }
}

// ========================================
// СБОР ВСЕХ ПОСТОВ
// ========================================
function collectAllPosts() {
    const posts = [];
    const seenIds = new Set();
    const savedLikes = getLikesFromStorage();
    const savedPosts = getPostsFromStorage();

    savedPosts.forEach(post => {
        if (!post || typeof post !== 'object') return;
        if (!post.id || seenIds.has(post.id)) return;
        if (!post.text || typeof post.text !== 'string') return;
        if (!post.timestamp || typeof post.timestamp !== 'number') return;

        // Восстанавливаем лайки
        const likeState = savedLikes[post.id];
        if (likeState) {
            post.liked = likeState.liked;
            post.likes = likeState.count;
        }

        // Нормализуем (добавляем avatarClass если нет)
        normalizePost(post);

        posts.push({
            ...post,
            time: getRelativeTime(post.timestamp)
        });
        seenIds.add(post.id);
    });

    return posts;
}

// ========================================
// СОХРАНЕНИЕ И ЗАГРУЗКА ПОСТОВ
// ========================================
function savePostsToStorage(posts) {
    try {
        localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
    } catch (e) {
        console.error('community.js: ошибка сохранения постов:', e);
    }
}

function getPostsFromStorage() {
    try {
        const raw = localStorage.getItem(POSTS_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            console.warn('community.js: данные постов повреждены, очищаем');
            localStorage.removeItem(POSTS_STORAGE_KEY);
            return [];
        }
        return parsed;
    } catch (e) {
        console.error('community.js: ошибка парсинга постов:', e);
        localStorage.removeItem(POSTS_STORAGE_KEY);
        return [];
    }
}

// ========================================
// СОХРАНЕНИЕ И ЗАГРУЗКА ЛАЙКОВ
// ========================================
function getLikesFromStorage() {
    try {
        return JSON.parse(localStorage.getItem(LIKES_STORAGE_KEY)) || {};
    } catch {
        return {};
    }
}

function saveLikeToStorage(postId, isLiked, count) {
    const likes = getLikesFromStorage();
    likes[postId] = { liked: isLiked, count };
    localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(likes));
}

// ========================================
// ВЫЧИСЛЕНИЕ ОТНОСИТЕЛЬНОГО ВРЕМЕНИ
// ========================================
function getRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const MS_IN_MINUTE = 60 * 1000;
    const MS_IN_HOUR = 60 * MS_IN_MINUTE;
    const MS_IN_DAY = 24 * MS_IN_HOUR;
    const MS_IN_WEEK = 7 * MS_IN_DAY;

    if (diff < MS_IN_MINUTE) return 'Только что';
    if (diff < MS_IN_HOUR) {
        const minutes = Math.floor(diff / MS_IN_MINUTE);
        return `${minutes} ${getMinutesWord(minutes)} назад`;
    }
    if (diff < MS_IN_DAY) {
        const hours = Math.floor(diff / MS_IN_HOUR);
        return `${hours} ${getHoursWord(hours)} назад`;
    }
    if (diff < MS_IN_WEEK) {
        const days = Math.floor(diff / MS_IN_DAY);
        return `${days} ${getDaysWord(days)} назад`;
    }
    const date = new Date(timestamp);
    const dayNum = date.getDate();
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return `${dayNum} ${months[date.getMonth()]}`;
}

function getMinutesWord(n) {
    if (n % 10 === 1 && n % 100 !== 11) return 'минуту';
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'минуты';
    return 'минут';
}

function getHoursWord(n) {
    if (n % 10 === 1 && n % 100 !== 11) return 'час';
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'часа';
    return 'часов';
}

function getDaysWord(n) {
    if (n % 10 === 1 && n % 100 !== 11) return 'день';
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'дня';
    return 'дней';
}

// ========================================
// РЕНДЕР ПОСТА
// ========================================
function buildPostHTML(post) {
    const likeSrc = post.liked ? likeFilled : likeOutline;
    const initial = post.initial || post.author?.[0] || '?';
    const avatarClass = post.avatarClass || 'post__avatar--a';
    
    return `
        <article class="post" data-post-id="${post.id}" data-timestamp="${post.timestamp}">
            <div class="post__header">
                <div class="post__avatar ${avatarClass}">${initial}</div>
                <div class="post__meta">
                    <div class="post__author">${escapeHTML(post.author || 'Неизвестно')}</div>
                    <div class="post__time">${escapeHTML(post.time)}</div>
                </div>
            </div>
            <div class="post__content">
                <p class="post__text">${escapeHTML(post.text)}</p>
            </div>
            <div class="post__actions">
                <button class="post__like-btn ${post.liked ? 'post__like-btn--active' : ''}" type="button">
                    <img class="post__like-icon" src="${likeSrc}" width="20" height="20">
                    <span class="post__like-count">${post.likes || 0}</span>
                </button>
                <button class="post__comment-btn" type="button">
                    <img class="post__comment-icon" src="${commentOutline}" width="20" height="20">
                    <span class="post__comment-count">0 комментариев</span>
                </button>
            </div>
        </article>
    `;
}

// ========================================
// ЛАЙКИ
// ========================================
function initLikes() {
    const feedList = document.querySelector('.feed__list');
    if (!feedList) return;

    feedList.addEventListener('click', async (e) => {
        const likeBtn = e.target.closest('.post__like-btn');
        if (!likeBtn) return;
        e.preventDefault();

        const postId = likeBtn.closest('.post').dataset.postId;
        const countEl = likeBtn.querySelector('.post__like-count');
        const imgEl = likeBtn.querySelector('.post__like-icon');
        const isCurrentlyLiked = likeBtn.classList.contains('post__like-btn--active');
        
        const newLiked = !isCurrentlyLiked;
        const newCount = newLiked ? (parseInt(countEl.textContent) || 0) + 1 : Math.max(0, (parseInt(countEl.textContent) || 0) - 1);

        if (newLiked) {
            likeBtn.classList.add('post__like-btn--active');
            imgEl.src = likeFilled;
        } else {
            likeBtn.classList.remove('post__like-btn--active');
            imgEl.src = likeOutline;
        }
        countEl.textContent = newCount;

        // Сохраняем в localStorage
        saveLikeToStorage(postId, newLiked, newCount);

        // Отправляем на сервер (если доступен)
        try {
            await api.toggleLike(postId);
        } catch (error) {
            console.warn('Не удалось обновить лайк на сервере:', error);
        }
    });
}

// ========================================
// КОММЕНТАРИИ
// ========================================
function initComments() {
    const feedList = document.querySelector('.feed__list');
    if (!feedList) return;

    feedList.addEventListener('click', (e) => {
        if (e.target.closest('.post__comment-btn')) {
            e.preventDefault();
            showNotificationModal(
                'Раздел в разработке',
                'Приносим свои извинения — комментарии скоро будут доступны. Мы работаем над тем, чтобы вы могли отвечать на посты других пользователей и делиться опытом.'
            );
        }
    });
}

// ========================================
// FAB
// ========================================
function initFab() {
    const fab = document.querySelector('.fab');
    if (!fab) return;
    fab.addEventListener('click', () => openPostModal());
}

// ========================================
// КНОПКИ В ШАПКЕ
// ========================================
function initHeaderButtons() {
    const searchBtn = document.querySelector('.page-header__btn[aria-label="Поиск"]');
    const filterBtn = document.querySelector('.page-header__btn[aria-label="Фильтры"]');
    const createBtn = document.querySelector('.page-header__btn[aria-label="Добавить комментарий"]');

    if (searchBtn) searchBtn.addEventListener('click', openSearchModal);
    if (filterBtn) filterBtn.addEventListener('click', openFilterModal);
    if (createBtn) createBtn.addEventListener('click', () => openPostModal());
}

// ========================================
// МОДАЛКА ПОИСКА
// ========================================
function openSearchModal() {
    const old = document.querySelector('.community-search-overlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.className = 'community-search-overlay';
    overlay.innerHTML = `
        <div class="community-search-modal">
            <button class="community-search-modal__close" type="button" aria-label="Закрыть">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <h3 class="community-search-modal__title">Поиск по постам</h3>
            <input 
                type="text" 
                class="community-search-modal__input" 
                id="community-search-input"
                placeholder="Введите слова для поиска..."
                autocomplete="off"
            >
            <div class="community-search-modal__results" id="community-search-results">
                <p class="community-search-modal__empty">Начните вводить запрос</p>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => overlay.classList.add('community-search-overlay--active'));

    const input = overlay.querySelector('#community-search-input');
    const results = overlay.querySelector('#community-search-results');

    setTimeout(() => input.focus(), 100);

    input.addEventListener('input', () => {
        const query = input.value.trim();
        if (!query) {
            results.innerHTML = '<p class="community-search-modal__empty">Начните вводить запрос</p>';
            return;
        }
        const found = searchPosts(query);
        renderSearchResults(results, found);
    });

    const close = () => {
        overlay.classList.remove('community-search-overlay--active');
        setTimeout(() => {
            overlay.remove();
            document.body.style.overflow = '';
        }, 300);
    };

    overlay.querySelector('.community-search-modal__close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    const handleEsc = (e) => {
        if (e.key === 'Escape') { close(); document.removeEventListener('keydown', handleEsc); }
    };
    document.addEventListener('keydown', handleEsc);
}

function searchPosts(query) {
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const posts = document.querySelectorAll('.post');
    const results = [];

    posts.forEach((post) => {
        const textEl = post.querySelector('.post__text');
        if (!textEl) return;
        const text = textEl.textContent.toLowerCase();
        const allWordsFound = words.every(word => text.includes(word));
        if (allWordsFound) {
            results.push({
                id: post.dataset.postId,
                text: textEl.textContent,
                author: post.querySelector('.post__author')?.textContent || 'Неизвестно',
                time: post.querySelector('.post__time')?.textContent || '',
            });
        }
    });

    return results;
}

function renderSearchResults(container, results) {
    if (results.length === 0) {
        container.innerHTML = '<p class="community-search-modal__empty">Ничего не найдено</p>';
        return;
    }

    container.innerHTML = results
        .map((r) => `
            <div class="community-search-result" data-post-id="${escapeHTML(r.id)}">
                <div class="community-search-result__icon">📝</div>
                <div class="community-search-result__info">
                    <div class="community-search-result__text">${escapeHTML(r.text)}</div>
                    <div class="community-search-result__meta">${escapeHTML(r.author)} • ${escapeHTML(r.time)}</div>
                </div>
            </div>
        `)
        .join('');

    container.querySelectorAll('.community-search-result').forEach((el) => {
        el.addEventListener('click', () => {
            const postId = el.dataset.postId;
            const post = document.querySelector(`[data-post-id="${postId}"]`);
            if (post) {
                post.scrollIntoView({ behavior: 'smooth', block: 'center' });
                post.style.transition = 'background 0.3s';
                post.style.background = '#eef9f3';
                setTimeout(() => { post.style.background = ''; }, 2000);
            }
            el.closest('.community-search-overlay').querySelector('.community-search-modal__close').click();
        });
    });
}

// ========================================
// МОДАЛКА ФИЛЬТРОВ ПО ДАТЕ
// ========================================
function openFilterModal() {
    const old = document.querySelector('.community-filter-overlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.className = 'community-filter-overlay';
    overlay.innerHTML = `
        <div class="community-filter-modal">
            <button class="community-filter-modal__close" type="button" aria-label="Закрыть">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <h3 class="community-filter-modal__title">Фильтр по дате</h3>
            <div class="community-filter-chips">
                <button class="community-filter-chip community-filter-chip--active" data-filter="all" type="button">Все</button>
                <button class="community-filter-chip" data-filter="today" type="button">Сегодня</button>
                <button class="community-filter-chip" data-filter="yesterday" type="button">Вчера</button>
                <button class="community-filter-chip" data-filter="week" type="button">За неделю</button>
                <button class="community-filter-chip" data-filter="month" type="button">За месяц</button>
            </div>
            <div class="community-filter-modal__actions">
                <button class="community-filter-btn community-filter-btn--reset" id="community-filter-reset" type="button">Сбросить</button>
                <button class="community-filter-btn community-filter-btn--apply" id="community-filter-apply" type="button">Применить</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => overlay.classList.add('community-filter-overlay--active'));

    const chips = overlay.querySelectorAll('.community-filter-chip');
    let selectedFilter = 'all';

    chips.forEach((chip) => {
        chip.addEventListener('click', () => {
            chips.forEach((c) => c.classList.remove('community-filter-chip--active'));
            chip.classList.add('community-filter-chip--active');
            selectedFilter = chip.dataset.filter;
        });
    });

    overlay.querySelector('#community-filter-reset').addEventListener('click', () => {
        restoreAllPosts();
        overlay.querySelector('.community-filter-modal__close').click();
    });

    overlay.querySelector('#community-filter-apply').addEventListener('click', () => {
        applyDateFilter(selectedFilter);
        overlay.querySelector('.community-filter-modal__close').click();
    });

    const close = () => {
        overlay.classList.remove('community-filter-overlay--active');
        setTimeout(() => {
            overlay.remove();
            document.body.style.overflow = '';
        }, 300);
    };

    overlay.querySelector('.community-filter-modal__close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    const handleEsc = (e) => {
        if (e.key === 'Escape') { close(); document.removeEventListener('keydown', handleEsc); }
    };
    document.addEventListener('keydown', handleEsc);
}

function applyDateFilter(filter) {
    const posts = document.querySelectorAll('.post');
    const now = Date.now();
    const MS_IN_DAY = 24 * 60 * 60 * 1000;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartTs = todayStart.getTime();
    const yesterdayStartTs = todayStartTs - MS_IN_DAY;
    const weekStartTs = now - 7 * MS_IN_DAY;
    const monthStartTs = now - 30 * MS_IN_DAY;

    posts.forEach((post) => {
        const timestamp = parseInt(post.dataset.timestamp);
        if (isNaN(timestamp)) {
            post.style.display = '';
            return;
        }

        let show = false;
        switch (filter) {
            case 'all':
                show = true;
                break;
            case 'today':
                show = timestamp >= todayStartTs;
                break;
            case 'yesterday':
                show = timestamp >= yesterdayStartTs && timestamp < todayStartTs;
                break;
            case 'week':
                show = timestamp >= weekStartTs;
                break;
            case 'month':
                show = timestamp >= monthStartTs;
                break;
        }

        post.style.display = show ? '' : 'none';
    });
}

function restoreAllPosts() {
    const posts = document.querySelectorAll('.post');
    posts.forEach((post) => {
        post.style.display = '';
    });
}

// ========================================
// МОДАЛКА СОЗДАНИЯ ПОСТА
// ========================================
function createPostModal() {
    if (document.getElementById('post-modal-overlay')) return;

    const modalHTML = `
        <div class="modal-overlay" id="post-modal-overlay">
            <div class="modal" id="post-modal">
                <button class="modal__close" id="modal-close-btn" type="button" aria-label="Закрыть">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div class="modal__header">
                    <h2 class="modal__title">Новый пост</h2>
                    <p class="modal__subtitle">Расскажите о своём самочувствии или задайте вопрос</p>
                </div>
                <div class="modal__body">
                    <textarea class="modal__textarea" id="modal-textarea" placeholder="Как вы себя чувствуете сегодня?" maxlength="500"></textarea>
                    <div class="modal__counter">
                        <span id="modal-counter-text">0</span> / 500
                    </div>
                </div>
                <div class="modal__footer">
                    <button class="modal__btn modal__btn--cancel" id="modal-cancel-btn" type="button">Отмена</button>
                    <button class="modal__btn modal__btn--submit" id="modal-submit-btn" type="button" disabled>Опубликовать</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const overlay = document.getElementById('post-modal-overlay');
    const closeBtn = document.getElementById('modal-close-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const submitBtn = document.getElementById('modal-submit-btn');
    const textarea = document.getElementById('modal-textarea');
    const counterText = document.getElementById('modal-counter-text');

    closeBtn.addEventListener('click', closePostModal);
    cancelBtn.addEventListener('click', closePostModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closePostModal(); });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('modal-overlay--active')) closePostModal();
    });

    textarea.addEventListener('input', () => {
        const length = textarea.value.trim().length;
        counterText.textContent = textarea.value.length;
        submitBtn.disabled = length === 0;
    });

    submitBtn.addEventListener('click', async () => {
        const text = textarea.value.trim();
        if (!text) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Публикуем…';

        const feedList = document.querySelector('.feed__list');
        const newPost = {
            id: 'post-' + Date.now(),
            text: text,
            author: currentUser.name,
            avatarClass: currentUser.avatarClass,
            initial: currentUser.initial,
            timestamp: Date.now(),
            likes: 0,
            liked: false
        };

        // Сохраняем в localStorage
        const savedPosts = getPostsFromStorage();
        savedPosts.unshift(newPost);
        savePostsToStorage(savedPosts);

        // Рендерим в начало ленты
        if (feedList) {
            feedList.insertAdjacentHTML('afterbegin', buildPostHTML({ ...newPost, time: 'Только что' }));
        }

        // Отправляем на сервер (если доступен)
        try {
            await api.createPost(text);
        } catch (error) {
            console.warn('Не удалось опубликовать на сервере, но пост сохранён локально:', error);
        }

        closePostModal();
    });
}

function openPostModal() {
    const overlay = document.getElementById('post-modal-overlay');
    const textarea = document.getElementById('modal-textarea');
    const submitBtn = document.getElementById('modal-submit-btn');
    if (!overlay) return;

    overlay.classList.add('modal-overlay--active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => textarea.focus(), 100);

    textarea.value = '';
    document.getElementById('modal-counter-text').textContent = '0';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Опубликовать';
}

function closePostModal() {
    const overlay = document.getElementById('post-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('modal-overlay--active');
    document.body.style.overflow = '';
}

// ========================================
// МОДАЛКА УВЕДОМЛЕНИЯ
// ========================================
function createNotificationModal() {
    if (document.getElementById('notification-modal-overlay')) return;

    const modalHTML = `
        <div class="modal-overlay" id="notification-modal-overlay">
            <div class="modal modal--notification" id="notification-modal">
                <button class="modal__close" id="notification-close-btn" type="button" aria-label="Закрыть">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div class="modal__body modal__body--centered">
                    <div class="notification-modal__icon">⚠</div>
                    <h2 class="modal__title modal__title--centered" id="notification-title">Раздел в разработке</h2>
                    <p class="modal__text" id="notification-text">Этот функционал скоро будет доступен.</p>
                </div>
                <div class="modal__footer modal__footer--centered">
                    <button class="modal__btn modal__btn--submit" id="notification-ok-btn" type="button">Понятно</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const overlay = document.getElementById('notification-modal-overlay');
    const closeBtn = document.getElementById('notification-close-btn');
    const okBtn = document.getElementById('notification-ok-btn');

    closeBtn.addEventListener('click', closeNotificationModal);
    okBtn.addEventListener('click', closeNotificationModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeNotificationModal(); });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('modal-overlay--active')) closeNotificationModal();
    });
}

function showNotificationModal(title, text) {
    const overlay = document.getElementById('notification-modal-overlay');
    const titleEl = document.getElementById('notification-title');
    const textEl = document.getElementById('notification-text');
    if (!overlay) return;
    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = text;
    overlay.classList.add('modal-overlay--active');
    document.body.style.overflow = 'hidden';
}

function closeNotificationModal() {
    const overlay = document.getElementById('notification-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('modal-overlay--active');
    document.body.style.overflow = '';
}

// ========================================
// ESCAPE HTML
// ========================================
function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[tag]));
}