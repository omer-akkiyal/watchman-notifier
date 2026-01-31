const express = require('express');
const passport = require('passport');
const { register, login, logout, verifyEmail } = require('../controllers/authController');
const { validate, registerSchema, loginSchema } = require('../middlewares/validationMiddleware');

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/logout', logout);
router.get('/verifyemail/:token', verifyEmail);

const jwt = require('jsonwebtoken');

const setTokenCookie = (res, user) => {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });

    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    };

    res.cookie('token', token, options);
};

const CLIENT_URL = process.env.CLIENT_URL || "https://watchman-notifier.onrender.com";

// Google Auth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
    (req, res, next) => {
        passport.authenticate('google', { session: false }, (err, user, info) => {
            if (err) {
                console.error("Google Auth Callback Error:", err);
                return res.redirect(`${CLIENT_URL}/login?error=auth_failed`);
            }
            if (!user) {
                console.error("Google Auth No User:", info);
                return res.redirect(`${CLIENT_URL}/login?error=no_user`);
            }

            // Hem Cookie hem Query Param olarak gönderelim (Garanti olsun)
            setTokenCookie(res, user);
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

            // User bilgilerini URL parametresi olarak geçiyoruz (Frontend AuthContext yakalayacak)
            const name = encodeURIComponent(user.name || '');
            const email = encodeURIComponent(user.email || '');

            res.redirect(`${CLIENT_URL}?token=${token}&name=${name}&email=${email}`);
        })(req, res, next);
    }
);

// GitHub Auth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback',
    (req, res, next) => {
        passport.authenticate('github', { session: false }, (err, user, info) => {
            if (err) {
                console.error("GitHub Auth Callback Error:", err);
                return res.redirect(`${CLIENT_URL}/login?error=auth_failed`);
            }
            if (!user) {
                return res.redirect(`${CLIENT_URL}/login?error=no_user`);
            }

            setTokenCookie(res, user);
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

            const name = encodeURIComponent(user.name || '');
            const email = encodeURIComponent(user.email || '');

            res.redirect(`${CLIENT_URL}?token=${token}&name=${name}&email=${email}`);
        })(req, res, next);
    }
);

module.exports = router;
