function showAlert(message, type = 'success') {
    let container = document.getElementById('custom-alert-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'custom-alert-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.left = '50%';
        container.style.transform = 'translateX(-50%)';
        container.style.zIndex = '2000';
        document.body.appendChild(container);
    }
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    container.appendChild(alert);
    setTimeout(() => {
        alert.classList.remove('show');
        alert.classList.add('hide');
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.btn-delete-quiz').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const quizId = btn.getAttribute('data-quiz-id');
            if (!quizId) return;
            if (confirm('Вы уверены, что хотите удалить этот квиз? Это действие необратимо.')) {
                fetch(`/quizzes/${quizId}`, {
                    method: 'DELETE',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Content-Type': 'application/json',
                    },
                })
                .then(res => {
                    if (res.ok) {
                        btn.closest('li').remove();
                        showAlert('Квиз успешно удалён!', 'success');
                    } else {
                        return res.text().then(text => { throw new Error(text || 'Ошибка при удалении'); });
                    }
                })
                .catch(err => {
                    showAlert('Ошибка при удалении квиза: ' + err.message, 'danger');
                });
            }
        });
    });

    // Запрет на контекстное меню
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
    // Запрет на выделение текста
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
    });
    // Запрет на drag
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
    });
    // Запрет на копирование, вырезание, вставку
    ['copy', 'cut', 'paste'].forEach(function(evt) {
        document.addEventListener(evt, function(e) {
            e.preventDefault();
        });
    });
    // Запрет на горячие клавиши Ctrl+C, Ctrl+X, Ctrl+V, PrintScreen, F12
    document.addEventListener('keydown', function(e) {
        // Ctrl+C, Ctrl+X, Ctrl+V
        if ((e.ctrlKey || e.metaKey) && ['c', 'x', 'v'].includes(e.key.toLowerCase())) {
            e.preventDefault();
        }
        // PrintScreen (PrtSc)
        if (e.key === 'PrintScreen') {
            e.preventDefault();
        }
        // F12 (инструменты разработчика)
        if (e.key === 'F12') {
            e.preventDefault();
        }
    });
});

// ===== TOASTS =====
window.showToast = function({message, type = 'success', icon = 'bi-check-circle-fill', timeout = 3000}) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast-mint toast-mint-${type}`;
    toast.innerHTML = `<i class="bi ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 400);
    }, timeout);
};

// ===== MINT SPINNER LOADER =====
window.showMintLoader = function() {
    let loader = document.getElementById('mint-spinner');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'mint-spinner';
        loader.className = 'mint-spinner';
        document.body.appendChild(loader);
    }
    loader.style.display = 'block';
};
window.hideMintLoader = function() {
    const loader = document.getElementById('mint-spinner');
    if (loader) loader.style.display = 'none';
};
