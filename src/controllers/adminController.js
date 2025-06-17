// src/controllers/adminController.js
import User from '../models/User.js';
import Quiz from '../models/Quiz.js';
import Attempt from "../models/Attempt.js";
import Question from "../models/Question.js";
import Category from '../models/Category.js';
import {
    getActiveUsersCount,
    getAttemptCount,
    getAverageScore,
    getAvgAttemptsPerUser,
    getMostPopularQuiz,
    getNewUsersCount,
    getPublicQuizPercent,
    getQuestionCount,
    getQuizCount,
    getQuizzesWithoutAttempts,
    getTopAvgQuizzes,
    getUniqueParticipantsCount,
    getUserCount
} from './api/adminController.js';
import Ajv from 'ajv';

/** ===== GET /admin/dashboard ===== */
export const showDashboard = async (req, res) => {
    const [
        uCount,
        qCount,
        aCount,
        avgScore,
        activeUsersCount,
        uniqueParticipantsCount,
        mostPopularQuiz,
        questionCount,
        newUsersWeek,
        newUsersMonth,
        publicQuizPercent,
        topAvgQuizzes,
        quizzesWithoutAttempts,
        avgAttemptsPerUser
    ] = await Promise.all([
        getUserCount(),
        getQuizCount(),
        getAttemptCount(),
        getAverageScore(),
        getActiveUsersCount(),
        getUniqueParticipantsCount(),
        getMostPopularQuiz(),
        getQuestionCount(),
        getNewUsersCount(7),
        getNewUsersCount(30),
        getPublicQuizPercent(),
        getTopAvgQuizzes(),
        getQuizzesWithoutAttempts(),
        getAvgAttemptsPerUser()
    ]);

    const categories = await Category.find().sort({createdAt: -1});

    res.render('pages/admin/dashboard', {
        title: 'Admin',
        uCount,
        qCount,
        aCount,
        avgScore,
        activeUsersCount,
        uniqueParticipantsCount,
        mostPopularQuiz: mostPopularQuiz.title,
        mostPopularQuizAttempts: mostPopularQuiz.attempts,
        avgAttemptsPerUser,
        questionCount,
        newUsersWeek,
        newUsersMonth,
        publicQuizPercent,
        topAvgQuizzes,
        quizzesWithoutAttempts,
        categories
    });
};

/** ===== GET /admin/users ===== */
export const listUsers = async (req, res) => {
    const users = await User.find();
    res.render('pages/admin/users', {title: 'Пользователи', users});
};

/** ===== DELETE /admin/users/:id ===== */
export const deleteUser = async (req, res) => {
    const userId = req.params.id;
    // 1) удалить все квизы автора и связанные с ними сущности
    const quizzes = await Quiz.find({user: userId}).select('_id');
    const quizIds = quizzes.map(q => q._id);
    await Promise.all([
        Question.deleteMany({quiz: {$in: quizIds}}),
        Attempt.deleteMany({quiz: {$in: quizIds}}),
        Quiz.deleteMany({user: userId})
    ]);
    // 2) удалить все попытки и комменты самого юзера
    await Promise.all([
        Attempt.deleteMany({user: userId}),
    ]);
    // 3) удалить юзера
    await User.findByIdAndDelete(userId);
    req.flash('success', 'Пользователь и все данные удалены');
    res.redirect('/admin/users');
};

/** ===== PATCH /admin/users/:id/toggle-admin ===== */
export const toggleAdmin = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        req.flash('error', 'Пользователь не найден');
        return res.redirect('/admin/users');
    }
    user.role = user.role === 'admin' ? 'user' : 'admin';
    await user.save();
    req.flash('success', `Роль пользователя "${user.name}" теперь "${user.role}"`);
    res.redirect('/admin/users');
};

/** ===== PATCH /admin/users/:id/toggle-ban ===== */
export const toggleBan = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        req.flash('error', 'Пользователь не найден');
        return res.redirect('/admin/users');
    }
    user.role = user.role === 'ban' ? 'user' : 'ban';
    await user.save();
    req.flash('success', `Роль пользователя "${user.name}" теперь "${user.role}"`);
    res.redirect('/admin/users');
};

/** ===== GET /admin/quizzes ===== */
export const listQuizzes = async (req, res) => {
    const quizzes = await Quiz.find().populate('user').populate('categories');
    const categories = await Category.find().sort({name: 1});
    const quizIds = quizzes.map(q => q._id);
    const questionsCounts = await Question.aggregate([
        {$match: {quiz: {$in: quizIds}}},
        {$group: {_id: '$quiz', count: {$sum: 1}}}
    ]);
    const questionsCountMap = Object.fromEntries(questionsCounts.map(q => [q._id.toString(), q.count]));
    quizzes.forEach(q => {
        q.questionsCount = questionsCountMap[q._id.toString()] || 0;
    });
    res.render('pages/admin/quizzes', {title: 'Квизы', quizzes, categories});
};

/** ===== DELETE /admin/quizzes/:id ===== */
export const deleteQuiz = async (req, res) => {
    const quizId = req.params.id;
    await Promise.all([
        Question.deleteMany({quiz: quizId}),
        Attempt.deleteMany({quiz: quizId}),
        Quiz.findByIdAndDelete(quizId)
    ]);
    req.flash('success', 'Квиз и всё связанное удалены');
    res.redirect('/admin/quizzes');
};

/** ===== GET /admin/import-quiz ===== */
export const showImportQuizForm = (req, res) => {
    res.render('pages/admin/importQuiz', {title: 'Импорт квиза'});
};

/** ===== POST /admin/import-quiz/api ===== */
export const importQuizFromJsonApi = async (req, res) => {
    const ajv = new Ajv({allErrors: true});
    const quizSchema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Quiz",
        "type": "object",
        "required": ["title", "description", "userEmail", "questions"],
        "properties": {
            "title": {"type": "string", "minLength": 1},
            "description": {"type": "string", "minLength": 1},
            "userEmail": {"type": "string", "format": "email"},
            "isPublic": {"type": "boolean", "default": true},
            "questions": {
                "type": "array",
                "minItems": 1,
                "items": {
                    "type": "object",
                    "required": ["text", "type", "options"],
                    "properties": {
                        "text": {"type": "string", "minLength": 1},
                        "type": {"type": "string", "enum": ["single", "multiple", "truefalse"]},
                        "options": {
                            "type": "array",
                            "minItems": 2,
                            "items": {
                                "type": "object",
                                "required": ["text", "isCorrect"],
                                "properties": {
                                    "text": {"type": "string", "minLength": 1},
                                    "isCorrect": {"type": "boolean"}
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    let quizData;
    try {
        quizData = typeof req.body.quizJson === 'string' ? JSON.parse(req.body.quizJson) : req.body.quizJson;
    } catch (e) {
        return res.status(400).json({success: false, error: 'Некорректный JSON'});
    }

    const validate = ajv.compile(quizSchema);
    if (!validate(quizData)) {
        return res.status(400).json({
            success: false,
            error: 'Ошибка валидации',
            details: ajv.errorsText(validate.errors)
        });
    }
    // Найти пользователя по email
    const user = await User.findOne({email: quizData.userEmail});
    if (!user) {
        return res.status(404).json({success: false, error: 'Пользователь с таким email не найден'});
    }
    // Создать квиз
    let quiz;
    try {
        quiz = await Quiz.create({
            title: quizData.title,
            description: quizData.description,
            user: user._id,
            isPublic: quizData.isPublic !== undefined ? quizData.isPublic : true
        });
        // Добавить вопросы
        for (const q of quizData.questions) {
            await Question.create({
                quiz: quiz._id,
                text: q.text,
                type: q.type,
                options: q.options
            });
        }
    } catch (e) {
        return res.status(500).json({success: false, error: 'Ошибка при создании квиза', details: e.message});
    }
    return res.json({success: true, message: 'Квиз успешно импортирован!', quizId: quiz._id});
};

/** ===== GET /admin/categories ===== */
export const listCategories = async (req, res) => {
    const categories = await Category.find().sort({createdAt: -1});
    res.render('pages/admin/categories', {title: 'Категории', categories});
};

/** ===== POST /admin/categories ===== */
export const addCategory = async (req, res) => {
    try {
        const {name} = req.body;
        await Category.create({name});
        req.flash('success', 'Категория добавлена');
    } catch (e) {
        req.flash('error', 'Ошибка при добавлении категории: ' + e.message);
    }
    res.redirect('/admin/categories');
};

/** ===== PATCH /admin/categories/:id ===== */
export const updateCategory = async (req, res) => {
    try {
        const {id} = req.params;
        const {name} = req.body;
        await Category.findByIdAndUpdate(id, {name});
        req.flash('success', 'Категория обновлена');
    } catch (e) {
        req.flash('error', 'Ошибка при обновлении категории: ' + e.message);
    }
    res.redirect('/admin/categories');
};

/** ===== DELETE /admin/categories/:id ===== */
export const deleteCategory = async (req, res) => {
    try {
        const {id} = req.params;
        await Category.findByIdAndDelete(id);
        req.flash('success', 'Категория удалена');
    } catch (e) {
        req.flash('error', 'Ошибка при удалении категории: ' + e.message);
    }
    res.redirect('/admin/categories');
};

/** ===== POST /admin/import-quiz ===== */
export const importQuizFromJson = async (req, res) => {
    const ajv = new Ajv({allErrors: true});
    const quizSchema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Quiz",
        "type": "object",
        "required": ["title", "description", "userEmail", "questions"],
        "properties": {
            "title": {"type": "string", "minLength": 1},
            "description": {"type": "string", "minLength": 1},
            "userEmail": {"type": "string", "format": "email"},
            "isPublic": {"type": "boolean", "default": true},
            "questions": {
                "type": "array",
                "minItems": 1,
                "items": {
                    "type": "object",
                    "required": ["text", "type", "options"],
                    "properties": {
                        "text": {"type": "string", "minLength": 1},
                        "type": {"type": "string", "enum": ["single", "multiple", "truefalse"]},
                        "options": {
                            "type": "array",
                            "minItems": 2,
                            "items": {
                                "type": "object",
                                "required": ["text", "isCorrect"],
                                "properties": {
                                    "text": {"type": "string", "minLength": 1},
                                    "isCorrect": {"type": "boolean"}
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    let quizData;
    try {
        quizData = JSON.parse(req.body.quizJson);
    } catch (e) {
        req.flash('error', 'Некорректный JSON');
        return res.redirect('/admin/import-quiz');
    }

    const validate = ajv.compile(quizSchema);
    if (!validate(quizData)) {
        req.flash('error', 'Ошибка валидации: ' + ajv.errorsText(validate.errors));
        return res.redirect('/admin/import-quiz');
    }
    // Найти пользователя по email
    const user = await User.findOne({email: quizData.userEmail});
    if (!user) {
        req.flash('error', 'Пользователь с таким email не найден');
        return res.redirect('/admin/import-quiz');
    }
    // Создать квиз
    const quiz = await Quiz.create({
        title: quizData.title,
        description: quizData.description,
        user: user._id,
        isPublic: quizData.isPublic !== undefined ? quizData.isPublic : true
    });
    // Добавить вопросы
    for (const q of quizData.questions) {
        await Question.create({
            quiz: quiz._id,
            text: q.text,
            type: q.type,
            options: q.options
        });
    }
    req.flash('success', 'Квиз успешно импортирован!');
    res.redirect('/admin/quizzes');
};