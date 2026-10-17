export function initLanding() {
    // Проверяем, что мы на лендинге
    if (!document.querySelector('.landing-body')) return;

    initMascotInteraction();
    initScrollAnimations();
    initCTAButton();
    initParallaxEffect();
    
    console.log('Лендинг инициализирован');
}

// Интерактивный маскот — следит за курсором
function initMascotInteraction() {
    const mascot = document.querySelector('.landing-mascot__image');
    if (!mascot) return;

    document.addEventListener('mousemove', (e) => {
        const mascotRect = mascot.getBoundingClientRect();
        const mascotCenterX = mascotRect.left + mascotRect.width / 2;
        const mascotCenterY = mascotRect.top + mascotRect.height / 2;

        // Вычисляем угол между маскотом и курсором
        const angle = Math.atan2(e.clientY - mascotCenterY, e.clientX - mascotCenterX);
        
        // Лёгкий наклон маскота в сторону курсора (максимум 10 градусов)
        const tiltX = Math.cos(angle) * 10;
        const tiltY = Math.sin(angle) * 10;

        mascot.style.transform = `translate(${tiltX}px, ${tiltY}px)`;
    });

    // Возврат в исходное положение при уходе мыши
    document.addEventListener('mouseleave', () => {
        mascot.style.transform = 'translate(0, 0)';
    });
}

// Плавное появление элементов при загрузке
function initScrollAnimations() {
    const elements = [
        '.landing-header',
        '.landing-content',
        '.landing-cta',
    ];

    elements.forEach((selector, index) => {
        const element = document.querySelector(selector);
        if (!element) return;

        // Начальное состояние — скрыто
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';

        // Появление с задержкой
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 200 + index * 200);
    });

    // Маскот появляется последним с анимацией
    const mascot = document.querySelector('.landing-mascot');
    if (mascot) {
        mascot.style.opacity = '0';
        mascot.style.transform = 'scale(0.8)';
        mascot.style.transition = 'opacity 1s ease, transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)';

        setTimeout(() => {
            mascot.style.opacity = '1';
            mascot.style.transform = 'scale(1)';
        }, 800);
    }
}

// Анимация кнопки CTA
function initCTAButton() {
    const ctaBtn = document.querySelector('.landing-cta__btn');
    if (!ctaBtn) return;

    // Пульсация каждые 3 секунды
    setInterval(() => {
        ctaBtn.style.transform = 'scale(1.05)';
        setTimeout(() => {
            ctaBtn.style.transform = 'scale(1)';
        }, 300);
    }, 3000);

    // Усиленная анимация при наведении
    ctaBtn.addEventListener('mouseenter', () => {
        ctaBtn.style.transform = 'scale(1.1)';
        ctaBtn.style.boxShadow = '0 8px 24px rgba(94, 214, 162, 0.4)';
    });

    ctaBtn.addEventListener('mouseleave', () => {
        ctaBtn.style.transform = 'scale(1)';
        ctaBtn.style.boxShadow = 'none';
    });

    // Плавный переход на главную страницу
    ctaBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Анимация исчезновения
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '0';
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    });
}

// Параллакс-эффект при скролле (если контент длинный)
function initParallaxEffect() {
    const mascot = document.querySelector('.landing-mascot');
    const content = document.querySelector('.landing-content');
    
    if (!mascot || !content) return;

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        
        // Маскот движется медленнее
        mascot.style.transform = `translateY(${scrolled * 0.3}px)`;
        
        // Контент движется быстрее
        content.style.transform = `translateY(${scrolled * 0.5}px)`;
    });
}