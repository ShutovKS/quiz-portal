import Quiz from '../models/Quiz.js';
import Category from '../models/Category.js';

export const showHome = async (req, res, next) => {
    try {
        const [quizzes, categories] = await Promise.all([
            Quiz.find({isPublic: true})
                .select('title description questionsCount avgScore cover')
                .limit(12).lean(),
            Category.find().sort({name: 1}).lean()
        ]);

        res.render('pages/home', {
            title: 'Главная',
            currentUser: req.user,
            quizzes,
            categories
        });
    } catch (err) {
        next(err);
    }
};

export const showAbout = (req, res) => {
    res.render('pages/about', {
        title: 'О проекте',
        currentUser: req.user,
    })
};

export const showContact = (req, res) => {
    res.render('pages/contact', {
        title: 'Контакты',
        currentUser: req.user,
    })
}