// src/models/Quiz.js
import mongoose from 'mongoose';
import crypto from 'crypto';

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
    categories: [{
        type: Schema.Types.ObjectId,
        ref: 'Category'
    }],
    isPublic: {
        type: Boolean,
        default: true,
    },
    accessToken: {
        type: String,
        unique: true,
        sparse: true,
    },
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
    localField: '_id',
    foreignField: 'quiz',
    justOne: true,
    pipeline: [
        {$group: {_id: '$user'}},
        {$count: 'count'}
    ]
});

quizSchema.pre('save', function (next) {
    if (!this.isPublic && !this.accessToken) {
        this.accessToken = crypto.randomBytes(8).toString('hex');
    }
    next();
});

export default model('Quiz', quizSchema);
