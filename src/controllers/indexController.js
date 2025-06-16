import Quiz from '../models/Quiz.js';
import Category from '../models/Category.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import Question from '../models/Question.js';

dotenv.config();

/** ===== GET / ===== */
export const showHome = async (req, res, next) => {
    try {
        const newQuizzes = await Quiz.find({isPublic: true})
            .select('title description questionsCount avgScore cover stats createdAt')
            .sort({createdAt: -1})
            .limit(5)
            .lean();

        const popularQuizzes = await Quiz.find({isPublic: true})
            .select('title description questionsCount avgScore cover stats createdAt')
            .sort({'stats.attemptsCount': -1})
            .limit(5)
            .lean();

        const hardQuizzes = await Quiz.find({isPublic: true, 'stats.attemptsCount': {$gt: 0}})
            .select('title description questionsCount avgScore cover stats createdAt')
            .sort({'stats.averageScore': 1})
            .limit(5)
            .lean();

        const allQuizIds = [
            ...newQuizzes.map(q => q._id),
            ...popularQuizzes.map(q => q._id),
            ...hardQuizzes.map(q => q._id)
        ];

        const categories = await Category.find().sort({name: 1}).lean();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const quizOfTheDaySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        const quizCount = await Quiz.countDocuments({isPublic: true});
        let quizOfTheDay = null;
        if (quizCount > 0) {
            const idx = quizOfTheDaySeed % quizCount;
            quizOfTheDay = await Quiz.findOne({isPublic: true}).skip(idx).lean();
            if (quizOfTheDay) allQuizIds.push(quizOfTheDay._id);
        }

        const Attempt = (await import('../models/Attempt.js')).default;
        const activityFeed = await Attempt.find({})
            .sort({createdAt: -1})
            .limit(8)
            .populate('user', 'name')
            .populate('quiz', 'title')
            .lean();

        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const topUsersAgg = await Attempt.aggregate([
            {$match: {createdAt: {$gte: monthAgo}}},
            {$group: {_id: '$user', attemptsCount: {$sum: 1}, totalScore: {$sum: '$score'}}},
            {$sort: {attemptsCount: -1, totalScore: -1}},
            {$limit: 5},
        ]);

        const User = (await import('../models/User.js')).default;
        const topUsers = await Promise.all(topUsersAgg.map(async u => {
            const user = await User.findById(u._id).lean();
            return user ? {name: user.name, attemptsCount: u.attemptsCount, totalScore: u.totalScore} : null;
        }));

        const [randomQuiz] = await Quiz.aggregate([
            {$match: {isPublic: true}},
            {$sample: {size: 1}}
        ]);
        if (randomQuiz) allQuizIds.push(randomQuiz._id);

        const uniqueQuizIds = [...new Set(allQuizIds.map(id => id.toString()))];
        const questionsCounts = await Question.aggregate([
            {$match: {quiz: {$in: uniqueQuizIds.map(id => typeof id === 'string' ? new Quiz({_id: id})._id : id)}}},
            {$group: {_id: '$quiz', count: {$sum: 1}}}
        ]);
        const questionsCountMap = Object.fromEntries(questionsCounts.map(q => [q._id.toString(), q.count]));

        function setQuestionsCount(arr) {
            if (!arr) return;
            arr.forEach(q => {
                q.questionsCount = questionsCountMap[q._id.toString()] || 0;
            });
        }

        setQuestionsCount(newQuizzes);
        setQuestionsCount(popularQuizzes);
        setQuestionsCount(hardQuizzes);
        if (quizOfTheDay) quizOfTheDay.questionsCount = questionsCountMap[quizOfTheDay._id.toString()] || 0;
        if (randomQuiz) randomQuiz.questionsCount = questionsCountMap[randomQuiz._id.toString()] || 0;

        const [usersCount, quizzesCount, attemptsCount, avgScoreAgg] = await Promise.all([
            User.countDocuments(),
            Quiz.countDocuments({isPublic: true}),
            Attempt.countDocuments(),
            Attempt.aggregate([
                {$group: {_id: null, avg: {$avg: '$score'}}}
            ]),
        ]);
        const avgScore = avgScoreAgg[0]?.avg || 0;

        res.render('pages/home', {
            title: 'Главная',
            currentUser: req.user,
            quizzes: newQuizzes, // для обратной совместимости (старая лента)
            categories,
            newQuizzes,
            popularQuizzes,
            hardQuizzes,
            randomQuiz,
            quizOfTheDay,
            activityFeed,
            topUsers: topUsers.filter(Boolean),
            stats: {
                usersCount,
                quizzesCount,
                attemptsCount,
                avgScore: avgScore.toFixed(1)
            },
            hasNewQuizzes: newQuizzes.length > 0,
            hasPopularQuizzes: popularQuizzes.length > 0,
            hasHardQuizzes: hardQuizzes.length > 0
        });
    } catch (err) {
        next(err);
    }
};

/** ===== GET /about ===== */
export const showAbout = (req, res) => {
    res.render('pages/about', {
        title: 'О проекте',
        currentUser: req.user,
    })
};

/** ===== GET /contact ===== */
export const showContact = (req, res) => {
    res.render('pages/contact', {
        title: 'Контакты',
        currentUser: req.user,
    })
};

/** ===== POST /contact ===== */
export const postContact = async (req, res) => {
    const {name, email, message} = req.body;
    let success, error;
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        await transporter.sendMail({
            from: `"Quiz Portal" <${process.env.SMTP_USER}>`,
            to: process.env.MAIL_TO || process.env.SMTP_USER,
            subject: `Новое сообщение с формы контактов`,
            text: `Имя: ${name}\nEmail: ${email}\nСообщение: ${message}`,
            html: `<b>Имя:</b> ${name}<br><b>Email:</b> ${email}<br><b>Сообщение:</b><br>${message.replace(/\n/g, '<br>')}`
        });
        success = 'Спасибо за ваше сообщение! Мы свяжемся с вами в ближайшее время.';
    } catch (e) {
        console.error('Ошибка при отправке email:', e);
        error = 'Ошибка при отправке сообщения. Попробуйте позже.';
    }
    res.render('pages/contact', {
        title: 'Контакты',
        currentUser: req.user,
        success,
        error
    });
};