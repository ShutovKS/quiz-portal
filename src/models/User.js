// src/models/User.js
import mongoose from 'mongoose';

const {Schema, model} = mongoose;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
}, {
    timestamps: {createdAt: 'registeredAt', updatedAt: false}
});

userSchema.virtual('createdCount', {
    ref: 'Quiz',
    localField: '_id',
    foreignField: 'user',
    count: true
});

userSchema.virtual('takenCount', {
    ref: 'Attempt',
    localField: '_id',
    foreignField: 'user',
    count: true
});

export default model('User', userSchema);
