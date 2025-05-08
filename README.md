# Quiz Portal

Лёгкий стартер для платформы квизов на Node.js + Express + MongoDB + EJS.

## 🚀 Что реализовано

- **Инициализация проекта**
    - `npm init`
    - Установлены:  
      `express`, `mongoose`, `dotenv`, `ejs`, `express-ejs-layouts`,  
      `express-session`, `connect-mongo`, `passport`, `passport-local`,  
      `connect-flash`, `helmet`, `morgan`, `method-override`, `express-validator`, `bcrypt`.

- **Структура каталогов**

```

─ config/ # db.js, passport.js
─ public/ # статика (css, js, картинки)
─ src/
├─ controllers/ # логика маршрутов (auth, users, quizzes, comments, admin)
├─ middleware/ # ensureAuthenticated, requireAdmin, requireOwnerOrAdmin
├─ models/ # User, Quiz, Question, Comment, Attempt
├─ routes/ # auth, users, quizzes, comments, admin, api
└─ views/ # EJS-шаблоны: layouts, partials, pages
─ .env # MONGO\_URI, SESSION\_SECRET, PORT
─ app.js # точка входа сервера
─ package.json

````

- **База данных (MongoDB + Mongoose)**
- Подключение через `config/db.js`, URI в `.env`
- Модели со схемами и `ref`-связями:
    - `User` (name, email – unique, passwordHash, role, timestamps)
    - `Quiz` (title, description, author, isPublic, accessToken, stats, timestamps)
    - `Question` (text, type, options, ссылка на Quiz)
    - `Comment` (text, rating, ссылка на Quiz и User)
    - `Attempt` (user, quiz, answers, score, timestamps)

- **Безопасность и утилиты**
- `helmet()` для HTTP-заголовков
- `morgan('dev')` для логирования
- `express.urlencoded()`, `express.json()`, `method-override('_method')`
- `express-session` + `connect-mongo` — сессии в MongoDB
- `passport.initialize()`, `passport.session()` — локальная стратегия
- `connect-flash` — flash-сообщения `error`/`success`
- `express-validator` — валидация форм

- **Шаблонизатор EJS + Layouts & Partials**
- `express-ejs-layouts` с общим `views/layouts/main.ejs`
- Частичные:
    - `views/partials/header.ejs` — навигация, учитывает `currentUser`
    - `views/partials/flash.ejs`  — вывод ошибок/успехов из `req.flash`
    - `views/partials/footer.ejs`
- Подключение в `app.js`:
  ```js
  app.use((req, res, next) => {
    res.locals.currentUser = req.user || null;
    res.locals.successMsg  = req.flash('success');
    res.locals.errorMsg    = req.flash('error');
    next();
  });
  ```

- **Аутентификация и авторизация**
- **Регистрация** (`GET /register`, `POST /register`)
    - Валидация полей через `express-validator`:
        - `name` не пустое
        - `email` — валидный и нормализованный
        - `password` ≥ 6 символов и совпадение `password2`
    - Хеширование `bcrypt.hash(password, 10)`
    - Обработка дубликата email (`err.code === 11000`)
    - Flash-уведомления об ошибках и успехе
- **Вход** (`GET /login`, `POST /login`)
    - Passport-Local по полям `email`/`password`
    - При неуспехе возвращаемся на `/login` с `failureFlash`
    - Подставляем старые данные (email) в форму через `req.flash('oldData')`
- **Выход** (`GET /logout`)
    - `req.logout()`, flash-сообщение, редирект на `/login`
- **Passport-config** (`config/passport.js`)
    - LocalStrategy, `serializeUser`/`deserializeUser` (без `passwordHash`)

- **Профиль пользователя**
- **Просмотр**
    - `/profile` → свой профиль
    - `/user/:id` → чужой профиль (показываем только публичные квизы, без попыток)
    - Контроллеры собирают:
        - `user` (без `passwordHash`)
        - `quizzes` (автором – user._id, фильтрация по `isPublic`)
        - `attempts` (populate `quiz`, только для своего профиля)
- **Редактирование**
    - `GET /user/:id/edit` — форма (name, email, новый пароль)
    - `PUT /user/:id` — валидация через `express-validator`
        - `name`, `email` обязательны
        - `newPassword` ≥ 6 символов и совпадение `newPassword2` (опционально)
    - При смене пароля – новый хеш `bcrypt`
    - Flash-сообщения об ошибках/успехе
    - Защита через `requireOwnerOrAdmin('User')`

- **Основные маршруты**
- `/` — главная страница
- `/register`, `/login`, `/logout`
- `/profile`, `/user/:id`, `/user/:id/edit`
- `/quizzes`, `/quizzes/new`, `/quizzes/:id`, `/quizzes/:id/edit`, …
- `/admin/*` (только для `role=admin`)
- REST API под `/api/*` (JSON-эндпоинты для quizzes, users, comments)

## 📦 Установка и запуск

1. Клонировать репо
2. Установить зависимости

 ```bash
 npm install
````

3. Создать файл `.env` рядом с `app.js`:

   ```dotenv
   MONGO_URI=mongodb://localhost:27017/quizdb
   SESSION_SECRET=любая_строка
   PORT=3000
   NODE_ENV=development
   ```
4. Запустить сервер

   ```bash
   npm start
   # или
   node app.js
   ```
5. Открыть в браузере:
   [http://localhost:3000](http://localhost:3000)

---