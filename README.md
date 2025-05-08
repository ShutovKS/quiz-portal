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

─ config/      # db.js, passport.js
─ public/      # статика (css, js, картинки)
─ src/
├─ controllers/  # логика маршрутов (auth, users, quizzes, comments, admin)
├─ middleware/   # ensureAuthenticated, requireAdmin, requireOwnerOrAdmin
├─ models/       # User, Quiz, Question, Comment, Attempt
├─ routes/       # auth, users, quizzes, comments, admin, api
└─ views/        # EJS-шаблоны: layouts, partials, pages
─ .env          # MONGO\_URI, SESSION\_SECRET, PORT
─ app.js        # точка входа сервера
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
    - Валидация полей через `express-validator`
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

---

## ✨ Новый функционал и доработки

### Просмотр и прохождение квизов

- **Маршруты**
- `GET /quizzes/:id` — рендер страницы квиза с вопросами (single, multiple, text, truefalse)
- `POST /quizzes/:id` — подсчёт правильных ответов, сохранение `Attempt`, обновление `Quiz.stats`
- `GET /quizzes/:id/result` — страница результата с подсветкой правильных/неправильных вариантов

- **Контроллеры** (`src/controllers/quizzesController.js`)
- `showQuiz`, `submitQuizAnswers`, `showQuizResult`
- Логика подсчёта для разных типов вопросов
- Обновление статистики:
    - `stats.attemptsCount`
    - `stats.averageScore`

- **Модель Attempt**
- Поле `answers` теперь `Map<Schema.Types.Mixed>` для хранения любых ответов

### Комментарии к квизам

- **Модель Comment** (text, rating, ссылки на Quiz и User)
- **Контроллеры** (`src/controllers/commentsController.js`)
- `createComment`, `deleteComment`
- **Маршруты**
- `POST /quizzes/:id/comments`
- `DELETE /comments/:id`
- **EJS-шаблон** `show.ejs`
- Отображение списка комментариев и формы добавления
- Инкремент/декремент `stats.commentsCount` в `Quiz`

### Редактирование и удаление квизов

- **Контроллеры**
- `updateQuiz` — сохранение изменений с flash-сообщениями
- `deleteQuiz` — каскадное удаление `Quiz`, `Question`, `Attempt`, `Comment`
- **Middleware**
- `requireOwnerOrAdmin` (авторизация через `req.user._id`)

### EJS-шаблоны для CRUD квизов

- `src/views/pages/quizzes/index.ejs` — список квизов, кнопки «Редактировать»/«Удалить»
- `src/views/pages/quizzes/new.ejs` — форма создания квиза
- `src/views/pages/quizzes/edit.ejs` — редактирование полей квиза и список вопросов
- `src/views/pages/quizzes/show.ejs` — прохождение квиза + комментарии
- `src/views/pages/quizzes/result.ejs` — вывод результатов прохождения

---

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

```