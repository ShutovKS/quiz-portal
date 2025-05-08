// src/routes/api/quizzes.js
import {Router} from 'express';
import {ensureAuthenticated, requireAdmin} from '../../middleware/auth.js';
import * as C from '../../controllers/api/quizzesController.js';

const router = Router();

router.get('/', C.list);
router.get('/:id', C.get);
router.post('/', ensureAuthenticated, C.create);
router.put('/:id', ensureAuthenticated, C.update);
router.delete('/:id', ensureAuthenticated, C.remove);

export default router;
