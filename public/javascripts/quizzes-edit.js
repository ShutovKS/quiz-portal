// quizzes-edit.js

document.addEventListener('DOMContentLoaded', function () {
    const questionModal = new bootstrap.Modal(document.getElementById('questionModal'));
    const questionFormContainer = document.getElementById('questionFormContainer');
    const questionFormMsg = document.getElementById('questionFormMsg');
    const addQuestionBtn = document.getElementById('addQuestionBtn');

    // Открыть модалку для добавления вопроса
    addQuestionBtn.addEventListener('click', function (e) {
        e.preventDefault();
        loadQuestionForm();
        document.getElementById('questionModalTitle').textContent = 'Добавить вопрос';
        questionModal.show();
    });

    // Делегируем submit формы вопроса
    questionFormContainer.addEventListener('submit', async function (e) {
        if (e.target && e.target.id === 'questionForm') {
            e.preventDefault();
            const form = e.target;
            const quizId = form.dataset.quizId;
            const questionId = form.dataset.questionId;
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            let url = `/api/quizzes/${quizId}/questions`;
            let method = 'POST';
            if (questionId) {
                url += `/${questionId}`;
                method = 'PUT';
            }
            try {
                const res = await fetch(url, {
                    method,
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data)
                });
                if (!res.ok) throw new Error('Ошибка при сохранении вопроса');
                // Можно обновить список вопросов на странице через fetch или location.reload()
                location.reload();
            } catch (err) {
                questionFormMsg.textContent = err.message;
                questionFormMsg.className = 'alert alert-danger';
            }
        }
    });

    // Открытие модалки для редактирования вопроса
    document.querySelectorAll('.edit-question-btn').forEach(btn => {
        btn.addEventListener('click', async function (e) {
            e.preventDefault();
            const quizId = btn.dataset.quizId;
            const questionId = btn.dataset.questionId;
            // Получить данные вопроса через API
            try {
                const res = await fetch(`/api/quizzes/${quizId}/questions/${questionId}`);
                if (!res.ok) throw new Error('Ошибка загрузки вопроса');
                const question = await res.json();
                loadQuestionForm(question);
                document.getElementById('questionModalTitle').textContent = 'Редактировать вопрос';
                questionModal.show();
            } catch (err) {
                alert(err.message);
            }
        });
    });

    // Функция для загрузки формы (с данными или пустой)
    function loadQuestionForm(question = null) {
        // Можно сделать через fetch партиала, но для простоты — просто обновим значения
        const form = questionFormContainer.querySelector('#questionForm');
        form.reset();
        form.dataset.questionId = question?._id || '';
        form.querySelector('[name="text"]').value = question?.text || '';
        form.querySelector('[name="type"]').value = question?.type || 'single';
        // TODO: динамика для вариантов ответа
    }

    // === OPTIONS LOGIC ===
    // Делегируем клики по кнопкам вариантов ответа
    document.body.addEventListener('click', async function (e) {
        // Редактировать вариант
        if (e.target.closest('.edit-option-btn')) {
            const btn = e.target.closest('.edit-option-btn');
            const quizId = btn.dataset.quizId;
            const questionId = btn.dataset.questionId;
            const optionId = btn.dataset.optionId;
            const optionTextSpan = btn.parentElement.querySelector('.option-text');
            const oldText = optionTextSpan.textContent;
            // Получаем тип вопроса
            const container = btn.closest('.options-list');
            const qType = container?.closest('.accordion-body')?.querySelector('[data-question-id]')?.getAttribute('data-question-type');
            if (qType === 'truefalse' || qType === 'text') return; // запрещаем
            // Показываем инпут для редактирования
            const input = document.createElement('input');
            input.type = 'text';
            input.value = oldText;
            input.className = 'form-control form-control-sm me-2';
            optionTextSpan.replaceWith(input);
            input.focus();
            // Сохраняем по Enter или blur
            input.addEventListener('keydown', async ev => {
                if (ev.key === 'Enter') {
                    await saveOptionEdit();
                }
            });
            input.addEventListener('blur', saveOptionEdit);
            async function saveOptionEdit() {
                const newText = input.value.trim();
                if (!newText || newText === oldText) {
                    input.replaceWith(optionTextSpan);
                    return;
                }
                try {
                    const res = await fetch(`/api/quizzes/${quizId}/questions/${questionId}/options/${optionId}`, {
                        method: 'PUT',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({text: newText})
                    });
                    if (!res.ok) throw new Error('Ошибка при сохранении варианта');
                    const updatedQuestion = await res.json();
                    updateOptionsListDOM(updatedQuestion, quizId);
                } catch (err) {
                    alert(err.message);
                    input.replaceWith(optionTextSpan);
                }
            }
        }
        // Удалить вариант
        if (e.target.closest('.delete-option-btn')) {
            const btn = e.target.closest('.delete-option-btn');
            const quizId = btn.dataset.quizId;
            const questionId = btn.dataset.questionId;
            const optionId = btn.dataset.optionId;
            // Получаем тип вопроса
            const container = btn.closest('.options-list');
            const qType = container?.closest('.accordion-body')?.querySelector('[data-question-id]')?.getAttribute('data-question-type');
            if (qType === 'truefalse' || qType === 'text') return; // запрещаем
            if (!confirm('Удалить этот вариант?')) return;
            try {
                const res = await fetch(`/api/quizzes/${quizId}/questions/${questionId}/options/${optionId}`, {
                    method: 'DELETE'
                });
                if (!res.ok) throw new Error('Ошибка при удалении варианта');
                // Получаем обновлённый вопрос
                const resQ = await fetch(`/api/quizzes/${quizId}/questions/${questionId}`);
                const updatedQuestion = await resQ.json();
                updateOptionsListDOM(updatedQuestion, quizId);
            } catch (err) {
                alert(err.message);
            }
        }
        // Добавить вариант
        if (e.target.closest('.add-option-btn')) {
            const btn = e.target.closest('.add-option-btn');
            const quizId = btn.dataset.quizId;
            const questionId = btn.dataset.questionId;
            // Получаем тип вопроса
            const container = btn.closest('.options-list');
            const qType = container?.closest('.accordion-body')?.querySelector('[data-question-id]')?.getAttribute('data-question-type');
            if (qType === 'truefalse' || qType === 'text') return; // запрещаем
            // Показываем инпут для нового варианта
            const li = document.createElement('li');
            li.className = 'd-flex align-items-center mb-1';
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'form-control form-control-sm me-2';
            input.placeholder = 'Текст варианта';
            li.appendChild(input);
            const saveBtn = document.createElement('button');
            saveBtn.type = 'button';
            saveBtn.className = 'btn btn-sm btn-success';
            saveBtn.innerHTML = '<i class="bi bi-check"></i>';
            li.appendChild(saveBtn);
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'btn btn-sm btn-secondary ms-1';
            cancelBtn.innerHTML = '<i class="bi bi-x"></i>';
            li.appendChild(cancelBtn);
            // Вставляем в ul, если он есть, иначе создаём ul
            let ul = btn.parentElement.querySelector('ul');
            if (!ul) {
                ul = document.createElement('ul');
                ul.className = 'list-unstyled mb-0 small';
                btn.parentElement.insertBefore(ul, btn);
            }
            ul.appendChild(li);
            input.focus();
            saveBtn.addEventListener('click', saveNewOption);
            input.addEventListener('keydown', ev => { if (ev.key === 'Enter') saveNewOption(); });
            cancelBtn.addEventListener('click', () => li.remove());
            async function saveNewOption() {
                const text = input.value.trim();
                if (!text) return;
                try {
                    const res = await fetch(`/api/quizzes/${quizId}/questions/${questionId}/options`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({text})
                    });
                    if (!res.ok) throw new Error('Ошибка при добавлении варианта');
                    const updatedQuestion = await res.json();
                    updateOptionsListDOM(updatedQuestion, quizId);
                } catch (err) {
                    alert(err.message);
                }
            }
        }
        // Переключить правильность варианта
        if (e.target.closest('.toggle-correct-btn')) {
            const btn = e.target.closest('.toggle-correct-btn');
            const quizId = btn.dataset.quizId;
            const questionId = btn.dataset.questionId;
            const optionId = btn.dataset.optionId;
            // Получаем тип вопроса
            const container = btn.closest('.options-list');
            const qType = container?.closest('.accordion-body')?.querySelector('[data-question-id]')?.getAttribute('data-question-type');
            // Для single: разрешить только один правильный
            if (qType === 'single') {
                // Сначала снять правильность со всех, потом отметить выбранный
                try {
                    // Получаем вопрос
                    const resQ = await fetch(`/api/quizzes/${quizId}/questions/${questionId}`);
                    const question = await resQ.json();
                    // Снимаем правильность со всех
                    for (const o of question.options) {
                        if (o.isCorrect && o._id !== optionId) {
                            await fetch(`/api/quizzes/${quizId}/questions/${questionId}/options/${o._id}`, {
                                method: 'PUT',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify({isCorrect: false})
                            });
                        }
                    }
                    // Отмечаем выбранный
                    await fetch(`/api/quizzes/${quizId}/questions/${questionId}/options/${optionId}`, {
                        method: 'PUT',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({isCorrect: true})
                    });
                    // Обновляем DOM
                    const updatedQ = await fetch(`/api/quizzes/${quizId}/questions/${questionId}`).then(r => r.json());
                    updateOptionsListDOM(updatedQ, quizId);
                } catch (err) {
                    alert(err.message);
                }
                return;
            }
            // Для truefalse: разрешить только один правильный (по аналогии с single)
            if (qType === 'truefalse') {
                try {
                    // Получаем вопрос
                    const resQ = await fetch(`/api/quizzes/${quizId}/questions/${questionId}`);
                    const question = await resQ.json();
                    // Снимаем правильность со всех, кроме текущего (должен быть только один другой)
                    for (const o of question.options) {
                         if (o.isCorrect && o._id !== optionId) {
                             await fetch(`/api/quizzes/${quizId}/questions/${questionId}/options/${o._id}`, {
                                 method: 'PUT',
                                 headers: {'Content-Type': 'application/json'},
                                 body: JSON.stringify({isCorrect: false})
                             });
                         }
                    }
                     // Отмечаем выбранный (если он был неправильным)
                     const clickedOption = question.options.find(o => o._id === optionId);
                     if (!clickedOption?.isCorrect) {
                        await fetch(`/api/quizzes/${quizId}/questions/${questionId}/options/${optionId}`, {
                            method: 'PUT',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({isCorrect: true})
                        });
                     }
                    // Обновляем DOM
                    const updatedQ = await fetch(`/api/quizzes/${quizId}/questions/${questionId}`).then(r => r.json());
                    updateOptionsListDOM(updatedQ, quizId);
                } catch (err) {
                    alert(err.message);
                }
                return;
            }
            // Для multiple: просто переключаем
            if (qType === 'multiple') {
                // Определяем текущее состояние
                const isCorrect = btn.querySelector('.bi-check-circle-fill') ? true : false;
                try {
                    const res = await fetch(`/api/quizzes/${quizId}/questions/${questionId}/options/${optionId}`, {
                        method: 'PUT',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({isCorrect: !isCorrect})
                    });
                    if (!res.ok) throw new Error('Ошибка при обновлении правильности');
                    const updatedQuestion = await res.json();
                    updateOptionsListDOM(updatedQuestion, quizId);
                } catch (err) {
                    alert(err.message);
                }
            }
        }
    });

    // Функция для генерации HTML списка вариантов и кнопки "Добавить вариант"
    function renderOptionsList(question, quizId) {
        let html = '';
        if (question.type === 'single' || question.type === 'multiple') {
            if (question.options && question.options.length) {
                html += '<ul class="list-unstyled mb-0 small">';
                question.options.forEach(o => {
                    html += `<li class="d-flex align-items-center mb-1">
                        <button type="button" class="btn btn-sm toggle-correct-btn me-1" data-quiz-id="${quizId}" data-question-id="${question._id}" data-option-id="${o._id}" title="Сделать правильным/неправильным">`;
                    if (o.isCorrect) {
                        html += '<i class="bi bi-check-circle-fill text-success"></i>';
                    } else {
                        html += '<i class="bi bi-circle"></i>';
                    }
                    html += `</button>
                        <span class="option-text flex-grow-1">${o.text}</span>
                        <button type="button" class="btn btn-sm btn-link edit-option-btn" data-quiz-id="${quizId}" data-question-id="${question._id}" data-option-id="${o._id}" title="Редактировать вариант">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-link text-danger delete-option-btn" data-quiz-id="${quizId}" data-question-id="${question._id}" data-option-id="${o._id}" title="Удалить вариант">
                            <i class="bi bi-trash"></i>
                        </button>
                    </li>`;
                });
                html += '</ul>';
            }
            html += `<button type="button" class="btn btn-sm btn-outline-primary mt-2 add-option-btn" data-quiz-id="${quizId}" data-question-id="${question._id}">
                <i class="bi bi-plus"></i> Добавить вариант
            </button>`;
        } else if (question.type === 'truefalse') {
            html += '<ul class="list-unstyled mb-0 small">';
            html += [
                {text: 'Верно', idx: 0},
                {text: 'Неверно', idx: 1}
            ].map(({text, idx}) => {
                const o = question.options?.[idx] || {};
                return `<li class="d-flex align-items-center mb-1">
                    <button type="button" class="btn btn-sm toggle-correct-btn me-1" data-quiz-id="${quizId}" data-question-id="${question._id}" data-option-id="${o._id || ''}" title="Сделать правильным/неправильным">${o.isCorrect ? '<i class=\"bi bi-check-circle-fill text-success\"></i>' : '<i class=\"bi bi-circle\"></i>'}</button>
                    <span class="option-text flex-grow-1">${text}</span>
                </li>`;
            }).join('');
            html += '</ul>';
        }
        // для text ничего не рендерим
        return html;
    }

    // Функция для обновления DOM options-list
    function updateOptionsListDOM(question, quizId) {
        const container = document.querySelector(`.options-list[data-question-id="${question._id}"]`);
        if (container) {
            container.innerHTML = renderOptionsList(question, quizId);
        }
    }
}); 