import 'dotenv/config';
import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import flash from 'connect-flash';
import methodOverride from 'method-override';
import morgan from 'morgan';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './src/config/db.js';
import indexRouter from './src/routes/index.js';
import passport from './src/config/passport.js';

// эмуляция __dirname/__filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await connectDB();

const app = express();

// — Безопасность HTTP-заголовков
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "https://cdn.jsdelivr.net",
                "https://mc.yandex.ru",
                "https://mc.yandex.com",
                "https://ymetrica1.com",
                "https://yandexmetrica.com",
                "'unsafe-inline'",
                "'unsafe-eval'"
            ],
            styleSrc: [
                "'self'",
                "https://cdn.jsdelivr.net",
                "'unsafe-inline'",
                "'unsafe-eval'"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "https://mc.yandex.ru",
                "https://mc.yandex.net",
                "https://mc.yandex.com",
                "https://yandex.ru",
                "https://avatars.mds.yandex.net",
                "https://ymetrica1.com",
                "https://yandexmetrica.com"
            ],
            fontSrc: [
                "'self'",
                "https://cdn.jsdelivr.net",
                "https://fonts.googleapis.com",
                "https://fonts.gstatic.com"
            ],
            connectSrc: [
                "'self'",
                "https://mc.yandex.ru",
                "https://mc.yandex.net",
                "https://mc.yandex.com",
                "https://ymetrica1.com",
                "https://yandexmetrica.com"
            ],
            frameSrc: [
                "'self'",
                "https://mc.yandex.ru",
                "https://mc.yandex.net",
                "https://mc.yandex.com",
                "https://ymetrica1.com",
                "https://yandexmetrica.com"
            ],
        }
    }
}));

// — Логирование запросов
app.use(morgan('dev'));

// — Layouts для EJS
app.set('views', path.join(__dirname, 'src', 'views'));
app.set('layout', 'layouts/main');
app.set('view engine', 'ejs');
app.use(expressLayouts);

// — Статика
app.use(express.static(path.join(__dirname, 'public')));

// — Парсинг тела запросов
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// — Method-override для PUT/DELETE из форм
app.use(methodOverride('_method'));

// — Сессии + хранение в MongoDB
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
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
    res.locals.currentUser = req.user || null;
    res.locals.successMsg = req.flash('success');
    res.locals.errorMsg = req.flash('error');
    next();
});

app.use('/', indexRouter);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost'
app.listen(PORT, () => console.log(`⚡️ Server up: ${HOST}:${PORT}`));
