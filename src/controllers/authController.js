import bcrypt from 'bcrypt';
import {validationResult} from 'express-validator';
import User from '../models/User.js';

export const showRegisterForm = (req, res) => {
    res.render('pages/auth/register', {title: 'Регистрация'});
};

export const registerUser = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map(e => e.msg));
        return res.redirect('/register');
    }

    const {name, email, password} = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        const user = await User.create({name, email, passwordHash: hash});
        req.flash('success', 'Готово, аккаунт создан. Войдите.');
        res.redirect('/login');
    } catch (err) {
        // дублирование email
        if (err.code === 11000) {
            req.flash('error', 'Email уже занят');
            return res.redirect('/register');
        }
        next(err);
    }
};

export const showLoginForm = (req, res) => {
    res.render('pages/auth/login', {
        title: 'Вход',
        errorMsg: req.flash('error'),
        successMsg: req.flash('success'),
        oldData: req.flash('oldData')[0] || {}
    });
};

export const logoutUser = (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        req.flash('success', 'Вы вышли');
        res.redirect('/login');
    });
};
