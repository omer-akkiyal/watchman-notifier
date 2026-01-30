const express = require('express');
const app = express();
app.use(express.json());

app.post('/github-webhook', (req, res) => {
    console.log('--- YENİ BİLDİRİM GELDİ ---');
    console.log('Repo:', req.body.repository?.full_name);
    console.log('Aksiyon:', req.body.pusher?.name, 'bir push yaptı.');
    
    res.status(200).send('Webhook alındı!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Watchman Dinleniyor: Port ${PORT}`));