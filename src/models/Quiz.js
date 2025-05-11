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
    user: {
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
    },
}, {
    timestamps: true,
});

quizSchema.virtual('attemptsCountDynamic', {
    ref: 'Attempt',
    localField: '_id',
    foreignField: 'quiz',
    count: true
});

quizSchema.virtual('uniqueUsersCount', {
    ref: 'Attempt',
    let: {quizId: '$_id'},
    pipeline: [
        {$match: {$expr: {$eq: ['$quiz', '$$quizId']}}},
        {$group: {_id: '$user'}},
        {$count: 'count'}
    ],
    justOne: true
});

// генерить токен при создании приватного квиза
quizSchema.pre('save', function (next) {
    if (!this.isPublic && !this.accessToken) {
        this.accessToken = require('crypto').randomBytes(8).toString('hex');
    }
    next();
});

export default model('Quiz', quizSchema);
