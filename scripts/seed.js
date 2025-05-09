// scripts/seed.js
import User from "../src/models/User.js";
import Quiz from "../src/models/Quiz.js";
import Question from "../src/models/Question.js";
import Attempt from "../src/models/Attempt.js";
import {faker} from "@faker-js/faker";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import {config} from "dotenv";

config();

async function seed() {
    await mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});
    console.log('💥 Подключились к БД, начинаем сиды…');

    // чистим всё
    await mongoose.connection.db.dropDatabase();

    // 1) Юзеры
    console.log('👤 Создаём юзеров…');
    const users = [];
    for (let i = 0; i < 10; i++) {
        const hash = await bcrypt.hash('password123', 10);
        const u = await User.create({
            name: faker.person.firstName(),
            email: faker.internet.email().toLowerCase(),
            passwordHash: hash
        });
        users.push(u);
    }

    // 2) Квизы
    console.log('📝 Создаём квизы…');
    const quizzes = [];
    for (let i = 0; i < 20; i++) {
        const q = await Quiz.create({
            title: faker.lorem.words(3),
            description: faker.lorem.sentence(),
            isPublic: true,
            user: faker.helpers.arrayElement(users)._id,
            stats: {
                attemptsCount: 0,
                averageScore: 0,
            }
        });
        quizzes.push(q);
    }

    // 3) Вопросы
    console.log('❓ Создаём вопросы…');
    for (const quiz of quizzes) {
        const cnt = faker.number.int({min: 1, max: 10});
        for (let i = 0; i < cnt; i++) {
            const types = ['single', 'multiple', 'text', 'truefalse'];
            const type = faker.helpers.arrayElement(types);
            const base = {text: faker.lorem.sentence(), type, quiz: quiz._id};

            if (type === 'text') {
                await Question.create(base);
            } else if (type === 'truefalse') {
                await Question.create({
                    ...base,
                    options: [
                        {text: 'True', isCorrect: faker.datatype.boolean()},
                        {text: 'False', isCorrect: true} // пусть будет хотя бы один правильный
                    ]
                });
            } else {
                // single или multiple
                const opts = [];
                const correctCount = type === 'single' ? 1 : faker.number.int({min: 1, max: 4});
                for (let j = 0; j < 4; j++) {
                    opts.push({
                        text: faker.lorem.words(2),
                        isCorrect: j < correctCount
                    });
                }
                await Question.create({...base, options: opts});
            }
        }
    }

    // 4) Попытки
    console.log('🧪 Создаём попытки…');
    for (const quiz of quizzes) {
        const atCnt = faker.number.int({min: 0, max: 10});
        let totalScore = 0;
        for (let i = 0; i < atCnt; i++) {
            const score = faker.number.int({min: 0, max: 100});
            totalScore += score;
            await Attempt.create({
                user: faker.helpers.arrayElement(users)._id,
                quiz: quiz._id,
                answers: {}, // для простоты пропускаем подробные ответы
                score,
            });
            quiz.stats.attemptsCount++;
        }
        if (quiz.stats.attemptsCount) {
            quiz.stats.averageScore = Math.round(totalScore / quiz.stats.attemptsCount);
        }

        await quiz.save();
    }

    console.log('✅ Сиды завершены!');
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
