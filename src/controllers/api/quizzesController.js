// src/controllers/api/quizzesController.js
import Quiz from '../../models/Quiz.js';
import Question from '../../models/Question.js';

/** ===== GET /api/quizzes ===== */
export const list = async (req, res) => {
    const quizzes = await Quiz.find();
    res.json(quizzes);
};

/** ===== GET /api/quizzes/:id ===== */
export const get = async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({error: 'Not found'});
    res.json(quiz);
};

/** ===== POST /api/quizzes ===== */
export const create = async (req, res) => {
    const quiz = await Quiz.create({...req.body, user: req.session.userId});
    res.status(201).json(quiz);
};

/** ===== PATCH /api/quizzes/:id ===== */
export const update = async (req, res) => {
    const quizId = req.params.id;
    let update = req.body;
    if (update.$addToSet && update.$addToSet.categories) {
        await Quiz.findByIdAndUpdate(quizId, {$addToSet: {categories: update.$addToSet.categories}});
        return res.json({success: true});
    }
    if (update.$pull && update.$pull.categories) {
        await Quiz.findByIdAndUpdate(quizId, {$pull: {categories: update.$pull.categories}});
        return res.json({success: true});
    }
    const quiz = await Quiz.findByIdAndUpdate(quizId, update, {new: true});
    res.json(quiz);
};

/** ===== DELETE /api/quizzes/:id ===== */
export const remove = async (req, res) => {
    await Quiz.findByIdAndDelete(req.params.id);
    res.status(204).end();
};

/** ===== POST /api/quizzes/:quizId/questions ===== */
export const addQuestion = async (req, res) => {
    const {quizId} = req.params;
    const {text, type} = req.body;
    const question = await Question.create({quiz: quizId, text, type});
    res.status(201).json(question);
};
