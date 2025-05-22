// src/routes/index.js
import {Router} from 'express';

import authRouter from './auth.js';
import homeRouter from './home.js';
import quizzesRouter from './quizzes.js';
import usersRouter from './users.js';

import adminRouter from './admin.js';

import apiQuizRouter from './api/quizzes.js';

const router = Router();

router.use('/', authRouter);
router.use('/', homeRouter);
router.use('/', quizzesRouter);
router.use('/', usersRouter);

router.use('/admin', adminRouter);

router.use('/api/quizzes', apiQuizRouter);

export default router;
