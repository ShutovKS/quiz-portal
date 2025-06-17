import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import User from '../models/User.js';

const renderAuth = (res, view, title, req) =>
    res.render(`pages/auth/${view}`, {
        title,
        errorMsg: req.flash('error'),
        successMsg: req.flash('success'),
        oldData: req.flash('oldData')[0] || {}
    });

/** ===== GET /register ===== */
export const showRegisterForm = (req, res) =>
    renderAuth(res, 'register', 'Регистрация', req);

/** ===== POST /register ===== */
export const registerUser = async (req, res, next) => {
    const { name, email, password } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map(e => e.msg));
        req.flash('oldData', { name, email });
        return res.redirect('/register');
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        await User.create({ name, email, passwordHash: hash });

        req.flash('success', 'Готово, аккаунт создан. Войдите.');
        res.redirect('/login');
    } catch (err) {
        if (err.code === 11000) {
            req.flash('error', 'Email уже занят');
            req.flash('oldData', { name });
            return res.redirect('/register');
        }
        next(err);
    }
};

/** ===== GET /login ===== */
export const showLoginForm = (req, res) =>
    renderAuth(res, 'login', 'Вход', req);

/** ===== GET /logout ===== */
export const logoutUser = (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        req.flash('success', 'Вы вышли');
        res.redirect('/login');
    });
};
