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
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
            return done(null, user);
        }

        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

        if (!email) {
            return done(new Error("Google hesabınızda onaylı bir e-posta adresi bulunamadı."), null);
        }

        user = await User.findOne({ email });

        if (user) {
            user.googleId = profile.id;
            if (!user.isVerified) user.isVerified = true;
            // İsim yoksa güncelle
            if (!user.name) user.name = profile.displayName;
            await user.save();
            return done(null, user);
        }

        user = await User.create({
            name: profile.displayName,
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
                if (!user.name) user.name = profile.displayName || profile.username;
                await user.save();
                return done(null, user);
            }
        }

        // Yeni kullanıcı
        user = await User.create({
            name: profile.displayName || profile.username,
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
