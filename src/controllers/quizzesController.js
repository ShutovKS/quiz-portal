// src/controllers/quizzesController.js
import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import Attempt from '../models/Attempt.js';
import Category from '../models/Category.js';

export const listQuizzes = async (req, res, next) => {
    try {
        /* --- параметры фильтра --- */
        const search = (req.query.q || '').trim();
        const cat = req.query.cat || '';

        const filter = {isPublic: true};

        if (search) {
            const re = new RegExp(search, 'i');
            filter.$or = [{title: re}, {description: re}];
        }

        if (cat) {
            const category = await Category.findOne({slug: cat}).select('_id');
            if (category) filter.categories = category._id;
        }

        /* --- данные --- */
        const [quizzes, categories] = await Promise.all([
            Quiz.find(filter)
                .populate('user', 'name')
                .lean()
                .sort({createdAt: -1}),

            Category.find().sort({name: 1}).lean()
        ]);

        res.render('pages/quizzes/index', {
            title: 'Все квизы',
            quizzes,
            categories,
            q: search,
            cat
        });
    } catch (err) {
        next(err);
    }
};

export const showQuizCreateForm = (req, res) => {
    res.render('pages/quizzes/new', {title: 'Новый квиз'});
};

export const createQuiz = async (req, res) => {
    const {title, description, isPublic} = req.body;
    const quiz = await Quiz.create({
        title,
        description,
        isPublic: !!isPublic,
        user: req.user._id
    });
    // Если вопросы передаются сразу — тут можно их сохранить
    res.redirect(`/quizzes/${quiz._id}`);
};

export const showQuiz = async (req, res) => {
    const quiz = await Quiz.findById(req.params.id).populate('user');
    if (!quiz.isPublic && quiz.user._id.toString() !== req.user?._id.toString())
        return res.status(403).send('Приватный квиз');
    const questions = await Question.find({quiz: quiz._id});
    res.render('pages/quizzes/show', {title: quiz.title, quiz, questions});
};

export const showQuizEditForm = async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);
    const questions = await Question.find({quiz: quiz._id});
    res.render('pages/quizzes/edit', {title: 'Редактировать квиз', quiz, questions});
};

export const updateQuiz = async (req, res) => {
    const quizId = req.params.id;
    try {
        const {title, description, isPublic} = req.body;
        // Найти квиз
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            req.flash('error', 'Квиз не найден');
            return res.redirect('/quizzes');
        }

        // --- Предварительная очистка и валидация вопросов перед сохранением квиза ---
        const questions = await Question.find({quiz: quizId});
        for (const q of questions) {
            // Очистка вариантов для truefalse вопросов (если есть некорректные старые)
            if (q.type === 'truefalse') {
                 let changed = false;
                 // Удаляем все текущие варианты, если их не ровно 2 или их текст не 'Верно'/'Неверно'
                 if (q.options.length !== 2 || !q.options.some(o => o.text === 'Верно') || !q.options.some(o => o.text === 'Неверно')) {
                      q.options = [];
                      changed = true;
                 }
                 // Добавляем стандартные, если их нет (т.е. после очистки или если изначально было 0)
                 if (q.options.length === 0) {
                      q.options.push({text: 'Верно', isCorrect: false});
                      q.options.push({text: 'Неверно', isCorrect: false});
                      changed = true;
                 } else if (q.options.length === 2) {
                    // Если ровно 2 варианта, убедимся, что их тексты 'Верно' и 'Неверно'
                    const optionTexts = q.options.map(o => o.text).sort();
                     if (optionTexts[0] !== 'Верно' || optionTexts[1] !== 'Неверно') {
                         q.options = [];
                         q.options.push({text: 'Верно', isCorrect: false});
                         q.options.push({text: 'Неверно', isCorrect: false});
                         changed = true;
                     }
                 }
                // Сохраняем вопрос, если были изменения
                 if (changed) {
                    await q.save();
                 }
            }

            // Валидация после потенциальной очистки
            // Для single/multiple должны быть минимум 2 варианта
            if ((q.type === 'single' || q.type === 'multiple') && (!q.options || q.options.length < 2)) {
                req.flash('error', `Вопрос "${q.text}" (${q.type}) должен иметь минимум 2 варианта ответа.`);
                return res.redirect(`/quizzes/${quizId}/edit`); // Редирект обратно на страницу редактирования
            }
             // Для truefalse проверяем ровно 2 варианта (после очистки они должны быть)
             if (q.type === 'truefalse' && (!q.options || q.options.length !== 2)) {
                 // Это уже не должно происходить после логики очистки выше, но оставляем как финальную проверку
                 req.flash('error', `Вопрос "${q.text}" (${q.type}) должен иметь ровно 2 варианта ответа.`);
                 return res.redirect(`/quizzes/${quizId}/edit`);
             }
        }
        // --- Конец очистки и валидации вопросов ---

        // Обновить поля квиза
        quiz.title = title;
        quiz.description = description;
        quiz.isPublic = !!isPublic;
        await quiz.save();

        req.flash('success', 'Квиз сохранён');
        res.redirect(`/quizzes/${quizId}`);
    } catch (err) {
        console.error(err);
        req.flash('error', 'Ошибка при обновлении квиза');
        res.redirect('back');
    }
};

export const deleteQuiz = async (req, res) => {
    const quizId = req.params.id;
    try {
        // Удаляем сам квиз
        const quiz = await Quiz.findByIdAndDelete(quizId);
        if (!quiz) {
            req.flash('error', 'Квиз не найден');
            return res.redirect('/quizzes');
        }

        // Каскад: удаляем вопросы, попытки и комменты
        await Promise.all([
            Question.deleteMany({quiz: quizId}),
            Attempt.deleteMany({quiz: quizId}),
        ]);

        req.flash('success', 'Квиз и всё связанное удалены');
        res.redirect('/quizzes');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Ошибка при удалении квиза');
        res.redirect('back');
    }
};

export const submitQuizAnswers = async (req, res) => {
    const quizId = req.params.id;
    const raw = req.body.answers || {};
    const questions = await Question.find({quiz: quizId});
    // отфильтруем только те, что можно автоматически проверить
    const autoQ = questions.filter(q => q.type !== 'text');
    let score = 0;
    autoQ.forEach(q => {
        const given = raw[q._id] || (q.type === 'multiple' ? [] : '');
        if (q.type === 'single' || q.type === 'truefalse') {
            const correct = q.options.find(o => o.isCorrect)?._id.toString();
            if (given === correct) score++;
        }
        if (q.type === 'multiple') {
            const corr = q.options.filter(o => o.isCorrect).map(o => o._id.toString());
            const got = Array.isArray(given) ? given : [given];
            if (corr.length === got.length && corr.every(id => got.includes(id))) score++;
        }
    });
    // сохранить попытку
    const attempt = await Attempt.create({
        user: req.user._id,
        quiz: quizId,
        answers: raw,
        score
    });
    // обновить статистику
    const quiz = await Quiz.findById(quizId);
    const prevCnt = quiz.stats.attemptsCount;
    const prevAvg = quiz.stats.averageScore;
    const newCnt = prevCnt + 1;
    quiz.stats.attemptsCount = newCnt;
    quiz.stats.averageScore = (prevAvg * prevCnt + score) / newCnt;
    await quiz.save();
    res.redirect(`/quizzes/${quizId}/result?attempt=${attempt._id}`);
};

export const showQuizResult = async (req, res) => {
    const attempt = await Attempt.findById(req.query.attempt).populate('quiz');
    const questions = await Question.find({quiz: attempt.quiz._id});
    const total = questions.filter(q => q.type !== 'text').length;
    res.render('pages/quizzes/result', {
        title: `Результат: ${attempt.quiz.title}`,
        attempt, questions, total
    });
};
