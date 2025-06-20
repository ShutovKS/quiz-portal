import Question from '../../models/Question.js';

/** ===== POST /api/questions/:questionId/options ===== */
export const addOption = async (req, res) => {
    const {questionId} = req.params;
    const {text} = req.body;

    try {
        const question = await Question.findById(questionId);
        if (!question) return res.status(404).json({error: 'Question not found'});

        let isCorrect = false;
        if ((question.type === 'single' || question.type === 'multiple') && question.options.length === 0) {
            isCorrect = true;
        }

        question.options.push({text, isCorrect});

        await question.save();
        res.status(201).json(question);

    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Error adding option'});
    }
};

/** ===== PATCH /api/questions/:questionId/options/:optionId ===== */
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

/** ===== DELETE /api/questions/:questionId/options/:optionId ===== */
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

/** ===== GET /api/questions/:questionId ===== */
export const getQuestion = async (req, res) => {
    const {questionId} = req.params;
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({error: 'Question not found'});
    res.json(question);
};

/** ===== POST /api/quizzes/:quizId/questions ===== */
export const addQuestion = async (req, res) => {
    const {quizId} = req.params;
    const {text, type, textCorrectAnswer} = req.body;

    let options = req.body.options || [];
    if (type === 'truefalse') {
        options = [
            {text: 'Верно', isCorrect: false},
            {text: 'Неверно', isCorrect: false},
        ];
    }
    if (type === 'text') {
        if (!textCorrectAnswer || !textCorrectAnswer.trim()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: 'Для текстового вопроса требуется правильный ответ.'
            });
        }
        options = [{text: textCorrectAnswer.trim(), isCorrect: true}];
    }

    if ((type === 'single' || type === 'multiple') && (!options || options.length < 2)) {
        return res.status(400).json({
            error: 'Validation failed',
            details: 'Вопросы этого типа должны иметь минимум 2 варианта ответа.'
        });
    }
    if (type === 'truefalse' && (!options || options.length !== 2)) {
        return res.status(400).json({
            error: 'Validation failed',
            details: 'Вопросы типа truefalse должны иметь ровно 2 варианта ответа.'
        });
    }

    try {
        const question = await Question.create({
            quiz: quizId,
            text,
            type,
            options
        });
        res.status(201).json(question);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Error creating question'});
    }
};

/** ===== PATCH /api/questions/:questionId ===== */
export const updateQuestion = async (req, res) => {
    const {questionId} = req.params;
    const {text, type, textCorrectAnswer} = req.body;

    try {
        const question = await Question.findById(questionId);
        if (!question) return res.status(404).json({error: 'Question not found'});

        if (text !== undefined) question.text = text;

        const oldType = question.type;
        if (type !== undefined) question.type = type; // Обновляем тип

        if (question.type === 'truefalse') {
            question.options = [];
            if (question.options.length === 0) {
                question.options.push({text: 'Верно', isCorrect: false});
                question.options.push({text: 'Неверно', isCorrect: false});
            }
        } else if (question.type === 'text') {
            if (!textCorrectAnswer || !textCorrectAnswer.trim()) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: 'Для текстового вопроса требуется правильный ответ.'
                });
            }
            question.options = [{text: textCorrectAnswer.trim(), isCorrect: true}];
        } else if (question.type !== oldType && (question.type === 'single' || question.type === 'multiple')) {
            if (!question.options || !Array.isArray(question.options)) {
                question.options = [];
            }
        }

        if ((question.type === 'single' || question.type === 'multiple') && (!question.options || question.options.length < 2)) {
            return res.status(400).json({
                error: 'Validation failed',
                details: 'Вопросы этого типа должны иметь минимум 2 варианта ответа.'
            });
        }
        if (question.type === 'truefalse' && (!question.options || question.options.length !== 2)) {
            return res.status(400).json({
                error: 'Validation failed',
                details: 'Вопросы типа truefalse должны иметь ровно 2 варианта ответа.'
            });
        }

        await question.save();
        res.json(question);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Error updating question'});
    }
};

/** ===== DELETE /api/questions/:questionId ===== */
export const deleteQuestion = async (req, res) => {
    const {questionId} = req.params;
    const question = await Question.findByIdAndDelete(questionId);
    if (!question) return res.status(404).json({error: 'Question not found'});
    res.status(204).end();
};
