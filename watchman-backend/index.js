require('dotenv').config();
const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const connectDB = require('./src/config/db');
require('./src/config/passport');
const authRoutes = require('./src/routes/authRoutes');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "http://localhost:5173", methods: ["GET", "POST"], credentials: true }
});

connectDB();

app.use('/api/auth', authRoutes);

app.use(express.static(path.join(__dirname, '../watchman-frontend/dist')));

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { protect } = require('./src/middlewares/authMiddleware');

const Watchman = mongoose.model('Watchman', new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ruleName: String,
    targetId: String,
    webhookToken: { type: String, unique: true, default: () => uuidv4() },
    isActive: { type: Boolean, default: true }
}));

// ... (Socket logic ve eski route'lar buranın altında kalacak, temizlik sonraki fazda)
// NOT: Buradaki User model tanımını kaldırdık, artık src/models/User.js kullanılıyor.
// Ancak Watchman modeli hala burada. İlerde models/Watchman.js'e taşınmalı.

app.post('/api/watchmen', protect, async (req, res) => {

    const { ruleName, targetId } = req.body;
    try {
        const newWatchman = new Watchman({ userId: req.user._id, ruleName, targetId });
        await newWatchman.save();
        res.json(newWatchman);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/watchmen/:userId', protect, async (req, res) => {
    if (req.params.userId !== req.user._id.toString()) {
        return res.status(401).json({ error: 'Yetkisiz erişim.' });
    }
    try {
        const rules = await Watchman.find({ userId: req.params.userId });
        res.json(rules);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/watchmen/:id', protect, async (req, res) => {
    try {
        const watchman = await Watchman.findById(req.params.id);
        if (!watchman) return res.status(404).json({ error: 'Bekçi bulunamadı.' });

        if (watchman.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: 'Bu işlemi yapmaya yetkiniz yok.' });
        }

        await Watchman.findByIdAndDelete(req.params.id);
        res.json({ message: 'Bekçi kalıcı olarak silindi.' });
    } catch (err) { res.status(500).json({ error: 'Silme hatası.' }); }
});

let sock;
let isConnected = false;

app.get('/api/whatsapp/status', protect, (req, res) => {
    res.json({ status: isConnected ? 'connected' : 'disconnected' });
});

app.post('/api/whatsapp/logout', protect, async (req, res) => {
    try {
        if (sock) await sock.logout();
        isConnected = false;
        const authPath = path.join(__dirname, '.baileys_auth');
        if (fs.existsSync(authPath)) {
            fs.rmSync(authPath, { recursive: true, force: true });
        }
        res.json({ message: 'WhatsApp oturumu kapatıldı.' });
        connectToWhatsApp();
    } catch (err) { res.status(500).json({ error: 'Oturum kapatılamadı.' }); }
});

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('.baileys_auth');
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        browser: ["Watchman SaaS", "Chrome", "1.0.0"]
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) io.emit('qr', qr);

        if (connection === 'close') {
            isConnected = false;
            io.emit('connection_status', 'disconnected');
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) setTimeout(() => connectToWhatsApp(), 5000);
        } else if (connection === 'open') {
            isConnected = true;
            io.emit('connection_status', 'connected');
            console.log('WhatsApp Bağlantısı Aktif! ✅');
        }
    });
    sock.ev.on('creds.update', saveCreds);
}

app.post('/webhook/v1/:token', async (req, res) => {
    const { token } = req.params;
    const data = req.body;
    try {
        const watchman = await Watchman.findOne({ webhookToken: token, isActive: true });
        if (watchman && isConnected && data.repository) {
            const message = `🔔 *Watchman Bildirimi*\n\nKural: ${watchman.ruleName}\nRepo: ${data.repository.full_name}\nAksiyon: Push yapıldı! 🚀`;
            await sock.sendMessage(watchman.targetId, { text: message });
        }
    } catch (error) { console.error('Webhook Hatası:', error); }
    res.status(200).send('OK');
});

app.get('/api/groups', protect, async (req, res) => {
    try {
        if (!isConnected) return res.status(503).json({ error: 'WhatsApp bağlı değil.' });
        const groups = await sock.groupFetchAllParticipating();
        res.json(Object.values(groups).map(g => ({ name: g.subject, id: g.id })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../watchman-frontend/dist', 'index.html'));
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Watchman V3 Backend Aktif: ${PORT}`);
    connectToWhatsApp();
});