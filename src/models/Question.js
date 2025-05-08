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
        enum: ['single', 'multiple', 'text', 'truefalse'],
        default: 'single',
    },
    // для типов single/multiple:
    options: [{
        text: {type: String, required: true},
        // только для single/multiple:
        isCorrect: {type: Boolean, default: false},
    }],
}, {
    timestamps: true,
});

export default model('Question', questionSchema);
