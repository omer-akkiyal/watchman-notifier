const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://watchman-notifier.onrender.com/api/auth/google/callback",
    proxy: true
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // 1. Google ID ile ara
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
            return done(null, user);
        }

        // 2. Email ile ara (Eğer Google ID yoksa ama email kayıtlıysa)
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

        // Email yoksa hata dönmemiz gerekebilir ama şimdilik devam edelim veya null user create edemeyiz (email required).
        // Eğer email yoksa login başarısız olmalı.
        if (!email) {
            return done(new Error("Google hesabınızda onaylı bir e-posta adresi bulunamadı."), null);
        }

        user = await User.findOne({ email });

        if (user) {
            // Mevcut hesabı Google ile bağla
            user.googleId = profile.id;
            // Eğer daha önce doğrulanmadıysa, Google ile doğrulandı sayabiliriz
            if (!user.isVerified) user.isVerified = true;
            await user.save();
            return done(null, user);
        }

        // 3. Yeni kullanıcı oluştur
        user = await User.create({
            googleId: profile.id,
            email: email,
            isVerified: true
        });

        return done(null, user);
    } catch (err) {
        console.error("Google Auth Error:", err);
        return done(err, null);
    }
}));

// GitHub Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "https://watchman-notifier.onrender.com/api/auth/github/callback",
    proxy: true
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ githubId: profile.id });

        if (user) {
            return done(null, user);
        }

        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

        if (email) {
            user = await User.findOne({ email });
            if (user) {
                user.githubId = profile.id;
                if (!user.isVerified) user.isVerified = true;
                await user.save();
                return done(null, user);
            }
        }

        // Yeni kullanıcı
        user = await User.create({
            githubId: profile.id,
            email: email, // Email yoksa null
            isVerified: true
        });

        return done(null, user);
    } catch (err) {
        console.error("GitHub Auth Error:", err);
        return done(err, null);
    }
}));

module.exports = passport;
