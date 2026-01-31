const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/emailService');

const sendTokenResponse = (user, statusCode, res) => {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });

    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' // Production'da HTTPS zorunlu
    };

    res.status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
};

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // E-posta kontrolü
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın.' });
        }

        const user = await User.create({ name, email, password });

        const verificationToken = crypto.randomBytes(20).toString('hex');
        user.verificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
        await user.save(); // Token'ı kaydet

        const clientUrl = process.env.CLIENT_URL || 'https://watchman-notifier.onrender.com';
        const verifyUrl = `${clientUrl}/verify-email/${verificationToken}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Watchman V3 - Email Doğrulama',
                html: `<h1>Hoşgeldiniz ${user.name || ''}!</h1><p>Hesabınızı doğrulamak için lütfen <a href="${verifyUrl}">buraya tıklayın</a>.</p>`
            });
            res.status(200).json({ success: true, data: "Email gönderildi." });
        } catch (emailErr) {
            user.verificationToken = undefined;
            // Email hatasında kullanıcıyı silmiyoruz ama token'ı siliyor muyuz? 
            // Kullanıcı kalsın ama doğrulanamasın, tekrar mail isteyebilir. Burada save yapalım.
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ error: 'Kullanıcı oluşturuldu ancak email gönderilemedi.' });
        }

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Bu e-posta adresi zaten kayıtlı.' });
        }
        res.status(500).json({ error: err.message });
    }
};

exports.verifyEmail = async (req, res) => {
    const verificationToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({ verificationToken, isVerified: false });

    if (!user) {
        return res.status(400).json({ error: 'Geçersiz token.' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ error: 'Geçersiz kimlik bilgileri.' });
    }

    if (!user.isVerified) {
        return res.status(401).json({ error: 'Lütfen email adresinizi doğrulayın.' });
    }

    sendTokenResponse(user, 200, res);
};

exports.logout = async (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({ success: true, data: {} });
};
