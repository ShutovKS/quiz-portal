import {Router} from 'express';
import quizzesRouter from './quizzes.js';

const router = Router();

router.use('/quizzes', quizzesRouter);

export default router; 