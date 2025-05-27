import Question from '../../models/Question.js';
import Quiz from '../../models/Quiz.js'; // Нужен для addQuestion

// Добавить вариант ответа
export const addOption = async (req, res) => {
    const {questionId} = req.params;
    const {text} = req.body; // isCorrect пока не используем из body при добавлении

    try {
        const question = await Question.findById(questionId);
        if (!question) return res.status(404).json({error: 'Question not found'});

        // Определяем isCorrect для нового варианта:
        // true по умолчанию только для первого варианта в single/multiple вопросах
        let isCorrect = false; // По умолчанию false
        if ((question.type === 'single' || question.type === 'multiple') && question.options.length === 0) {
            isCorrect = true;
        }

        // Добавляем вариант
        question.options.push({text, isCorrect});

        await question.save();
        res.status(201).json(question); // Возвращаем обновленный вопрос

    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Error adding option'});
    }
};

// Редактировать вариант ответа
export const editOption = async (req, res) => {
    const {questionId, optionId} = req.params;
    const {text, isCorrect} = req.body;
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({error: 'Question not found'});
    const option = question.options.id(optionId);
    if (!option) return res.status(404).json({error: 'Option not found'});
    if (typeof text !== 'undefined') option.text = text;
    if (typeof isCorrect !== 'undefined') option.isCorrect = !!isCorrect;
    await question.save();
    res.json(question);
};

// Удалить вариант ответа
export const deleteOption = async (req, res) => {
    const {questionId, optionId} = req.params;
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({error: 'Question not found'});
    const option = question.options.id(optionId);
    if (!option) return res.status(404).json({error: 'Option not found'});
    question.options.pull(optionId);
    await question.save();
    res.status(204).end();
};

export const getQuestion = async (req, res) => {
    const {questionId} = req.params;
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({error: 'Question not found'});
    res.json(question);
};

// Добавить вопрос
export const addQuestion = async (req, res) => {
    const {quizId} = req.params;
    const {text, type, textCorrectAnswer} = req.body;

    // Проверка на truefalse: если тип truefalse, создаем стандартные варианты
    let options = req.body.options || [];
    if (type === 'truefalse') {
        // Удаляем все существующие варианты и добавляем стандартные
        options = [
            {text: 'Верно', isCorrect: false},
            {text: 'Неверно', isCorrect: false},
        ];
    }
    // Для text — правильный ответ обязателен
    if (type === 'text') {
        if (!textCorrectAnswer || !textCorrectAnswer.trim()) {
            return res.status(400).json({error: 'Validation failed', details: 'Для текстового вопроса требуется правильный ответ.'});
        }
        options = [{ text: textCorrectAnswer.trim(), isCorrect: true }];
    }

    // Валидация: для single/multiple должны быть минимум 2 варианта, для truefalse - ровно 2
    if ((type === 'single' || type === 'multiple') && (!options || options.length < 2)) {
         return res.status(400).json({error: 'Validation failed', details: 'Вопросы этого типа должны иметь минимум 2 варианта ответа.'});
    }
     if (type === 'truefalse' && (!options || options.length !== 2)) {
         return res.status(400).json({error: 'Validation failed', details: 'Вопросы типа truefalse должны иметь ровно 2 варианта ответа.'});
     }

    try {
        const question = await Question.create({
            quiz: quizId,
            text,
            type,
            options // Используем обработанные варианты
        });
        res.status(201).json(question);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Error creating question'});
    }
};

// Обновить вопрос (новый контроллер)
export const updateQuestion = async (req, res) => {
    const {questionId} = req.params;
    const {text, type, textCorrectAnswer} = req.body;

    try {
        const question = await Question.findById(questionId);
        if (!question) return res.status(404).json({error: 'Question not found'});

        // Обновляем основные поля
        if (text !== undefined) question.text = text;

        const oldType = question.type; // Сохраняем старый тип
        if (type !== undefined) question.type = type; // Обновляем тип

        // Проверка на truefalse: если тип truefalse, удаляем все старые варианты и создаем стандартные
        if (question.type === 'truefalse') {
            // Удаляем все текущие варианты
            question.options = [];
             // Добавляем стандартные, если их нет
            if (question.options.length === 0) {
                 question.options.push({text: 'Верно', isCorrect: false});
                 question.options.push({text: 'Неверно', isCorrect: false});
            }
        } else if (question.type === 'text') {
             // Если тип text, сохраняем правильный ответ
             if (!textCorrectAnswer || !textCorrectAnswer.trim()) {
                 return res.status(400).json({error: 'Validation failed', details: 'Для текстового вопроса требуется правильный ответ.'});
             }
             question.options = [{ text: textCorrectAnswer.trim(), isCorrect: true }];
        } else if (question.type !== oldType && (question.type === 'single' || question.type === 'multiple') ) {
             // Если тип изменился на single или multiple с text, добавляем пустой массив options если его нет
             if (!question.options || !Array.isArray(question.options)) {
                 question.options = [];
             }
        }

        // Валидация: для single/multiple должны быть минимум 2 варианта, для truefalse - ровно 2
         if ((question.type === 'single' || question.type === 'multiple') && (!question.options || question.options.length < 2)) {
             return res.status(400).json({error: 'Validation failed', details: 'Вопросы этого типа должны иметь минимум 2 варианта ответа.'});
        }
         if (question.type === 'truefalse' && (!question.options || question.options.length !== 2)) {
             return res.status(400).json({error: 'Validation failed', details: 'Вопросы типа truefalse должны иметь ровно 2 варианта ответа.'});
         }

        await question.save();
        res.json(question);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Error updating question'});
    }
}; 