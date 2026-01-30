require('dotenv').config(); // En üste ekle
const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const app = express();

app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: '/usr/bin/google-chrome-stable',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('HAYDİ QR KODU OKUT:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Watchman WhatsApp Bağlantısı Başarılı! ✅');
});

app.post('/github-webhook', async (req, res) => {
    const data = req.body;
    
    if (data.repository) {
        const repoName = data.repository.full_name;
        const pusher = data.pusher ? data.pusher.name : 'Bilinmeyen';
        const message = `🔔 *Watchman Bildirimi*\n\nRepo: ${repoName}\nAksiyon: ${pusher} tarafından push yapıldı.`;
        
        console.log(`[${new Date().toLocaleTimeString()}] WhatsApp'a gönderiliyor...`);
        
        try {
            
            const myNumber = process.env.MY_NUMBER;
            if (myNumber) {
                await client.sendMessage(myNumber, message);
            }
        } catch (error) {
            console.error('Mesaj gönderilirken hata oluştu:', error);
        }
    }
    res.status(200).send('OK');
});

app.get('/', (req, res) => res.send('Watchman Servisi Ayakta! 🚀'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    client.initialize();
    console.log(`Watchman Dinleniyor: Port ${PORT}`);
});