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
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (!email) {
            return done(new Error("Google hesabınızda onaylı bir e-posta adresi bulunamadı."), null);
        }

        // Upsert Mantığı: Google ID veya Email ile bul, yoksa oluştur
        // Ancak $or ile upsert Mongoose'da doğrudan yok.
        // Önce bulalım, sonra update veya create yapalım ama try-catch ile duplicate'i yakalayalım.

        // 1. Önce Google ID ile kontrol
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
            if (!user.name) { user.name = profile.displayName; await user.save(); }
            return done(null, user);
        }

        // 2. Email ile kontrol
        user = await User.findOne({ email });

        if (user) {
            // Eşleşen email varsa hesabı Google ID ile güncelle
            user.googleId = profile.id;
            if (!user.isVerified) user.isVerified = true;
            if (!user.name) user.name = profile.displayName;
            await user.save();
            return done(null, user);
        }

        // 3. Yeni Kullanıcı Oluştur (Duplicate Key Hatasını Yakala)
        try {
            user = await User.create({
                googleId: profile.id,
                email: email,
                name: profile.displayName,
                isVerified: true
            });
            return done(null, user);
        } catch (createErr) {
            if (createErr.code === 11000) {
                // Eğer tam bu anda başka bir request ile aynı email kaydedildiyse (Race Condition)
                // Tekrar bulmayı dene
                user = await User.findOne({ email });
                if (user) {
                    user.googleId = profile.id;
                    if (!user.isVerified) user.isVerified = true;
                    await user.save();
                    return done(null, user);
                }
            }
            throw createErr;
        }

    } catch (err) {
        console.error("Google Auth Error:", err);
        return done(err, null);
    }
}));

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "https://watchman-notifier.onrender.com/api/auth/github/callback",
    proxy: true
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // 1. GitHub ID ile kontrol
        let user = await User.findOne({ githubId: profile.id });

        if (user) {
            if (!user.name) { user.name = profile.displayName || profile.username; await user.save(); }
            return done(null, user);
        }

        // 2. Email Belirleme ve Kontrol
        let email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (!email) {
            email = `${profile.username || profile.id}@github.com`;
        }

        user = await User.findOne({ email });

        if (user) {
            user.githubId = profile.id;
            if (!user.isVerified) user.isVerified = true;
            if (!user.name) user.name = profile.displayName || profile.username;
            await user.save();
            return done(null, user);
        }

        // 3. Yeni Kullanıcı Oluştur (Race Condition Korumalı)
        try {
            user = await User.create({
                name: profile.displayName || profile.username || 'GitHub User',
                githubId: profile.id,
                email: email,
                isVerified: true,
                password: Math.random().toString(36).slice(-8)
            });
            return done(null, user);
        } catch (createErr) {
            if (createErr.code === 11000) {
                // E-posta çakışması (Race condition)
                user = await User.findOne({ email });
                if (user) {
                    user.githubId = profile.id;
                    if (!user.isVerified) user.isVerified = true;
                    await user.save();
                    return done(null, user);
                }
            }
            throw createErr;
        }

    } catch (err) {
        console.error("GitHub Auth Error:", err);
        return done(err, null);
    }
}));

module.exports = passport;
