// src/controllers/adminController.js
import User from '../models/User.js';
import Quiz from '../models/Quiz.js';
import Comment from '../models/Comment.js';

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

export const deleteUser = async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/admin/users');
};

export const listQuizzes = async (req, res) => {
    const quizzes = await Quiz.find().populate('author');
    res.render('pages/admin/quizzes', {title: 'Квизы', quizzes});
};

export const deleteQuiz = async (req, res) => {
    await Quiz.findByIdAndDelete(req.params.id);
    res.redirect('/admin/quizzes');
};

export const listComments = async (req, res) => {
    const comments = await Comment.find().populate('quiz author');
    res.render('pages/admin/comments', {title: 'Комментарии', comments});
};

export const deleteComment = async (req, res) => {
    await Comment.findByIdAndDelete(req.params.id);
    res.redirect('/admin/comments');
};
