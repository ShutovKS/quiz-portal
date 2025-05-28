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

// Импорт квизов через JSON
router.get('/import-quiz', C.showImportQuizForm);
router.post('/import-quiz', C.importQuizFromJson);

// Категории
router.get('/categories', C.listCategories);
router.post('/categories', C.addCategory);
router.post('/categories/:id', C.updateCategory);
router.post('/categories/:id/delete', C.deleteCategory);

export default router;
