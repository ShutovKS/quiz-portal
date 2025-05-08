// src/controllers/commentController.js
import Comment from '../models/Comment.js';
import Quiz from '../models/Quiz.js';

export const createComment = async (req, res) => {
    const {text, rating} = req.body;
    const quizId = req.params.id;

    await Comment.create({
        text,
        quiz: quizId,
        rating: rating ? +rating : undefined,
        author: req.session.userId,
    });
    await Quiz.findByIdAndUpdate(quizId, {$inc: {'stats.commentsCount': 1}});
    res.redirect(`/quizzes/${quizId}`);
};

export const deleteComment = async (req, res) => {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).send('Не найдено');
    if (comment.author.toString() !== req.session.userId && req.user.role !== 'admin') {
        return res.status(403).send('Forbidden');
    }
    await comment.remove();
    await Quiz.findByIdAndUpdate(comment.quiz, {$inc: {'stats.commentsCount': -1}});
    res.redirect('back');
};
