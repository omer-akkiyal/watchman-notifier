require('dotenv').config();
const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// --- 🧠 GÜNCELLENMİŞ MONGODB ŞEMASI ---
const userSchema = new mongoose.Schema({
    githubUsername: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    targetType: { type: String, enum: ['private', 'group'], default: 'private' },
    targetId: { type: String }, // Grup ise '12345@g.us', değilse null
    isActive: { type: Boolean, default: true }
});
const User = mongoose.model('User', userSchema);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Bağlantısı Başarılı! 🧠'))
    .catch(err => console.error('MongoDB Hatası:', err));

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

// --- 🔍 GRUP LİSTELEME API ---
// Botun dahil olduğu grupları görmek için: /api/groups
app.get('/api/groups', async (req, res) => {
    try {
        if (!sock) return res.status(500).send('WhatsApp bağlantısı henüz kurulmadı.');
        const groups = await sock.groupFetchAllParticipating();
        const groupList = Object.values(groups).map(g => ({ name: g.subject, id: g.id }));
        res.json(groupList);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 🛡️ GÜVENLİ KAYIT API ---
app.post('/api/register', async (req, res) => {
    const { githubUsername, phoneNumber, targetType, targetId, secretKey } = req.body;

    if (secretKey !== process.env.REGISTRATION_SECRET) {
        return res.status(403).json({ error: 'Yetkisiz erişim!' });
    }

    try {
        const user = await User.findOneAndUpdate(
            { githubUsername: githubUsername.toLowerCase() },
            { 
                phoneNumber: phoneNumber.replace(/\D/g, ''), 
                targetType: targetType || 'private',
                targetId: targetId || null,
                isActive: true 
            },
            { upsert: true, new: true }
        );
        res.status(200).json({ message: 'Başarıyla kaydedildi!', user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 🚀 DİNAMİK WEBHOOK ENDPOINT ---
app.post('/webhook/:githubUser', async (req, res) => {
    const { githubUser } = req.params;
    const data = req.body;
    
    try {
        const user = await User.findOne({ githubUsername: githubUser.toLowerCase() });

        if (user && user.isActive && sock && data.repository) {
            const repoName = data.repository.full_name;
            const pusher = data.pusher ? data.pusher.name : 'Bilinmeyen';
            const message = `🔔 *Watchman Bildirimi*\n\nRepo: ${repoName}\nAksiyon: ${pusher} tarafından bir push yapıldı! 🚀`;
            
            // Hedef belirleme: Grup mu yoksa Özel mi?
            const target = user.targetType === 'group' ? user.targetId : `${user.phoneNumber}@s.whatsapp.net`;
            
            await sock.sendMessage(target, { text: message });
            console.log(`[${new Date().toLocaleTimeString()}] Mesaj ${githubUser} için ${target} hedefine gönderildi.`);
        }
    } catch (error) {
        console.error('Webhook Hatası:', error);
    }
    res.status(200).send('OK');
});

app.get('/', (req, res) => res.send('Watchman SaaS Gateway Active! 🚀'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Watchman Dinleniyor: Port ${PORT}`);
    connectToWhatsApp();
});