// src/routes/comments.js
import {Router} from 'express';
import {ensureAuthenticated} from '../middleware/auth.js';
import {addComment, deleteComment} from '../controllers/commentController.js';

const router = Router();

router.post('/quizzes/:id/comments', ensureAuthenticated, addComment);
router.delete('/comments/:id', ensureAuthenticated, deleteComment);

export default router;
