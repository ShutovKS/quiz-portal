import {Router} from 'express';
import quizzesRouter from './quizzes.js';
import questionsRouter from './questions.js';

const router = Router();

router.use('/quizzes', quizzesRouter);
router.use('/:quizId/questions', questionsRouter);

export default router; 