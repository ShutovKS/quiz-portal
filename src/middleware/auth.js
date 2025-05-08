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

        const module = await import(`../models/${modelName}.js`);
        const Model = module.default;
        const id = req.params.id || req.params.quizId;
        const resource = await Model.findById(id);
        if (!resource) return res.status(404).send('Not found');
        const ownerId = resource.author?.toString() || resource.user?.toString();
        if (ownerId !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).send('Forbidden');
        }
        next();
    };
}