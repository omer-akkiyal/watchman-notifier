require('dotenv').config();
const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

const app = express();
app.use(express.json());

let sock; // WhatsApp bağlantı objesi

async function connectToWhatsApp() {
    // 1. Oturum yönetimi (Kalıcı giriş için)
    const { state, saveCreds } = await useMultiFileAuthState('.baileys_auth');

    // 2. Soket bağlantısını kur
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }), // Log kirliliğini engeller
        browser: ["Watchman Service", "Chrome", "1.0.0"]
    });

    // 3. Bağlantı olaylarını dinle
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('HAYDİ QR KODU OKUT:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Bağlantı kapandı, tekrar bağlanılıyor...', shouldReconnect);
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('Watchman WhatsApp Bağlantısı Başarılı! ✅ (Baileys)');
        }
    });

    // Kimlik bilgilerini her güncellemede kaydet
    sock.ev.on('creds.update', saveCreds);
}

// 4. GitHub Webhook Endpoint
app.post('/github-webhook', async (req, res) => {
    const data = req.body;
    
    if (data.repository && sock) {
        const repoName = data.repository.full_name;
        const pusher = data.pusher ? data.pusher.name : 'Bilinmeyen';
        const message = `🔔 *Watchman Bildirimi*\n\nRepo: ${repoName}\nAksiyon: ${pusher} tarafından push yapıldı.`;
        
        try {
            const myNumber = process.env.MY_NUMBER; // Format: 905xxxxxxxxx@s.whatsapp.net
            if (myNumber) {
                // Baileys'te numara formatı biraz farklıdır (@s.whatsapp.net)
                const formattedNumber = myNumber.includes('@') ? myNumber : `${myNumber}@s.whatsapp.net`;
                await sock.sendMessage(formattedNumber, { text: message });
                console.log(`[${new Date().toLocaleTimeString()}] Mesaj gönderildi.`);
            }
        } catch (error) {
            console.error('Mesaj hatası:', error);
        }
    }
    res.status(200).send('OK');
});

app.get('/', (req, res) => res.send('Watchman Baileys Servisi Ayakta! 🚀'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Watchman Dinleniyor: Port ${PORT}`);
    connectToWhatsApp();
});