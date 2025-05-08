// src/config/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✔ MongoDB подключен');
    } catch (err) {
        console.error('✖ MongoDB ошибка соединения:', err);
        process.exit(1);
    }
};