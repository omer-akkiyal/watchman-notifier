const express = require('express');
const app = express();

app.use(express.json());

// Ana sayfa rotası
app.get('/', (req, res) => {
    res.status(200).send('Watchman Servisi Ayakta! 🚀');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Watchman Dinleniyor: Port ${PORT}`);
});