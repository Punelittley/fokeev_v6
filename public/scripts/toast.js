
(function() {
    let container = null;

    function ensureContainer() {
        if (!container || !document.body.contains(container)) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    const ICONS = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    };

    window.showToast = function(message, type, duration) {
        type = type || 'success';
        duration = duration || 3500;

        const cont = ensureContainer();

        const toast = document.createElement('div');
        toast.className = 'toast-item toast-' + type;

        const icon = document.createElement('span');
        icon.className = 'toast-icon';
        icon.textContent = ICONS[type] || '';

        const text = document.createElement('span');
        text.textContent = message;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = function() { removeToast(toast); };

        toast.appendChild(icon);
        toast.appendChild(text);
        toast.appendChild(closeBtn);
        cont.appendChild(toast);

        setTimeout(function() { removeToast(toast); }, duration);
    };

    function removeToast(el) {
        if (!el || el._removing) return;
        el._removing = true;
        el.classList.add('toast-hiding');
        setTimeout(function() {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 300);
    }
})();
