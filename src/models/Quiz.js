// src/models/Quiz.js
import mongoose from 'mongoose';

const {Schema, model} = mongoose;

const quizSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    isPublic: {
        type: Boolean,
        default: true,
    },
    // если приватный — сохраним токен для доступа
    accessToken: {
        type: String,
        unique: true,
        sparse: true,
    },
    // агрегаты для быстрого рендера
    stats: {
        attemptsCount: {type: Number, default: 0},
        averageScore: {type: Number, default: 0},
        commentsCount: {type: Number, default: 0},
    },
}, {
    timestamps: true,
});

// генерить токен при создании приватного квиза
quizSchema.pre('save', function (next) {
    if (!this.isPublic && !this.accessToken) {
        this.accessToken = require('crypto').randomBytes(8).toString('hex');
    }
    next();
});

export default model('Quiz', quizSchema);
