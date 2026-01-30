require('dotenv').config(); 
const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs'); 
const path = require('path'); 

const app = express();
app.use(express.json());

const sessionDir = path.join(__dirname, '.wwebjs_auth');
if (fs.existsSync(sessionDir)) {
    console.log('Eski ve hatalı oturum verileri temizleniyor... 🧹');
    try {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        console.log('Temizlik tamamlandı, yeni QR oluşturuluyor.');
    } catch (err) {
        console.error('Klasör silinirken bir hata oluştu:', err);
    }
}

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth' 
    }),
    puppeteer: {
        headless: true, 
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-extensions',
            '--disable-dev-shm-usage',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
        ],
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