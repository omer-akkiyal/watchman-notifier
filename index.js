require('dotenv').config();
const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

const userSchema = new mongoose.Schema({
    githubUsername: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true }, // 905xxxxxxxxx formatında
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Bağlantısı Başarılı! 🧠'))
    .catch(err => console.error('MongoDB Bağlantı Hatası:', err));

let sock;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('.baileys_auth');

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        browser: ["Watchman Service", "Chrome", "1.0.0"]
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log('HAYDİ QR KODU OKUT:');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('Watchman WhatsApp Bağlantısı Başarılı! ✅');
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

app.post('/api/register', async (req, res) => {
    const { githubUsername, phoneNumber, secretKey } = req.body;

    if (secretKey !== process.env.REGISTRATION_SECRET) {
        return res.status(403).json({ error: 'Yetkisiz erişim! Geçersiz Secret Key.' });
    }

    if (!githubUsername || !phoneNumber) {
        return res.status(400).json({ error: 'GitHub kullanıcı adı ve telefon numarası zorunludur.' });
    }

    try {
        const user = await User.findOneAndUpdate(
            { githubUsername: githubUsername.toLowerCase() },
            { phoneNumber: phoneNumber.replace(/\D/g, ''), isActive: true }, 
            { upsert: true, new: true }
        );
        res.status(200).json({ message: 'Kullanıcı başarıyla kaydedildi/güncellendi!', user });
    } catch (err) {
        res.status(500).json({ error: 'Veritabanı hatası: ' + err.message });
    }
});

app.post('/webhook/:githubUser', async (req, res) => {
    const { githubUser } = req.params;
    const data = req.body;
    
    try {
        const user = await User.findOne({ githubUsername: githubUser.toLowerCase() });

        if (user && user.isActive && sock && data.repository) {
            const repoName = data.repository.full_name;
            const pusher = data.pusher ? data.pusher.name : 'Bilinmeyen';
            const message = `🔔 *Watchman Bildirimi*\n\nKullanıcı: ${githubUser}\nRepo: ${repoName}\nAksiyon: Push yapıldı! 🚀`;
            
            const formattedNumber = `${user.phoneNumber}@s.whatsapp.net`;
            
            await sock.sendMessage(formattedNumber, { text: message });
            console.log(`[${new Date().toLocaleTimeString()}] Mesaj ${githubUser} kullanıcısına gönderildi.`);
        }
    } catch (error) {
        console.error('Webhook işleme hatası:', error);
    }
    res.status(200).send('OK');
});

app.get('/', (req, res) => res.send('Watchman SaaS Servisi Ayakta! 🚀'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Watchman Dinleniyor: Port ${PORT}`);
    connectToWhatsApp();
});