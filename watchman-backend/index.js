require('dotenv').config();
const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs'); 

const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"], credentials: true }
});

app.use(express.static(path.join(__dirname, '../watchman-frontend/dist')));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Bağlantısı Başarılı! 🧠'))
    .catch(err => console.error('MongoDB Hatası:', err));

const User = mongoose.model('User', new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}));

const Watchman = mongoose.model('Watchman', new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ruleName: String,
    targetId: String,
    webhookToken: { type: String, unique: true, default: () => uuidv4() },
    isActive: { type: Boolean, default: true }
}));

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Çakışma kontrolü
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'Bu e-posta zaten kullanımda.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'Hesap başarıyla oluşturuldu.' });
    } catch (err) {
        res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { email: user.email, id: user._id } });
    } else {
        res.status(401).json({ error: 'E-posta veya şifre yanlış.' });
    }
});

app.post('/api/watchmen', async (req, res) => {
    const { userId, ruleName, targetId } = req.body;
    try {
        const newWatchman = new Watchman({ userId, ruleName, targetId });
        await newWatchman.save();
        res.json(newWatchman);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/watchmen/:userId', async (req, res) => {
    try {
        const rules = await Watchman.find({ userId: req.params.userId });
        res.json(rules);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/watchmen/:id', async (req, res) => {
    try {
        await Watchman.findByIdAndDelete(req.params.id);
        res.json({ message: 'Bekçi kalıcı olarak silindi.' });
    } catch (err) { res.status(500).json({ error: 'Silme hatası.' }); }
});

let sock;
let isConnected = false;

app.get('/api/whatsapp/status', (req, res) => {
    res.json({ status: isConnected ? 'connected' : 'disconnected' });
});

app.post('/api/whatsapp/logout', async (req, res) => {
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

app.get('/api/groups', async (req, res) => {
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