// src/controllers/commentController.js
import Comment from '../models/Comment.js';
import Quiz from '../models/Quiz.js';

export const addComment = async (req, res) => {
    const {text, rating} = req.body;
    await Comment.create({
        quiz: req.params.id,
        author: req.session.userId,
        text, rating
    });
    await Quiz.findByIdAndUpdate(req.params.id, {$inc: {'stats.commentsCount': 1}});
    res.redirect(`/quizzes/${req.params.id}`);
};

export const deleteComment = async (req, res) => {
    const c = await Comment.findById(req.params.id);
    if (!c) return res.status(404).send('Не найдено');
    if (c.author.toString() !== req.session.userId && req.user.role !== 'admin') {
        return res.status(403).send('Forbidden');
    }
    await c.remove();
    await Quiz.findByIdAndUpdate(c.quiz, {$inc: {'stats.commentsCount': -1}});
    res.redirect('back');
};
