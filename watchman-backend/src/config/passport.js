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
    callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            user = await User.create({
                googleId: profile.id,
                email: profile.emails[0].value,
                isVerified: true // Social login email doğrulandı sayılır
            });
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

// GitHub Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/api/auth/github/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ githubId: profile.id });
        if (!user) {
            // Github bazen email vermez, null kontrolü
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            user = await User.create({
                githubId: profile.id,
                email: email, // Email yoksa null, bu durum yönetilmeli
                isVerified: true
            });
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

module.exports = passport;
