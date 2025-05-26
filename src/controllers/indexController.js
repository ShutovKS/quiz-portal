import Quiz from '../models/Quiz.js';
import Category from '../models/Category.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

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

export const postContact = async (req, res) => {
    const { name, email, message } = req.body;
    let success, error;
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT == 465, // true для 465, false для других
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        await transporter.sendMail({
            from: `"Quiz Portal" <${process.env.SMTP_USER}>`,
            to: process.env.MAIL_TO || process.env.SMTP_USER,
            subject: `Новое сообщение с формы контактов` ,
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