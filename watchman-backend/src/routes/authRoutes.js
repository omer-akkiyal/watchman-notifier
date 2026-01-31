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

// Helper: Token üret ve Cookie set et (Redirect öncesi)
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

// Google Auth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: false }), // Session false çünkü JWT kullanıyoruz
    (req, res) => {
        setTokenCookie(res, req.user);
        res.redirect('http://localhost:5173/');
    }
);

// GitHub Auth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback',
    passport.authenticate('github', { failureRedirect: '/login', session: false }),
    (req, res) => {
        setTokenCookie(res, req.user);
        res.redirect('http://localhost:5173/');
    }
);

module.exports = router;
