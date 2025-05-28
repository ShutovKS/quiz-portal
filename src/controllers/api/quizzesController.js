// src/controllers/api/quizzesController.js
import Quiz from '../../models/Quiz.js';
import Question from '../../models/Question.js';

export const list = async (req, res) => {
    const quizzes = await Quiz.find();
    res.json(quizzes);
};

export const get = async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({error: 'Not found'});
    res.json(quiz);
};

export const create = async (req, res) => {
    const quiz = await Quiz.create({...req.body, user: req.session.userId});
    res.status(201).json(quiz);
};

export const update = async (req, res) => {
    const quizId = req.params.id;
    let update = req.body;
    // Support $addToSet and $pull for categories
    if (update.$addToSet && update.$addToSet.categories) {
        await Quiz.findByIdAndUpdate(quizId, { $addToSet: { categories: update.$addToSet.categories } });
        return res.json({ success: true });
    }
    if (update.$pull && update.$pull.categories) {
        await Quiz.findByIdAndUpdate(quizId, { $pull: { categories: update.$pull.categories } });
        return res.json({ success: true });
    }
    // Fallback: regular update
    const quiz = await Quiz.findByIdAndUpdate(quizId, update, {new: true});
    res.json(quiz);
};

export const remove = async (req, res) => {
    await Quiz.findByIdAndDelete(req.params.id);
    res.status(204).end();
};

export const addQuestion = async (req, res) => {
    const {quizId} = req.params;
    const {text, type} = req.body;
    const question = await Question.create({quiz: quizId, text, type});
    res.status(201).json(question);
};
