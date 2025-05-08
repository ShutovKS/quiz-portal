import {Router} from 'express';
import passport from '../config/passport.js';
import {body} from 'express-validator';
import * as C from '../controllers/authController.js';

const router = Router();

// GET /register
router.get('/register', C.showRegisterForm);

// POST /register
router.post('/register',
    // валидация
    body('name').trim().notEmpty().withMessage('Имя не пустое'),
    body('email').isEmail().withMessage('Неверный email').normalizeEmail(),
    body('password').isLength({min: 6}).withMessage('Пароль ≥ 6 символов'),
    body('password2').custom((val, {req}) => {
        if (val !== req.body.password) throw new Error('Пароли не совпадают');
        return true;
    }),
    C.registerUser
);

// GET /login
router.get('/login', C.showLoginForm);

// POST /login
router.post('/login', (req, res, next) => {
    req.flash('oldData', { email: req.body.email });
    passport.authenticate('local', {
        successRedirect: '/profile',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next);
});

// GET /logout
router.get('/logout', C.logoutUser);

export default router;
