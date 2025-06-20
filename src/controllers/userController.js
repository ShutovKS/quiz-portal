﻿import bcrypt from 'bcrypt';
import {validationResult} from 'express-validator';
import User from '../models/User.js';
import Quiz from '../models/Quiz.js';
import Attempt from '../models/Attempt.js';

/** ===== GET /profile ===== */
export const showOwnProfile = async (req, res, next) => {
    return showUserProfile({...req, params: {id: req.user.id}}, res, next);
};

/** ===== GET /user/:id ===== */
export const showUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-passwordHash');
        if (!user) return res.status(404).send('Пользователь не найден');

        const myQuizzes = await Quiz.find({user: user._id});
        const myAttempts = await Attempt.find({user: user._id}).populate('quiz');

        const createdQuizzesCount = myQuizzes.length;
        const bestScore = myAttempts.length ? Math.max(...myAttempts.map(a => a.score)) : 0;
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const attemptsLastMonth = await Attempt.countDocuments({user: user._id, createdAt: {$gte: monthAgo}});
        const lastAttempt = myAttempts.length ? myAttempts.reduce((a, b) => a.createdAt > b.createdAt ? a : b) : null;

        const attemptsCount = myAttempts.length;
        const averageScore = attemptsCount > 0 ? (myAttempts.reduce((sum, a) => sum + a.score, 0) / attemptsCount) : 0;
        const stats = {attemptsCount, averageScore};

        const isOwner = req.user.id === user.id;
        res.render('pages/users/profile', {
            title: `Профиль ${user.name}`,
            user,
            quizzes: isOwner ? myQuizzes : myQuizzes.filter(q => q.isPublic),
            attempts: isOwner ? myAttempts : [],
            createdQuizzesCount,
            bestScore,
            attemptsLastMonth,
            lastAttempt,
            stats
        });
    } catch (err) {
        next(err);
    }
};

/** ===== GET /user/:id/edit ===== */
export const showEditForm = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-passwordHash');
        if (!user) return res.status(404).send('Not found');
        res.render('pages/users/edit', {title: 'Редактировать профиль', user});
    } catch (err) {
        next(err);
    }
};

/** ===== PUT /user/:id ===== */
export const updateUserProfile = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map(e => e.msg));
        return res.redirect(`/user/${req.params.id}/edit`);
    }

    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).send('Not found');

        user.name = req.body.name;
        user.email = req.body.email;

        if (req.body.newPassword) {
            user.passwordHash = await bcrypt.hash(req.body.newPassword, 10);
        }

        await user.save();
        req.flash('success', 'Профиль обновлён');
        res.redirect(`/user/${user.id}`);
    } catch (err) {
        if (err.code === 11000) {
            req.flash('error', 'Email уже занят');
            return res.redirect(`/user/${req.params.id}/edit`);
        }
        next(err);
    }
};
