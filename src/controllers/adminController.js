// src/controllers/adminController.js
import User from '../models/User.js';
import Quiz from '../models/Quiz.js';
import Comment from '../models/Comment.js';
import Attempt from "../models/Attempt.js";
import Question from "../models/Question.js";

export const showDashboard = async (req, res) => {
    const [uCount, qCount, cCount] = await Promise.all([
        User.countDocuments(), Quiz.countDocuments(), Comment.countDocuments()
    ]);
    res.render('pages/admin/dashboard', {title: 'Admin', uCount, qCount, cCount});
};

export const listUsers = async (req, res) => {
    const users = await User.find();
    res.render('pages/admin/users', {title: 'Пользователи', users});
};

// Каскадное удаление юзера
export const deleteUser = async (req, res) => {
    const userId = req.params.id;
    // 1) удалить все квизы автора и связанные с ними сущности
    const quizzes = await Quiz.find({author: userId}).select('_id');
    const quizIds = quizzes.map(q => q._id);
    await Promise.all([
        Question.deleteMany({quiz: {$in: quizIds}}),
        Attempt.deleteMany({quiz: {$in: quizIds}}),
        Comment.deleteMany({quiz: {$in: quizIds}}),
        Quiz.deleteMany({author: userId})
    ]);
    // 2) удалить все попытки и комменты самого юзера
    await Promise.all([
        Attempt.deleteMany({user: userId}),
        Comment.deleteMany({author: userId})
    ]);
    // 3) удалить юзера
    await User.findByIdAndDelete(userId);
    req.flash('success', 'Пользователь и все данные удалены');
    res.redirect('/admin/users');
};

// Переключить роль
export const toggleAdmin = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        req.flash('error', 'Пользователь не найден');
        return res.redirect('/admin/users');
    }
    user.role = user.role === 'admin' ? 'user' : 'admin';
    await user.save();
    req.flash('success', `Роль пользователя "${user.name}" теперь "${user.role}"`);
    res.redirect('/admin/users');
};

export const listQuizzes = async (req, res) => {
    const quizzes = await Quiz.find().populate('author');
    res.render('pages/admin/quizzes', {title: 'Квизы', quizzes});
};

// listQuizzes, deleteQuiz — можно оставить или добавить flash-сообщения
export const deleteQuiz = async (req, res) => {
    const quizId = req.params.id;
    // каскадное удаление
    await Promise.all([
        Question.deleteMany({quiz: quizId}),
        Attempt.deleteMany({quiz: quizId}),
        Comment.deleteMany({quiz: quizId}),
        Quiz.findByIdAndDelete(quizId)
    ]);
    req.flash('success', 'Квиз и всё связанное удалены');
    res.redirect('/admin/quizzes');
};

export const listComments = async (req, res) => {
    const comments = await Comment.find().populate('quiz author');
    res.render('pages/admin/comments', {title: 'Комментарии', comments});
};

// listComments, deleteComment без изменений, но с flash
export const deleteComment = async (req, res) => {
    await Comment.findByIdAndDelete(req.params.id);
    req.flash('success', 'Комментарий удален');
    res.redirect('/admin/comments');
};
