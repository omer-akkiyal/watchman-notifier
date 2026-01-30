require('dotenv').config();
const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    whatsappConnected: { type: Boolean, default: false }
});

const watchmanSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ruleName: String,     
    targetId: String,     
    webhookToken: { type: String, unique: true, default: () => uuidv4() },
    isActive: { type: Boolean, default: true }
});

const User = mongoose.model('User', userSchema);
const Watchman = mongoose.model('Watchman', watchmanSchema);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Bağlantısı Başarılı! 🧠'))
    .catch(err => console.error('MongoDB Hatası:', err));

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'Hesap başarıyla oluşturuldu.' });
    } catch (err) {
        res.status(400).json({ error: 'Bu email zaten kullanımda.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { email: user.email, id: user._id } });
    } else {
        res.status(401).json({ error: 'Email veya şifre yanlış.' });
    }
});


app.post('/api/watchmen', async (req, res) => {
    const { userId, ruleName, targetId } = req.body;
    try {
        const newWatchman = new Watchman({ userId, ruleName, targetId });
        await newWatchman.save();
        res.json({ 
            message: 'Yeni bekçi kuruldu!', 
            webhookUrl: `https://${req.get('host')}/webhook/v1/${newWatchman.webhookToken}` 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/webhook/v1/:token', async (req, res) => {
    const { token } = req.params;
    const data = req.body;

    try {
        // Token'a sahip kuralı bul
        const watchman = await Watchman.findOne({ webhookToken: token, isActive: true });
        
        if (watchman && isConnected && data.repository) {
            const repoName = data.repository.full_name;
            const pusher = data.pusher ? data.pusher.name : 'Bilinmeyen';
            const message = `🔔 *Watchman Bildirimi*\n\nKural: ${watchman.ruleName}\nRepo: ${repoName}\nAksiyon: Push yapıldı! 🚀`;
            
            await sock.sendMessage(watchman.targetId, { text: message });
            console.log(`[${new Date().toLocaleTimeString()}] Token ${token} için mesaj iletildi.`);
        }
    } catch (error) {
        console.error('Webhook V2 Hatası:', error);
    }
    res.status(200).send('OK');
});

let sock;
let isConnected = false;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('.baileys_auth');
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        browser: ["Watchman Service", "Chrome", "1.0.0"]
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        if (qr) qrcode.generate(qr, { small: true });
        if (connection === 'close') {
            isConnected = false;
            setTimeout(() => connectToWhatsApp(), 5000);
        } else if (connection === 'open') {
            isConnected = true;
            console.log('Watchman WhatsApp Bağlantısı Başarılı! ✅');
        }
    });
    sock.ev.on('creds.update', saveCreds);
}

// Grupları Listele
app.get('/api/groups', async (req, res) => {
    try {
        if (!isConnected) return res.status(503).json({ error: 'WhatsApp bağlı değil.' });
        const groups = await sock.groupFetchAllParticipating();
        res.json(Object.values(groups).map(g => ({ name: g.subject, id: g.id })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/', (req, res) => res.send('Watchman V2 SaaS Platform Active! 🚀'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Watchman V2 Dinleniyor: Port ${PORT}`);
    connectToWhatsApp();
});