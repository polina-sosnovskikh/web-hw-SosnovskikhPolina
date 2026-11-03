// Импортируем картинки через Parcel
const likeOutline = new URL('../assets/like.png', import.meta.url).href;
const likeFilled = new URL('../assets/like_checked.png', import.meta.url).href;
const commentOutline = new URL('../assets/add_comment.png', import.meta.url).href;
const commentFilled = new URL('../assets/add_comment_checked.png', import.meta.url).href;

// Ключ для localStorage
const POSTS_STORAGE_KEY = 'vremya_tsveti_community_posts';

const currentUser = {
    name: 'Вы',
    avatarClass: 'post__avatar--a',
    initial: 'В'
};

export function initCommunity() {
    if (!document.querySelector('.feed__list')) return;
    
    // 1. Собираем все посты (статические из HTML + сохранённые из localStorage)
    const allPosts = collectAllPosts();
    
    // 2. Сортируем: новые сверху (по убыванию timestamp)
    allPosts.sort((a, b) => b.timestamp - a.timestamp);
    
    // 3. Очищаем ленту
    const feedList = document.querySelector('.feed__list');
    feedList.innerHTML = '';
    
    // 4. Вставляем посты в правильном порядке
    allPosts.forEach(post => {
        const postHTML = buildPostHTML(post);
        feedList.insertAdjacentHTML('beforeend', postHTML);
    });
    
    // 5. Инициализируем интерактивность
    initLikes();
    initComments();
    initFab();
    initHeaderButtons();
    createPostModal();
    createNotificationModal();
    
    console.log('Сообщество инициализировано, постов:', allPosts.length);
}

// ========================================
// СБОР ВСЕХ ПОСТОВ (статические + сохранённые)
// ========================================
function collectAllPosts() {
    const posts = [];
    const seenIds = new Set();
    let staticPostCounter = 0;
    
    // 1. Собираем статические посты из HTML
    const staticPosts = document.querySelectorAll('.post');
    staticPosts.forEach(post => {
        // Генерируем id, если его нет
        let id = post.id;
        if (!id) {
            staticPostCounter++;
            id = 'static-post-' + staticPostCounter;
            post.id = id; // Сохраняем в DOM
        }
        
        if (seenIds.has(id)) return;
        
        const timeEl = post.querySelector('.post__time');
        const authorEl = post.querySelector('.post__author');
        const textEl = post.querySelector('.post__text');
        const avatarEl = post.querySelector('.post__avatar');
        const likeBtn = post.querySelector('.post__like-btn');
        const likeCountEl = post.querySelector('.post__like-count');
        
        if (!timeEl || !authorEl || !textEl) return;
        
        // Вычисляем timestamp из текста времени
        const timestamp = parseTimeString(timeEl.textContent.trim());
        
        // Извлекаем класс аватара и инициал
        let avatarClass = 'post__avatar--a';
        let initial = '?';
        if (avatarEl) {
            // Получаем все классы кроме 'post__avatar'
            const classes = avatarEl.className.split(' ').filter(c => c !== 'post__avatar');
            avatarClass = classes.length > 0 ? classes[0] : 'post__avatar--a';
            initial = avatarEl.textContent.trim() || '?';
        }
        
        posts.push({
            id: id,
            author: authorEl.textContent.trim(),
            time: timeEl.textContent.trim(),
            text: textEl.textContent.trim(),
            avatarClass: avatarClass,
            initial: initial,
            timestamp: timestamp,
            likes: parseInt(likeCountEl?.textContent.trim()) || 0,
            liked: likeBtn?.classList.contains('post__like-btn--active') || false
        });
        
        seenIds.add(id);
    });
    
    // 2. Добавляем сохранённые посты из localStorage
    const savedPosts = getPostsFromStorage();
    savedPosts.forEach(post => {
        if (!post || typeof post !== 'object') return;
        if (!post.id || seenIds.has(post.id)) return;
        if (!post.text || typeof post.text !== 'string') return;
        if (!post.timestamp || typeof post.timestamp !== 'number') return;
        
        posts.push({
            ...post,
            time: getRelativeTime(post.timestamp) // Вычисляем актуальное время
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

function buildPostHTML(post) {
    const likeSrc = post.liked ? likeFilled : likeOutline;
    return `
        <article class="post" id="${escapeHTML(post.id)}" data-timestamp="${post.timestamp}">
            <div class="post__header">
                <div class="post__avatar ${escapeHTML(post.avatarClass)}">${escapeHTML(post.initial)}</div>
                <div class="post__meta">
                    <div class="post__author">${escapeHTML(post.author)}</div>
                    <div class="post__time">${escapeHTML(post.time)}</div>
                </div>
            </div>
            <div class="post__content">
                <p class="post__text">${escapeHTML(post.text)}</p>
            </div>
            <div class="post__actions">
                <button class="post__like-btn ${post.liked ? 'post__like-btn--active' : ''}" type="button" aria-label="Нравится">
                    <img class="post__like-icon" src="${likeSrc}" alt="like" width="20" height="20">
                    <span class="post__like-count">${post.likes || 0}</span>
                </button>
                <button class="post__comment-btn" type="button" aria-label="Комментировать">
                    <img class="post__comment-icon" src="${commentOutline}" alt="comment" width="20" height="20">
                    <span class="post__comment-count">0 комментариев</span>
                </button>
            </div>
        </article>
    `;
}

// ========================================
// ПАРСИНГ ВРЕМЕНИ ДЛЯ СТАТИЧЕСКИХ ПОСТОВ
// ========================================
function parseTimeString(timeText) {
    const now = Date.now();
    const lower = timeText.toLowerCase();
    
    if (lower.includes('только что') || lower.includes('just now')) return now - 60000;
    
    const minutesMatch = lower.match(/(\d+)\s*минут/);
    if (minutesMatch) return now - parseInt(minutesMatch[1]) * 60000;
    
    const hoursMatch = lower.match(/(\d+)\s*час/);
    if (hoursMatch) return now - parseInt(hoursMatch[1]) * 3600000;
    
    if (lower.includes('вчера') || lower.includes('yesterday')) return now - 24 * 3600000;
    
    const daysMatch = lower.match(/(\d+)\s*дн/);
    if (daysMatch) return now - parseInt(daysMatch[1]) * 24 * 3600000;
    
    // Если не удалось распарсить — случайное время в последние 2 дня
    return now - Math.floor(Math.random() * 2 * 24 * 3600000);
}

// ========================================
// КНОПКИ В ШАПКЕ СООБЩЕСТВА
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
                id: post.id,
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
            const post = document.getElementById(postId);
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
// ЛАЙКИ
// ========================================
function initLikes() {
    const feedList = document.querySelector('.feed__list');
    if (!feedList) return;
    
    feedList.addEventListener('click', (e) => {
        const likeBtn = e.target.closest('.post__like-btn');
        if (!likeBtn) return;
        e.preventDefault();
        
        const countEl = likeBtn.querySelector('.post__like-count');
        const imgEl = likeBtn.querySelector('.post__like-icon');
        if (!imgEl || !countEl) return;
        
        let count = parseInt(countEl.textContent.trim()) || 0;
        const post = likeBtn.closest('.post');
        
        if (likeBtn.classList.contains('post__like-btn--active')) {
            likeBtn.classList.remove('post__like-btn--active');
            count = Math.max(0, count - 1);
            imgEl.src = likeOutline;
        } else {
            likeBtn.classList.add('post__like-btn--active');
            count = count + 1;
            imgEl.src = likeFilled;
        }
        
        countEl.textContent = count;
        saveLikeState(post, likeBtn.classList.contains('post__like-btn--active'), count);
    });
}

function saveLikeState(post, isLiked, count) {
    if (!post) return;
    const postId = post.id;
    const savedPosts = getPostsFromStorage();
    const postIndex = savedPosts.findIndex(p => p.id === postId);
    
    if (postIndex !== -1) {
        savedPosts[postIndex].liked = isLiked;
        savedPosts[postIndex].likes = count;
        savePostsToStorage(savedPosts);
    }
}

// ========================================
// КОММЕНТАРИИ
// ========================================
function initComments() {
    const feedList = document.querySelector('.feed__list');
    if (!feedList) return;
    feedList.addEventListener('click', (e) => {
        const commentBtn = e.target.closest('.post__comment-btn');
        if (!commentBtn) return;
        e.preventDefault();
        showNotificationModal(
            'Раздел в разработке',
            'Приносим свои извинения — комментарии скоро будут доступны. Мы работаем над тем, чтобы вы могли отвечать на посты других пользователей и делиться опытом.'
        );
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
// МОДАЛКА СОЗДАНИЯ ПОСТА
// ========================================
function createPostModal() {
    const modalHTML = `<div class="modal-overlay" id="post-modal-overlay">
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
    </div>`;
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
    submitBtn.addEventListener('click', () => {
        const text = textarea.value.trim();
        if (text) {
            const feedList = document.querySelector('.feed__list');
            if (feedList) createNewPost(text, feedList);
            closePostModal();
        }
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
    const modalHTML = `<div class="modal-overlay" id="notification-modal-overlay">
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
    </div>`;
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
// СОЗДАНИЕ ПОСТА
// ========================================
function createNewPost(text, feedList) {
    const postId = 'post-' + Date.now();
    const timestamp = Date.now();

    const postObject = {
        id: postId,
        text: text,
        author: currentUser.name,
        avatarClass: currentUser.avatarClass,
        initial: currentUser.initial,
        timestamp: timestamp,
        likes: 0,
        liked: false
    };

    const savedPosts = getPostsFromStorage();
    savedPosts.unshift(postObject);
    savePostsToStorage(savedPosts);

    const postHTML = buildPostHTML({ ...postObject, time: 'Только что' });
    feedList.insertAdjacentHTML('afterbegin', postHTML);
    
    const newPost = document.getElementById(postId);
    if (newPost) {
        newPost.style.animation = 'fadeIn 0.5s ease-out';
    }
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
        "'": '&#39;',
        '"': '&quot;'
    }[tag]));
}