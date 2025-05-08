import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

passport.use(new LocalStrategy(
    {usernameField: 'email', passwordField: 'password'},
    async (email, password, done) => {
        try {
            const user = await User.findOne({email: email.toLowerCase()});
            if (!user) return done(null, false, {message: 'Неверный email'});

            const ok = await bcrypt.compare(password, user.passwordHash);
            if (!ok) return done(null, false, {message: 'Неверный пароль'});

            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
));

// Что хранить в сессии
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Как из сессии восстанавливать юзера
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id).select('-passwordHash');
        done(null, user);
    } catch (err) {
        done(err);
    }
});

export default passport;
