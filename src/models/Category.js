// src/models/Category.js
import mongoose from 'mongoose';
import slugify from 'slugify';

const {Schema, model} = mongoose;

const categorySchema = new Schema({
    name: {type: String, required: true, unique: true, trim: true},
    slug: {type: String, unique: true, index: true}
}, {timestamps: true});

/* генерим slug автоматически */
categorySchema.pre('save', function (next) {
    if (!this.isModified('name')) return next();
    this.slug = slugify(this.name, {lower: true, strict: true});
    next();
});

export default model('Category', categorySchema);
