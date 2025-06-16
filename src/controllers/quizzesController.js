// src/controllers/quizzesController.js
import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import Attempt from '../models/Attempt.js';
import Category from '../models/Category.js';

/** ===== GET /quizzes ===== */
export const listQuizzes = async (req, res, next) => {
    try {
        const search = (req.query.q || '').trim();
        const cat = req.query.cat || '';

        const filter = {isPublic: true};

        if (search) {
            const re = new RegExp(search, 'i');
            filter.$or = [{title: re}, {description: re}];
        }

        if (cat) {
            const category = await Category.findOne({slug: cat}).select('_id');
            if (category) filter.categories = {$in: [category._id]};
        }

        const [quizzes, categories] = await Promise.all([
            Quiz.find(filter)
                .populate('user', 'name')
                .lean()
                .sort({createdAt: -1}),

            Category.find().sort({name: 1}).lean()
        ]);

        const quizIds = quizzes.map(q => q._id);
        const questionsCounts = await Question.aggregate([
            {$match: {quiz: {$in: quizIds}}},
            {$group: {_id: '$quiz', count: {$sum: 1}}}
        ]);
        const questionsCountMap = Object.fromEntries(questionsCounts.map(q => [q._id.toString(), q.count]));

        const filteredQuizzes = quizzes.filter(q => {
            const count = questionsCountMap[q._id.toString()] || 0;
            if (req.user && q.user && q.user._id.toString() === req.user._id.toString()) return true;
            return count > 0;
        });

        res.render('pages/quizzes/index', {
            title: 'Все квизы',
            quizzes: filteredQuizzes,
            categories,
            q: search,
            cat
        });
    } catch (err) {
        next(err);
    }
};

/** ===== GET /quizzes/new ===== */
export const showQuizCreateForm = async (req, res) => {
    const categories = await Category.find().sort({name: 1});
    res.render('pages/quizzes/new', {title: 'Новый квиз', categories});
};

/** ===== POST /quizzes ===== */
export const createQuiz = async (req, res) => {
    const {title, description, isPublic, categories} = req.body;
    let categoriesArr = [];
    if (categories) {
        if (Array.isArray(categories)) {
            categoriesArr = categories;
        } else {
            categoriesArr = [categories];
        }
    }
    const quiz = await Quiz.create({
        title,
        description,
        isPublic: !!isPublic,
        user: req.user._id,
        categories: categoriesArr
    });
    res.redirect(`/quizzes/${quiz._id}/edit`);
};

/** ===== GET /quizzes/:id ===== */
export const showQuiz = async (req, res) => {
    const quiz = await Quiz.findById(req.params.id).populate('user');
    if (!quiz.isPublic && quiz.user._id.toString() !== req.user?._id.toString())
        return res.status(403).send('Приватный квиз');
    const questions = await Question.find({quiz: quiz._id});
    res.render('pages/quizzes/show', {title: quiz.title, quiz, questions});
};

/** ===== GET /quizzes/:id/edit ===== */
export const showQuizEditForm = async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);
    const questions = await Question.find({quiz: quiz._id});
    const categories = await Category.find().sort({name: 1});
    res.render('pages/quizzes/edit', {title: 'Редактировать квиз', quiz, questions, categories});
};

/** ===== POST /quizzes/:id ===== */
export const updateQuiz = async (req, res) => {
    console.log('=== [updateQuiz] called ===');
    console.log('updateQuiz req.method:', req.method);
    console.log('updateQuiz req.originalUrl:', req.originalUrl);
    console.log('updateQuiz req.body:', req.body);
    const quizId = req.params.id;
    try {
        const {title, description, isPublic, categories} = req.body;
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            req.flash('error', 'Квиз не найден');
            return res.redirect('/quizzes');
        }

        const questions = await Question.find({quiz: quizId});
        const questionTitles = req.body.questionTitles || {};
        for (const q of questions) {
            if (questionTitles[q._id] && questionTitles[q._id] !== q.text) {
                q.text = questionTitles[q._id];
                await q.save();
            }
            if (q.type === 'truefalse') {
                let changed = false;
                if (q.options.length !== 2 || !q.options.some(o => o.text === 'Верно') || !q.options.some(o => o.text === 'Неверно')) {
                    q.options = [];
                    changed = true;
                }
                if (q.options.length === 0) {
                    q.options.push({text: 'Верно', isCorrect: false});
                    q.options.push({text: 'Неверно', isCorrect: false});
                    changed = true;
                } else if (q.options.length === 2) {
                    const optionTexts = q.options.map(o => o.text).sort();
                    if (optionTexts[0] !== 'Верно' || optionTexts[1] !== 'Неверно') {
                        q.options = [];
                        q.options.push({text: 'Верно', isCorrect: false});
                        q.options.push({text: 'Неверно', isCorrect: false});
                        changed = true;
                    }
                }
                if (changed) {
                    await q.save();
                }
            }

            if ((q.type === 'single' || q.type === 'multiple') && (!q.options || q.options.length < 2)) {
                req.flash('error', `Вопрос "${q.text}" (${q.type}) должен иметь минимум 2 варианта ответа.`);
                return res.redirect(`/quizzes/${quizId}/edit`); // Редирект обратно на страницу редактирования
            }
            if (q.type === 'truefalse' && (!q.options || q.options.length !== 2)) {
                // Это уже не должно происходить после логики очистки выше, но оставляем как финальную проверку
                req.flash('error', `Вопрос "${q.text}" (${q.type}) должен иметь ровно 2 варианта ответа.`);
                return res.redirect(`/quizzes/${quizId}/edit`);
            }
        }
        // --- Конец очистки и валидации вопросов ---

        quiz.title = title;
        quiz.description = description;
        quiz.isPublic = !!isPublic;
        let categoriesArr = [];
        if (categories) {
            if (Array.isArray(categories)) {
                categoriesArr = categories;
            } else {
                categoriesArr = [categories];
            }
        }
        quiz.categories = categoriesArr;
        await quiz.save();

        req.flash('success', 'Квиз сохранён');
        console.log('=== [updateQuiz] redirecting to /profile ===');
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Ошибка при обновлении квиза');
        res.redirect('back');
    }
};

/** ===== DELETE /quizzes/:id ===== */
export const deleteQuiz = async (req, res) => {
    const quizId = req.params.id;
    try {
        const quiz = await Quiz.findByIdAndDelete(quizId);
        if (!quiz) {
            if (req.xhr) return res.status(404).json({error: 'Квиз не найден'});
            req.flash('error', 'Квиз не найден');
            return res.redirect('/quizzes');
        }

        await Promise.all([
            Question.deleteMany({quiz: quizId}),
            Attempt.deleteMany({quiz: quizId}),
        ]);

        if (req.xhr) {
            return res.json({success: true});
        }

        req.flash('success', 'Квиз и всё связанное удалены');
        res.redirect('/quizzes');
    } catch (err) {
        console.error(err);
        if (req.xhr) {
            return res.status(500).json({error: 'Ошибка при удалении квиза'});
        }
        req.flash('error', 'Ошибка при удалении квиза');
        res.redirect('back');
    }
};

/** ===== POST /quizzes/:id/submit ===== */
export const submitQuizAnswers = async (req, res) => {
    const quizId = req.params.id;
    const raw = req.body.answers || {};
    for (const key in req.body) {
        const match = key.match(/^answers\[(.+)\]$/);
        if (match) {
            raw[match[1]] = req.body[key];
        }
    }
    const questions = await Question.find({quiz: quizId});
    let score = 0;
    questions.forEach(q => {
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
    let answersObj = raw;
    if (raw instanceof Map) {
        answersObj = Object.fromEntries(raw.entries());
    }
    const attempt = await Attempt.create({
        user: req.user._id,
        quiz: quizId,
        answers: answersObj,
        score
    });
    const quiz = await Quiz.findById(quizId);
    const prevCnt = quiz.stats.attemptsCount;
    const prevAvg = quiz.stats.averageScore;
    const newCnt = prevCnt + 1;
    quiz.stats.attemptsCount = newCnt;
    quiz.stats.averageScore = (prevAvg * prevCnt + score) / newCnt;
    await quiz.save();
    res.redirect(`/quizzes/${quizId}/result?attempt=${attempt._id}`);
};

/** ===== GET /quizzes/:id/result ===== */
export const showQuizResult = async (req, res) => {
    const attempt = await Attempt.findById(req.query.attempt).populate('quiz');
    const questions = await Question.find({quiz: attempt.quiz._id});
    const total = questions.length;
    res.render('pages/quizzes/result', {
        title: `Результат: ${attempt.quiz.title}`,
        attempt, questions, total
    });
};

/** ===== GET /private/:token ===== */
export const showPrivateQuiz = async (req, res) => {
    const token = req.params.token;
    const quiz = await Quiz.findOne({accessToken: token}).populate('user');
    if (!quiz) {
        return res.status(404).send('Квиз не найден');
    }
    const questions = await Question.find({quiz: quiz._id});
    res.render('pages/quizzes/show', {title: quiz.title, quiz, questions});
};
