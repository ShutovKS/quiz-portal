// src/routes/admin.js
import {Router} from 'express';
import {requireAdmin} from '../middleware/auth.js';
import * as C from '../controllers/adminController.js';

const router = Router();

router.use(requireAdmin);

router.get('/', C.showDashboard);

router.get('/users', C.listUsers);
router.delete('/users/:id', C.deleteUser);

router.get('/quizzes', C.listQuizzes);
router.delete('/quizzes/:id', C.deleteQuiz);

router.get('/comments', C.listComments);
router.delete('/comments/:id', C.deleteComment);

export default router;
