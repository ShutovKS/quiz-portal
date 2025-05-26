// src/routes/quizzes.js
import {Router} from 'express';
import {ensureAuthenticated, requireOwnerOrAdmin} from '../middleware/auth.js';
import * as C from '../controllers/quizzesController.js';

const router = Router();

router.get('/quizzes', C.listQuizzes);
router.post('/quizzes', ensureAuthenticated, C.createQuiz);

router.get('/quizzes/new', ensureAuthenticated, C.showQuizCreateForm);

router.get('/quizzes/:id', C.showQuiz);
router.put('/quizzes/:id', ensureAuthenticated, requireOwnerOrAdmin('Quiz'), C.updateQuiz);
router.delete('/quizzes/:id', ensureAuthenticated, requireOwnerOrAdmin('Quiz'), C.deleteQuiz);
router.post('/quizzes/:id', ensureAuthenticated, C.submitQuizAnswers);

router.get('/quizzes/:id/edit', ensureAuthenticated, requireOwnerOrAdmin('Quiz'), C.showQuizEditForm);
router.get('/quizzes/:id/result', ensureAuthenticated, C.showQuizResult);

router.get('/quizzes/private/:token', C.showPrivateQuiz);

export default router;
