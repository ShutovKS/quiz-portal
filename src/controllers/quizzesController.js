// src/controllers/quizzesController.js
import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import Attempt from '../models/Attempt.js';

export const listQuizzes = async (req, res) => {
    const quizzes = await Quiz.find({isPublic: true});
    res.render('pages/quizzes/index', {title: 'Все квизы', quizzes});
};

export const showQuizCreateForm = (req, res) => {
    res.render('pages/quizzes/new', {title: 'Новый квиз'});
};

export const createQuiz = async (req, res) => {
    const {title, description, isPublic} = req.body;
    const quiz = await Quiz.create({
        title, description, isPublic: !!isPublic,
        author: req.session.userId
    });
    // Если вопросы передаются сразу — тут можно их сохранить
    res.redirect(`/quizzes/${quiz._id}`);
};

export const showQuiz = async (req, res) => {
    const quiz = await Quiz.findById(req.params.id).populate('author');
    if (!quiz.isPublic && quiz.author._id.toString() !== req.session.userId) {
        return res.status(403).send('Приватный квиз');
    }
    const questions = await Question.find({quiz: quiz._id});
    res.render('pages/quizzes/show', {title: quiz.title, quiz, questions});
};

export const showQuizEditForm = async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);
    const questions = await Question.find({quiz: quiz._id});
    res.render('pages/quizzes/edit', {title: 'Редактировать квиз', quiz, questions});
};

export const updateQuiz = async (req, res) => {
    await Quiz.findByIdAndUpdate(req.params.id, {
        title: req.body.title,
        description: req.body.description,
        isPublic: !!req.body.isPublic
    });
    // TODO: обновить вопросы при необходимости
    res.redirect(`/quizzes/${req.params.id}`);
};

export const deleteQuiz = async (req, res) => {
    await Quiz.findByIdAndDelete(req.params.id);
    // TODO: каскадно удалить вопросы, результаты, комментарии
    res.redirect('/quizzes');
};

export const submitQuizAnswers = async (req, res) => {
    // TODO: сверить req.body.answers с правильными, посчитать score
    const attempt = await Attempt.create({
        user: req.session.userId,
        quiz: req.params.id,
        // score: …
    });
    res.redirect(`/quizzes/${req.params.id}/result?attempt=${attempt._id}`);
};

export const showQuizResult = async (req, res) => {
    const attempt = await Attempt.findById(req.query.attempt).populate('quiz');
    res.render('pages/quizzes/result', {
        title: `Результат: ${attempt.quiz.title}`,
        attempt
    });
};
