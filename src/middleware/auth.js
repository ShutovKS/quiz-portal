// src/middleware/auth.js
export function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    req.flash('error', 'Сначала войдите в аккаунт');
    res.redirect('/login');
}

export function requireAdmin(req, res, next) {
    if (!req.session.userId || req.user.role !== 'admin') return res.status(403).send('Forbidden');
    next();
}

export function requireOwnerOrAdmin(modelName) {
    return async (req, res, next) => {
        const Model = require(`../models/${modelName}.js`).default;
        const resource = await Model.findById(req.params.id || req.params.quizId);
        if (!resource) return res.status(404).send('Not found');
        if (resource.author.toString() !== req.session.userId && req.user.role !== 'admin') {
            return res.status(403).send('Forbidden');
        }
        next();
    };
}
