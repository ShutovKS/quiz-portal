import {Router} from 'express';
import {body} from 'express-validator';
import {ensureAuthenticated} from '../middleware/auth.js';
import {requireOwnerOrAdmin} from '../middleware/auth.js';
import * as UC from '../controllers/userController.js';

const router = Router();

// свой профиль (alias)
router.get('/profile', ensureAuthenticated, UC.showOwnProfile);

// чужой профиль
router.get('/user/:id', ensureAuthenticated, UC.showUserProfile);

// GET форма редактирования
router.get(
    '/user/:id/edit',
    ensureAuthenticated,
    requireOwnerOrAdmin('User'),
    UC.showEditForm
);

// PUT обновление (password optional)
router.put(
    '/user/:id',
    ensureAuthenticated,
    requireOwnerOrAdmin('User'),
    body('name').trim().notEmpty().withMessage('Имя не пустое'),
    body('email').isEmail().withMessage('Неверный email').normalizeEmail(),
    body('newPassword').optional().isLength({min: 6}).withMessage('Пароль ≥ 6 символов'),
    body('newPassword2').custom((val, {req}) => {
        if (req.body.newPassword && val !== req.body.newPassword)
            throw new Error('Пароли не совпадают');
        return true;
    }),
    UC.updateUserProfile
);

export default router;
