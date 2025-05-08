import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import flash from 'connect-flash';
import methodOverride from 'method-override';
import morgan from 'morgan';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import {connectDB} from './config/db.js';
import indexRouter from './src/routes/index.js';
import passport from './src/config/passport.js';

dotenv.config();
await connectDB();

const app = express();

// — Безопасность HTTP-заголовков
app.use(helmet());

// — Логирование запросов
app.use(morgan('dev'));

// — Layouts для EJS
app.use(expressLayouts);
app.set('views', path.resolve('src', 'views'));
app.set('view engine', 'ejs');

// — Статика
app.use(express.static(path.resolve('public')));

// — Парсинг тела запросов
app.use(express.urlencoded({extended: false}));
app.use(express.json());

// — Method-override для PUT/DELETE из форм
app.use(methodOverride('_method'));

// — Сессии + хранение в MongoDB
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({mongoUrl: process.env.MONGO_URI}),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,   // 1 день
        httpOnly: true, // secure: true, // на продакшене, если HTTPS
    }
}));

// инициализируем passport после session
app.use(passport.initialize());
app.use(passport.session());

// — Flash-сообщения (через сессии)
app.use(flash());

// — Прокинуть в locals, чтобы в любом шаблоне был доступ
app.use((req, res, next) => {
    res.locals.currentUser = req.session.userId || null;
    res.locals.successMsg = req.flash('success');
    res.locals.errorMsg = req.flash('error');
    next();
});

// — Роуты
app.use('/', indexRouter);

// — 404
app.use((req, res) => {
    res.status(404).render('pages/404', {title: '404'});
});

// — Ошибки
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('pages/500', {title: 'Ошибка сервера'});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`⚡️ Server up: http://localhost:${PORT}`));
