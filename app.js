import 'dotenv/config';
import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import flash from 'connect-flash';
import methodOverride from 'method-override';
import morgan from 'morgan';
import path from 'path';
import {fileURLToPath} from 'url';

import {connectDB} from './src/config/db.js';
import indexRouter from './src/routes/index.js';
import passport from './src/config/passport.js';
import {checkNotBanned} from './src/middleware/auth.js';

// эмуляция __dirname/__filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await connectDB();

const app = express();

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// — Логирование запросов
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

// — Layouts для EJS
app.set('views', path.join(__dirname, 'src', 'views'));
app.set('layout', 'layouts/main');
app.set('view engine', 'ejs');
app.use(expressLayouts);

// — Статика
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
    if (req.url.startsWith('/stylesheets') || req.url.startsWith('/javascripts') || req.url.startsWith('/images')) {
        res.setHeader('Cache-Control', 'public, max-age=2592000, immutable'); // 30 дней
    }
    next();
});

// — Парсинг тела запросов
app.use(express.urlencoded({extended: true}));
app.use(express.json());

// — Method-override для PUT/DELETE из форм
app.use(methodOverride('_method'));

// — Сессии + хранение в MongoDB
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    async: true,
    saveUninitialized: false,
    store: MongoStore.create({mongoUrl: process.env.MONGO_URI}),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,   // 1 день
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }
}));

// инициализируем passport после session
app.use(passport.initialize());
app.use(passport.session());

// — Flash-сообщения (через сессии)
app.use(flash());

app.use(checkNotBanned);

// — Прокинуть в locals, чтобы в любом шаблоне был доступ
app.use((req, res, next) => {
    res.locals.currentUser = req.user || null;
    res.locals.successMsg = req.flash('success');
    res.locals.errorMsg = req.flash('error');
    next();
});

app.use('/', indexRouter);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost'
app.listen(PORT, () => console.log(`⚡️ Server up: ${HOST}:${PORT}`));
