// src/routes/index.js
import {Router} from 'express';

import authRouter from './auth.js';
import homeRouter from './home.js';
import quizzesRouter from './quizzes.js';
import usersRouter from './users.js';

import adminRouter from './admin.js';

import apiRouter from './api/index.js';

const router = Router();

router.use('/', authRouter);
router.use('/', homeRouter);
router.use('/', quizzesRouter);
router.use('/', usersRouter);

router.use('/admin', adminRouter);


router.use('/api', apiRouter);

router.use('/404', (req, res) => {
    res.status(404).render('pages/404', {title: '404', layout: false});
});
router.use('/500', (req, res) => {
    res.status(500).render('pages/500', {title: '500', layout: false});
});

// — 404
router.use((req, res) => {
    res.status(404);
    // Если запрашивается статика — отдать обычный 404
    if (req.url.startsWith('/images') || req.url.startsWith('/stylesheets') || req.url.startsWith('/javascripts')) {
        return res.send('Not found');
    }
    // Для остальных — можно отрендерить красивую страницу 404
    res.render('pages/404', {title: 'Страница не найдена', layout: false});
});

// — Ошибки
router.use((req, res) => {
    console.error(req.errored);
    res.status(500).render('pages/500', {title: 'Ошибка сервера', layout: false});
});

export default router;
