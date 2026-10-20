// ========================================
// МОДАЛЬНОЕ ОКНО "СКАЧАТЬ ОТЧЁТ"
// ========================================

function showReportModal() {
    return new Promise((resolve) => {
        // Удаляем старую модалку, если есть
        const oldOverlay = document.querySelector('.report-modal-overlay');
        if (oldOverlay) oldOverlay.remove();

        const overlay = document.createElement('div');
        overlay.className = 'report-modal-overlay';

        overlay.innerHTML = `
            <div class="report-modal">
                <button class="report-modal__close" type="button" aria-label="Закрыть">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div class="report-modal__body">
                    <div class="report-modal__icon">📊</div>
                    <h3 class="report-modal__title">Отчёт в разработке</h3>
                    <p class="report-modal__message">
                        Приносим свои извинения — функция скачивания отчёта скоро будет доступна.
                        Мы работаем над тем, чтобы вы могли получать подробную статистику по вашему самочувствию.
                    </p>
                </div>
                <div class="report-modal__buttons">
                    <button class="report-modal__btn report-modal__btn--confirm" data-action="confirm">
                        Понятно
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        requestAnimationFrame(() => {
            overlay.classList.add('report-modal-overlay--active');
        });

        const close = () => {
            overlay.classList.remove('report-modal-overlay--active');
            setTimeout(() => {
                overlay.remove();
                document.body.style.overflow = '';
            }, 300);
            resolve(true);
        };

        const closeBtn = overlay.querySelector('button[aria-label="Закрыть"]');
        const confirmBtn = overlay.querySelector('[data-action="confirm"]');

        closeBtn.addEventListener('click', close);
        confirmBtn.addEventListener('click', close);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                close();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}

// ========================================
// ИНИЦИАЛИЗАЦИЯ
// ========================================

export function initReport() {
    const reportBtn = document.querySelector('.download-report');
    if (!reportBtn) return;

    reportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showReportModal();
    });

    console.log('Кнопка "Скачать отчёт" инициализирована');
}