import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import Ajv from 'ajv';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Quiz from '../src/models/Quiz.js';
import Question from '../src/models/Question.js';

dotenv.config();

const QUIZZES_DIR = path.resolve('tools/generate_quizzes/quizzes');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/quizdb';

const quizSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Quiz",
    "type": "object",
    "required": ["title", "description", "userEmail", "questions"],
    "properties": {
        "title": { "type": "string", "minLength": 1 },
        "description": { "type": "string", "minLength": 1 },
        "userEmail": { "type": "string", "format": "email" },
        "isPublic": { "type": "boolean", "default": true },
        "questions": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "required": ["text", "type", "options"],
                "properties": {
                    "text": { "type": "string", "minLength": 1 },
                    "type": { "type": "string", "enum": ["single", "multiple", "truefalse"] },
                    "options": {
                        "type": "array",
                        "minItems": 2,
                        "items": {
                            "type": "object",
                            "required": ["text", "isCorrect"],
                            "properties": {
                                "text": { "type": "string", "minLength": 1 },
                                "isCorrect": { "type": "boolean" }
                            }
                        }
                    }
                }
            }
        }
    }
};

async function main() {
    await mongoose.connect(MONGO_URI);

    let files;
    try {
        files = await fs.readdir(QUIZZES_DIR);
    } catch (e) {
        console.error(`❌ Не удалось прочитать папку с квизами: ${QUIZZES_DIR}`);
        process.exit(1);
    }
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(quizSchema);

    let success = 0, fail = 0;

    for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const filePath = path.join(QUIZZES_DIR, file);
        try {
            const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
            if (!validate(data)) {
                console.error(`❌ ${file}: Ошибка валидации:`, ajv.errorsText(validate.errors));
                fail++;
                continue;
            }
            const user = await User.findOne({ email: data.userEmail });
            if (!user) {
                console.error(`❌ ${file}: Пользователь не найден: ${data.userEmail}`);
                fail++;
                continue;
            }
            const quiz = await Quiz.create({
                title: data.title,
                description: data.description,
                user: user._id,
                isPublic: data.isPublic !== undefined ? data.isPublic : true
            });
            for (const q of data.questions) {
                await Question.create({
                    quiz: quiz._id,
                    text: q.text,
                    type: q.type,
                    options: q.options
                });
            }
            console.log(`✅ Импортирован: ${file}`);
            success++;
        } catch (e) {
            console.error(`❌ ${file}: ${e.message}`);
            fail++;
        }
    }

    console.log(`\nГотово! Успешно: ${success}, с ошибками: ${fail}`);
    await mongoose.disconnect();
}

main(); 