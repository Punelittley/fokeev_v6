document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.main-header');
    if (!header) return;

    const burger = document.createElement('button');
    burger.className = 'burger-btn';
    burger.setAttribute('aria-label', 'Открыть меню');
    burger.innerHTML = '<span></span><span></span><span></span>';

    const navContainer = header.querySelector('.nav-container');
    navContainer.appendChild(burger);

    const overlay = document.createElement('div');
    overlay.className = 'mobile-nav-overlay';
    overlay.innerHTML = `
        <button type="button" class="mobile-nav-close" aria-label="Закрыть меню">&times;</button>
        <div class="mobile-nav-links">
            <a href="/">Главная</a>
            <a href="/services">Услуги</a>
            <a href="/about">О нас</a>
            <a href="/gallery">Галерея</a>
            <a href="/contacts">Контакты</a>
            <a href="/cart">Корзина</a>
            <a href="/auth" class="btn-main" id="mobile-auth-btn">Войти</a>
        </div>
    `;
    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('.mobile-nav-close');

    const toggleMenu = (show) => {
        const isActive = show !== undefined ? show : !overlay.classList.contains('active');
        burger.classList.toggle('active', isActive);
        overlay.classList.toggle('active', isActive);
        document.body.style.overflow = isActive ? 'hidden' : '';
    };

    burger.addEventListener('click', () => toggleMenu());
    closeBtn.addEventListener('click', () => toggleMenu(false));

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) toggleMenu(false);
    });

    overlay.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => toggleMenu(false));
    });

    function updateMobileAuth() {
        const desktopBtn = document.getElementById('auth-btn-container');
        const mobileBtn = document.getElementById('mobile-auth-btn');
        if (desktopBtn && mobileBtn) {
            const desktopLink = desktopBtn.querySelector('a');
            if (desktopLink) {
                mobileBtn.href = desktopLink.href;
                mobileBtn.textContent = desktopLink.textContent;
                
                if (desktopLink.textContent.includes('Профиль') || desktopLink.textContent.includes('Админ')) {
                    mobileBtn.style.background = 'transparent';
                    mobileBtn.style.color = 'var(--text-main)';
                    mobileBtn.style.border = '1px solid var(--text-main)';
                }
            }
        }
    }

    setInterval(updateMobileAuth, 1000);
});
