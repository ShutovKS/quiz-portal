import {Router} from 'express';
import passport from '../config/passport.js';
import * as C from '../controllers/authController.js';

const router = Router();

router.get('/register', C.showRegisterForm);
router.post('/register', C.registerUser);

router.get('/login', C.showLoginForm);
router.post('/login',
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    })
);

router.get('/logout', C.logoutUser);

export default router;
