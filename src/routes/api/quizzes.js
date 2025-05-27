// src/routes/api/quizzes.js
import {Router} from 'express';
import {ensureAuthenticated, requireAdmin} from '../../middleware/auth.js';
import * as C from '../../controllers/api/quizzesController.js';
import * as questionsC from '../../controllers/api/questionsController.js';

const router = Router();

router.get('/', C.list);
router.get('/:id', C.get);
router.post('/', ensureAuthenticated, C.create);
router.put('/:id', ensureAuthenticated, C.update);
router.delete('/:id', ensureAuthenticated, C.remove);
router.get('/:quizId/questions/:questionId', questionsC.getQuestion);
router.post('/:quizId/questions/:questionId/options', questionsC.addOption);
router.put('/:quizId/questions/:questionId/options/:optionId', questionsC.editOption);
router.delete('/:quizId/questions/:questionId/options/:optionId', questionsC.deleteOption);
router.post('/:quizId/questions', C.addQuestion);
router.delete('/:quizId/questions/:questionId', questionsC.deleteQuestion);

export default router;
