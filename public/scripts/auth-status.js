const SB_URL = 'https://nkxkciqgklvxuwkfzetf.supabase.co';
const SB_KEY = 'sb_publishable_rs_9TBx3FFBZlDmxWK3JtQ_-Y9_izmJ';

if (!window.sbClient) {
    if (window.supabase) {
        window.sbClient = window.supabase.createClient(SB_URL, SB_KEY);
    } else {
        console.error('Supabase library not loaded!');
    }
}

async function updateAuthHeader() {
    const authBtnContainer = document.getElementById('auth-btn-container');
    if (!authBtnContainer) return;

    if (!window.sbClient) return;

    try {
        const { data: { user }, error } = await window.sbClient.auth.getUser();

        if (user && !error) {
            if (user.email === 'admin131@gmail.com' || user.email === 'admin131.gmail.com') {
                const leftNav = document.querySelectorAll('.nav-menu')[0];
                if (leftNav && !document.getElementById('admin-nav-link')) {
                    const li = document.createElement('li');
                    li.id = 'admin-nav-link';
                    li.innerHTML = '<a href="/admin">Админ-панель</a>';
                    leftNav.appendChild(li);
                }
            }

            authBtnContainer.innerHTML = `
                <a href="/profile" class="profile-link-text" style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Профиль</a>
            `;
        } else {
            authBtnContainer.innerHTML = `
                <a href="/auth" class="btn-main">Войти</a>
            `;
        }

        authBtnContainer.classList.remove('auth-btn-loading');
    } catch (e) {
        console.error('Auth check failed:', e);
        authBtnContainer.classList.remove('auth-btn-loading');
    }
}

document.addEventListener('DOMContentLoaded', updateAuthHeader);
