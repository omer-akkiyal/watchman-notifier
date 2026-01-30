const express = require('express');
const app = express();

app.use(express.json());

// Ana Sayfa (Health Check)
app.get('/', (req, res) => {
    res.status(200).send('Watchman Servisi Ayakta! 🚀');
});

// GitHub Webhook Endpoint
app.post('/github-webhook', (req, res) => {
    const data = req.body;
    
    // GitHub'dan gelen push bildirimini terminale yazdır
    if (data.repository) {
        const repoName = data.repository.full_name;
        const pusher = data.pusher ? data.pusher.name : 'Bilinmeyen';
        console.log(`[${new Date().toLocaleTimeString()}] 🔔 Bildirim: ${repoName} reposuna ${pusher} tarafından push yapıldı.`);
    }

    res.status(200).send('Webhook Alındı');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Watchman Dinleniyor: Port ${PORT}`);
});