// src/routes/comments.js
import {Router} from 'express';
import {ensureAuthenticated, requireOwnerOrAdmin} from '../middleware/auth.js';
import {createComment, deleteComment} from '../controllers/commentController.js';

const router = Router();

router.post('/quizzes/:id/comments', ensureAuthenticated, createComment);
router.delete('/comments/:id', ensureAuthenticated, requireOwnerOrAdmin('Comment'), deleteComment);

export default router;
