// src/models/Attempt.js
import mongoose from 'mongoose';

const {Schema, model} = mongoose;

const attemptSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quiz: {
        type: Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    answers: {
        type: Map,
        of: Schema.Types.Mixed,
        required: true
    },
    score: {
        type: Number,
        required: true,
        default: 0
    },
}, {
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: false
    }
});

export default model('Attempt', attemptSchema);
