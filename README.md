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

─ public/ # статика (css, js, картинки)
- scripts/ # seed-скрипт
─ src/
│ ├─ config/ # db.js, passport.js
│ ├─ controllers/ # логика маршрутов (auth, users, quizzes, admin, admin, index)
│    └─ api/ # quizzes
│ ├─ middleware/ # ensureAuthenticated, requireAdmin, requireOwnerOrAdmin
│ ├─ models/ # User, Quiz, Question, Attempt
│ ├─ routes/ # index, auth, users, quizzes, admin, home
│    └─ api/ # quizzes
│ └─ views/ # EJS-шаблоны: layouts, partials, pages
│    ├─ layouts/ # main
│    ├─ pages/ # auth, users, quizzes, admin, home
└    └─ partials/ # header, footer, flash
─ .env # MONGO\_URI, SESSION\_SECRET, PORT
─ app.js # точка входа сервера
─ package.json

````

- **База данных (MongoDB + Mongoose)**
- Подключение через `config/db.js`, URI в `.env`
- Модели со схемами и `ref`-связями:
    - `Attempt` (user, quiz, answers, score, timestamps)
    - `Question` (quiz, text, type, options [text, isCorrect], timestamps)
    - `User` (name, email – unique, passwordHash, role, timestamps)
    - `Quiz` (title, description, user, isPublic, accessToken, stats, timestamps)

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
- В `app.js`:
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
    - Валидация через `express-validator`
    - Хеширование `bcrypt.hash(password, 10)`
- **Вход** (`GET /login`, `POST /login`) — Passport-Local
- **Выход** (`GET /logout`)
- **Passport-config** (`config/passport.js`)

- **Профиль пользователя**
- **Просмотр** `/profile`, `/user/:id`
- **Редактирование** `/user/:id/edit`, `PUT /user/:id`

- **Основные маршруты**
- `/`, `/register`, `/login`, `/logout`
- `/quizzes`, `/quizzes/new`, `/quizzes/:id`, `/quizzes/:id/edit`, …
- `/admin/*`
- REST API под `/api/*`

### Просмотр и прохождение квизов

- **Маршруты**  
  `GET /quizzes/:id` — рендер страницы квиза  
  `POST /quizzes/:id` — подсчёт ответов, сохранение `Attempt`, обновление `Quiz.stats`  
  `GET /quizzes/:id/result` — страница результата

- **Контроллеры** (`src/controllers/quizzesController.js`)  
  `showQuiz`, `submitQuizAnswers`, `showQuizResult`
- Поддержка типов `single`, `multiple`, `text`, `truefalse`
- Обновление `stats.attemptsCount` и `stats.averageScore`

- **Модель Attempt**  
  `answers: Map<Schema.Types.Mixed>` для любых ответов

### Редактирование и удаление квизов

- **Контроллеры**:  
  `updateQuiz` (flash + редирект),  
  `deleteQuiz` (каскад: `Question`, `Attempt`)
- **Middleware**: `requireOwnerOrAdmin`

### Админ-панель и функции администратора

- **Middleware**  
  `requireAdmin` блокирует `/admin/*` по `req.user.role !== 'admin'`

- **Маршруты** (`src/routes/admin.js`)
- `GET /admin` — статистика (кол-во юзеров, квизов
- **Пользователи**
    - `GET  /admin/users` — список
    - `DELETE /admin/users/:id` — удалить + каскад (квизы → вопросы/попытки; попытки юзера)
    - `POST   /admin/users/:id/toggle-admin` — переключить роль `user ↔ admin`
- **Квизы**
    - `GET    /admin/quizzes` — список
    - `DELETE /admin/quizzes/:id` — удалить + каскад (вопросы, попытки)

- **Контроллеры** (`src/controllers/adminController.js`)
- `showDashboard`, `listUsers`, `deleteUser`, `toggleAdmin`
- `listQuizzes`, `deleteQuiz`
- Всё через EJS → flash → редирект

- **EJS-шаблоны** (`views/pages/admin/…`)
- `dashboard.ejs`
- `users.ejs`
- `quizzes.ejs`

- **Flash & method-override**
- Используем `<form …?_method=DELETE>` + `method-override('_method')`
- Flash-сообщения на каждом экшене

---

## 📦 Установка и запуск

1. Клонировать репо
2. Установить зависимости

 ```bash
 npm install
````

3. Создать `.env` рядом с `app.js`:

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