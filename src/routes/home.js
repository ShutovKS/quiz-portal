// src/routes/home.js
import {Router} from 'express';
import * as C from '../controllers/indexController.js';

const router = Router();

router.get('/', C.showHome);
export default router;
