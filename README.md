Думал на протяжении пары секунд

# Quiz Portal

Лёгкий стартер для платформы квизов на Node.js + Express + MongoDB + EJS.

## 🚀 Что реализовано

- **Инициализация проекта**
    - `npm init`
    - Установлены: `express`, `mongoose`, `dotenv`, `ejs`, `express-session`, `connect-mongo`, `passport`,
      `passport-local`, `connect-flash`, `helmet`, `morgan`, `method-override`.

- **Структура каталогов**

```
─ config/ # db.js, passport.js
─ public/ # статика (css, js, картинки)
─ src/
 ├─ controllers/ # заглушки контроллеров
 ├─ middleware/ # auth, ошибки
 ├─ models/ # User, Quiz, Question, Comment, Attempt
 ├─ routes/ # auth, users, quizzes, comments, admin, api
 └─ views/ # EJS-шаблоны (layout, partials, pages)
─ .env # MONGO\_URI, SESSION\_SECRET, PORT
─ app.js # точка входа сервера
─ package.json
```

- **База данных (MongoDB + Mongoose)**
- Подключение через `config/db.js`, URI в `.env`
- Модели со схемами и `ref`-связями:
    - `User` (имя, email, passwordHash, role, timestamps)
    - `Quiz` (title, description, author, isPublic, accessToken, stats, timestamps)
    - `Question` (text, type, options, ссылка на Quiz)
    - `Comment` (text, rating, ссылка на Quiz и User)
    - `Attempt` (user, quiz, answers, score, timestamps)

- **Шаблонизатор EJS**
- `app.set('view engine', 'ejs')`, папка `src/views`
- `express-ejs-layouts` с `layout.ejs` (header/footer + `<%- body %>`)
- Частичные: `views/partials/header.ejs`, `footer.ejs`
- Заглушки всех страниц в `views/pages/...`

- **Маршруты и контроллеры**
- **Auth**: `/register`, `/login`, `/logout` (Passport-local)
- **Users**: `/user/:id` (профиль)
- **Quizzes**:
    - `/quizzes` (список),
    - `/quizzes/new` + `POST /quizzes` (создать),
    - `/quizzes/:id` + `POST /quizzes/:id` (пройти),
    - `/quizzes/:id/edit`, `PUT`, `DELETE`
    - `/quizzes/:id/result`
- **Comments**: `POST /quizzes/:id/comments`, `DELETE /comments/:id`
- **Admin** (защищено role=admin): `/admin`, `/admin/users`, `/admin/quizzes`, `/admin/comments`
- **API (JSON)**: `/api/quizzes`, `/api/quizzes/:id`, CRUD (+ аналоги для users, comments)

- **Middleware**
- `helmet()` для заголовков безопасности
- `morgan('dev')` лог запросов
- `express.urlencoded`, `express.json`, `method-override`
- `express-session` + `connect-mongo` (сессии в MongoDB)
- `passport.initialize()`, `passport.session()`
- `connect-flash` для flash-уведомлений
- `res.locals` с `currentUser`, `successMsg`, `errorMsg`
- `ensureAuthenticated`, `requireAdmin`, `requireOwnerOrAdmin`

- **Аутентификация**
- Passport-Local: стратегия по `email` + `password`
- `serializeUser` / `deserializeUser`
- формы login/register + flash-ошибки/успех

- **Заглушки контроллеров и view**
- Все контроллеры созданы как пустые функции с `res.send('OK')` или `res.render('…')`
- Все view-файлы лежат, чтобы сервер не падал на отсутствии шаблонов

## 📦 Установка и запуск

1. Клонировать репо
2. `npm install`
3. Создать `.env`:

 ```dotenv
 MONGO_URI=mongodb://localhost:27017/quizdb
 SESSION_SECRET=любая_строка
 PORT=3000
````

4. `npm start` или `node app.js`
5. Открыть [http://localhost:3000](http://localhost:3000)

---

