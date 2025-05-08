export function showHome(req, res) {
    res.render('pages/home', {
        title: 'Главная',
        user: req.session.userId ? req.session.userId : null,
    });
}
