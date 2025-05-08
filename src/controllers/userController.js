// src/controllers/userController.js
import User from '../models/User.js';
import Quiz from '../models/Quiz.js';
import Attempt from '../models/Attempt.js';

export const showUserProfile = async (req, res) => {
    const user = await User.findById(req.params.id);
    const myQuizzes = await Quiz.find({author: user._id});
    const myAttempts = await Attempt.find({user: user._id}).populate('quiz');
    res.render('pages/users/profile', {
        title: `Профиль ${user.name}`,
        user, myQuizzes, myAttempts
    });
};
