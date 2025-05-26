import mongoose from 'mongoose';
import { config } from 'dotenv';
import Question from '../src/models/Question.js';
import { Types } from 'mongoose';

config();

async function migrate() {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('🔄 Запуск миграции: добавление _id для options');

    const questions = await Question.find({ 'options._id': { $exists: false } });
    let updated = 0;
    for (const q of questions) {
        let changed = false;
        q.options = q.options.map(opt => {
            if (!opt._id) {
                changed = true;
                return { ...opt.toObject(), _id: new Types.ObjectId() };
            }
            return opt;
        });
        if (changed) {
            await q.save();
            updated++;
        }
    }
    console.log(`✅ Миграция завершена. Обновлено вопросов: ${updated}`);
    process.exit(0);
}

migrate().catch(err => {
    console.error(err);
    process.exit(1);
}); 