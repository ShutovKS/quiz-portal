// src/routes/home.js
import {Router} from 'express';
import * as C from '../controllers/indexController.js';

const router = Router();

router.get('/', C.showHome);
router.get('/about', C.showAbout);
router.get('/contact', C.showContact);

export default router;
