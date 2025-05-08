// src/models/Comment.js
import mongoose from 'mongoose';

const {Schema, model} = mongoose;

const commentSchema = new Schema({
    quiz: {
        type: Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    text: {
        type: String,
        required: true,
        trim: true,
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
}, {
    timestamps: {createdAt: 'createdAt', updatedAt: false}
});

export default model('Comment', commentSchema);
