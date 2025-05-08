// src/routes/admin.js
import {Router} from 'express';
import {requireAdmin} from '../middleware/auth.js';
import * as C from '../controllers/adminController.js';

const router = Router();
router.use(requireAdmin);

// Dashboard
router.get('/', C.showDashboard);

// Пользователи
router.get('/users', C.listUsers);
router.delete('/users/:id', C.deleteUser);
router.post('/users/:id/toggle-admin', C.toggleAdmin);

// Квизы
router.get('/quizzes', C.listQuizzes);
router.delete('/quizzes/:id', C.deleteQuiz);

// Комментарии
router.get('/comments', C.listComments);
router.delete('/comments/:id', C.deleteComment);

export default router;
