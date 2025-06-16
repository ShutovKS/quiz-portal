// src/models/Question.js
import mongoose from 'mongoose';

const {Schema, model} = mongoose;

const questionSchema = new Schema({
    quiz: {
        type: Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true,
    },
    text: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ['single', 'multiple', 'truefalse'],
        default: 'single',
    },
    options: [{
        _id: {type: Schema.Types.ObjectId, auto: true},
        text: {type: String, required: true},
        isCorrect: {type: Boolean, default: false},
    }],
}, {
    timestamps: true,
});

export default model('Question', questionSchema);
