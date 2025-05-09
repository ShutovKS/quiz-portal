// src/controllers/api/quizzesController.js
import Quiz from '../../models/Quiz.js';

export const list = async (req, res) => {
    const quizzes = await Quiz.find();
    res.json(quizzes);
};

export const get = async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({error: 'Not found'});
    res.json(quiz);
};

export const create = async (req, res) => {
    const quiz = await Quiz.create({...req.body, user: req.session.userId});
    res.status(201).json(quiz);
};

export const update = async (req, res) => {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {new: true});
    res.json(quiz);
};

export const remove = async (req, res) => {
    await Quiz.findByIdAndDelete(req.params.id);
    res.status(204).end();
};
