// scripts/seed.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import User from '../src/models/User.js';
import Quiz from '../src/models/Quiz.js';
import Question from '../src/models/Question.js';
import Comment from '../src/models/Comment.js';

async function seed() {
    await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    console.log('⚡️ Connected to DB, clearing…');
    await Promise.all([
        User.deleteMany({}),
        Quiz.deleteMany({}),
        Question.deleteMany({}),
        Comment.deleteMany({}),
    ]);

    console.log('📦 Creating test data…');
    // 1) тестовый пользователь
    const u = await User.create({
        username: 'tester',
        passwordHash: await User.hashPassword('123456'),
    });

    // 2) тестовый квиз
    const qz = await Quiz.create({
        title: 'Тестовый квиз',
        description: 'Несколько простых вопросов',
        isPublic: true,
        author: u._id,
        stats: {plays: 0, avgRating: 0, commentsCount: 0},
    });

    // 3) вопросы
    const qs = await Question.insertMany([
        {
            quiz: qz._id,
            text: 'Сколько будет 2+2?',
            type: 'single',
            options: [
                {text: '3', isCorrect: false},
                {text: '4', isCorrect: true},
                {text: '5', isCorrect: false},
            ],
        },
        {
            quiz: qz._id,
            text: 'Выберите чётные числа',
            type: 'multiple',
            options: [
                {text: '1', isCorrect: false},
                {text: '2', isCorrect: true},
                {text: '4', isCorrect: true},
                {text: '5', isCorrect: false},
            ],
        },
    ]);

    // 4) пример комментария
    await Comment.create({
        quiz: qz._id,
        author: u._id,
        text: 'Отличный квиз!',
        rating: 5,
    });

    console.log('✅ Seed complete');
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seed error', err);
    process.exit(1);
});
