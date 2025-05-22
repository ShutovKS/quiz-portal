import Question from '../../models/Question.js';

// Добавить вариант ответа
export const addOption = async (req, res) => {
    const {questionId} = req.params;
    const {text, isCorrect} = req.body;
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({error: 'Question not found'});
    question.options.push({text, isCorrect: !!isCorrect});
    await question.save();
    res.status(201).json(question);
};

// Редактировать вариант ответа
export const editOption = async (req, res) => {
    const {questionId, optionId} = req.params;
    const {text, isCorrect} = req.body;
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({error: 'Question not found'});
    const option = question.options.id(optionId);
    if (!option) return res.status(404).json({error: 'Option not found'});
    option.text = text;
    option.isCorrect = !!isCorrect;
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
    option.remove();
    await question.save();
    res.status(204).end();
}; 