import {Router} from 'express';
import quizzesRouter from './quizzes.js';
import questionsRouter from './questions.js';
import {importQuizFromJsonApi} from '../../controllers/adminController.js';

const router = Router();

router.use('/quizzes', quizzesRouter);
router.use('/:quizId/questions', questionsRouter);
router.post('/admin/import-quiz', importQuizFromJsonApi);

export default router; 