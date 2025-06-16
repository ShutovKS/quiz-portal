// public/javascripts/quiz-edit.js
// Логика для страницы редактирования квиза и вопросов

// Bootstrap modal
let questionModal;
document.addEventListener('DOMContentLoaded', function () {
    // Инициализация Bootstrap Modal
    const modalEl = document.getElementById('questionModal');
    if (modalEl) questionModal = new bootstrap.Modal(modalEl);

    // Кнопка "Добавить вопрос"
    document.getElementById('addQuestionBtn')?.addEventListener('click', function () {
        openQuestionModal();
    });

    // Кнопки "Редактировать вопрос"
    document.querySelectorAll('.edit-question-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const qid = btn.dataset.questionId;
            const quizId = btn.dataset.quizId;
            fetchQuestion(qid, quizId);
        });
    });

    // Кнопки "Удалить вопрос"
    document.querySelectorAll('.delete-question-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const qid = btn.dataset.questionId;
            const quizId = btn.dataset.quizId;
            if (confirm('Удалить этот вопрос?')) {
                deleteQuestion(qid, quizId);
            }
        });
    });

    // Кнопки "Добавить вариант"
    document.querySelectorAll('.add-option-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const qid = btn.dataset.questionId;
            const quizId = btn.dataset.quizId;
            addOption(qid, quizId);
        });
    });

    // Кнопки "Редактировать вариант"
    document.querySelectorAll('.edit-option-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const qid = btn.dataset.questionId;
            const oid = btn.dataset.optionId;
            const quizId = btn.dataset.quizId;
            editOption(qid, oid, quizId);
        });
    });

    // Кнопки "Удалить вариант"
    document.querySelectorAll('.delete-option-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const qid = btn.dataset.questionId;
            const oid = btn.dataset.optionId;
            const quizId = btn.dataset.quizId;
            if (confirm('Удалить этот вариант?')) {
                deleteOption(qid, oid, quizId);
            }
        });
    });

    // Событие отправки формы вопроса (partial questionForm)
    const qForm = document.getElementById('questionForm');
    if (qForm) {
        qForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitQuestionForm(qForm);
        });
    }
});

// Получить quizId из формы или data-атрибута
function getQuizId() {
    const form = document.getElementById('questionForm');
    return form?.dataset.quizId;
}

// Открыть модалку для добавления/редактирования вопроса
function openQuestionModal(question = {}) {
    const form = document.getElementById('questionForm');
    if (!form) return;
    form.reset();
    form.dataset.questionId = question._id || '';
    form.querySelector('[name="text"]').value = question.text || '';
    form.querySelector('[name="type"]').value = question.type || 'single';

    // Рендер вариантов
    renderOptions(question.options || []);

    // Тип вопроса — при смене типа обновлять варианты
    form.querySelector('[name="type"]').onchange = function (e) {
        renderOptions([]);
    };

    questionModal.show();
}

// Рендер вариантов ответа в DOM (только single/multiple)
function renderOptions(options) {
    const container = document.getElementById('optionsContainer');
    container.innerHTML = '';
    const addBtn = document.getElementById('addOptionBtn');
    addBtn.style.display = '';
    const form = document.getElementById('questionForm');
    const type = form.querySelector('[name="type"]').value;
    options.forEach((opt, idx) => {
        const row = document.createElement('div');
        row.className = 'input-group mb-2';
        let inputType = type === 'single' ? 'radio' : 'checkbox';
        let inputName = type === 'single' ? 'option-correct' : 'option-correct-' + idx;
        row.innerHTML = `
      <input type="text" class="form-control option-text" value="${opt.text || ''}" placeholder="Вариант ответа">
      <span class="input-group-text">
        <input type="${inputType}" class="form-check-input option-correct" name="${inputName}" ${opt.isCorrect ? 'checked' : ''} title="Правильный ответ">
      </span>
      <button type="button" class="btn btn-outline-danger btn-sm remove-option-btn"><i class="bi bi-x"></i></button>
    `;
        // Удаление варианта
        row.querySelector('.remove-option-btn').onclick = () => {
            row.remove();
        };
        // Для radio: при выборе сбрасывать остальные
        if (type === 'single') {
            row.querySelector('.option-correct').onclick = function () {
                container.querySelectorAll('.option-correct').forEach((el, j) => {
                    el.checked = (j === idx);
                });
            };
        }
        container.appendChild(row);
    });
    // Добавление варианта
    addBtn.onclick = () => {
        renderOptions([...getOptionsFromDOM(), {text: '', isCorrect: false}]);
    };
}

// Получить варианты из DOM
function getOptionsFromDOM() {
    const container = document.getElementById('optionsContainer');
    const form = document.getElementById('questionForm');
    const type = form.querySelector('[name="type"]').value;
    return Array.from(container.querySelectorAll('.input-group')).map((row, idx) => {
        const text = row.querySelector('.option-text').value;
        let isCorrect;
        if (type === 'single') {
            // Только один radio может быть выбран
            isCorrect = row.querySelector('.option-correct').checked;
        } else {
            isCorrect = row.querySelector('.option-correct').checked;
        }
        return {text, isCorrect};
    });
}

// Отправка формы вопроса (создание/редактирование)
function submitQuestionForm(form) {
    const quizId = getQuizId();
    const qid = form.dataset.questionId;
    const type = form.querySelector('[name="type"]').value;
    const options = getOptionsFromDOM();
    // Проверка: для типов с вариантами — минимум 2 варианта
    if (["single", "multiple", "truefalse"].includes(type) && options.length < 2) {
        showToast('Добавьте минимум два варианта ответа', 'danger');
        return;
    }
    // Проверка: хотя бы один правильный вариант
    if (["single", "multiple", "truefalse"].includes(type) && !options.some(opt => opt.isCorrect)) {
        showToast('Отметьте хотя бы один правильный вариант ответа', 'danger');
        return;
    }
    const data = {
        text: form.querySelector('[name="text"]').value,
        type,
        options
    };
    let url, method;
    if (qid) {
        url = `/api/${quizId}/questions/${qid}`;
        method = 'PUT';
    } else {
        url = `/api/${quizId}/questions`;
        method = 'POST';
    }
    fetch(url, {
        method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
        .then(res => {
            if (!res.ok) return res.json().then(e => Promise.reject(e));
            return res.json();
        })
        .then(q => {
            updateQuestionInDOM(q);
            questionModal.hide();
            showToast('Вопрос сохранён', 'success');
        })
        .catch(err => showToast(err.details || 'Ошибка при сохранении вопроса', 'danger'));
}

// Обновить вопрос в DOM (или добавить новый)
function updateQuestionInDOM(q) {
    // Для простоты: пока что просто перезагружаем страницу, но можно доработать на динамическое обновление
    location.reload();
}

// Получить вопрос по id и открыть модалку для редактирования
function fetchQuestion(qid, quizId) {
    fetch(`/api/${quizId}/questions/${qid}`)
        .then(res => res.json())
        .then(q => openQuestionModal(q));
}

// Удалить вопрос
function deleteQuestion(qid, quizId) {
    fetch(`/api/${quizId}/questions/${qid}`, {method: 'DELETE'})
        .then(res => {
            if (!res.ok) throw new Error('Ошибка удаления');
            location.reload();
        })
        .catch(() => showToast('Ошибка при удалении вопроса', 'danger'));
}

// Добавить вариант ответа
function addOption(qid, quizId) {
    const text = prompt('Текст варианта:');
    if (!text) return;
    fetch(`/api/${quizId}/questions/${qid}/options`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text})
    })
        .then(res => {
            if (!res.ok) throw new Error('Ошибка добавления');
            location.reload();
        })
        .catch(() => showToast('Ошибка при добавлении варианта', 'danger'));
}

// Редактировать вариант ответа
function editOption(qid, oid, quizId) {
    const text = prompt('Новый текст варианта:');
    if (!text) return;
    fetch(`/api/${quizId}/questions/${qid}/options/${oid}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text})
    })
        .then(res => {
            if (!res.ok) throw new Error('Ошибка редактирования');
            location.reload();
        })
        .catch(() => showToast('Ошибка при редактировании варианта', 'danger'));
}

// Удалить вариант ответа
function deleteOption(qid, oid, quizId) {
    fetch(`/api/${quizId}/questions/${qid}/options/${oid}`, {method: 'DELETE'})
        .then(res => {
            if (!res.ok) throw new Error('Ошибка удаления');
            location.reload();
        })
        .catch(() => showToast('Ошибка при удалении варианта', 'danger'));
}

// Показать toast-уведомление
function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${type} border-0 show mb-2`;
    toast.role = 'alert';
    toast.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
} 