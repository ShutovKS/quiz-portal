// src/routes/users.js
import {Router} from 'express';
import {ensureAuthenticated} from '../middleware/auth.js';
import {showUserProfile} from '../controllers/userController.js';

const router = Router();

router.get('/user/:id', ensureAuthenticated, showUserProfile);

export default router;
