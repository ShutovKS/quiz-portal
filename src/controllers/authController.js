// src/controllers/authController.js
import bcrypt from 'bcrypt';
import User from '../models/User.js';

export const showRegisterForm = (req, res) => {
    res.render('pages/auth/register', {title: 'Регистрация'});
};

export const registerUser = async (req, res) => {
    const {name, email, password} = req.body;
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({name, email, passwordHash: hash});
    req.session.userId = user._id;
    res.redirect('/');
};

export const showLoginForm = (req, res) => {
    res.render('pages/auth/login', {
        title: 'Вход',
        errorMsg: req.flash('error'),
        successMsg: req.flash('success')
    });
};

export const loginUser = async (req, res) => {
    const {email, password} = req.body;
    const user = await User.findOne({email});
    if (!user) return res.redirect('/login');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.redirect('/login');
    req.session.userId = user._id;
    res.redirect('/');
};

export const logoutUser = (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        req.flash('success', 'Вы вышли из системы');
        res.redirect('/');
    });
};