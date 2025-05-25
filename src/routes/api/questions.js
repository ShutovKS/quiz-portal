import * as questionsC from '../../controllers/api/questionsController.js';
import {ensureAuthenticated} from '../../middleware/auth.js';
import {Router} from "express";

const router = Router({mergeParams: true}); // mergeParams чтобы получать :quizId

router.post('/', ensureAuthenticated, questionsC.addQuestion);
router.put('/:questionId', ensureAuthenticated, questionsC.updateQuestion); // Новый роут

// Роуты для вариантов ответа
router.post('/:questionId/options', ensureAuthenticated, questionsC.addOption);
router.put('/:questionId/options/:optionId', ensureAuthenticated, questionsC.editOption);
router.delete('/:questionId/options/:optionId', ensureAuthenticated, questionsC.deleteOption);

export default router; 