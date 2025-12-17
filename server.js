const express = require('express');
const axios = require('axios'); // API istekleri için
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// --- KONFIGÜRASYON ---
const API_PORT = 3000;
const BASE_URL = 'https://www.1secmail.com/api/v1/';

// --- GÜVENLİK VE LİMİTLEME ---
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 dakika
    max: 200, // Biraz daha esnek, çünkü frontend sık polling yapıyor
    standardHeaders: true,
    legacyHeaders: false,
});

// --- WEB API SUNUCUSU ---
const app = express();

app.use(helmet({
    contentSecurityPolicy: false, // AdSense için kapalı
}));
app.use(cors());
app.use(limiter);
app.use(express.static(path.join(__dirname, 'public')));

// 1. Mevcut Domainleri Getir
app.get('/api/domains', async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}?action=getDomainList`);
        res.json(response.data);
    } catch (error) {
        console.error('API Hatası:', error.message);
        res.status(500).json({ error: 'Domain listesi alınamadı' });
    }
});

// 2. Gelen Kutusunu Getir
app.get('/api/inbox', async (req, res) => {
    const { email } = req.query;
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Geçersiz email' });
    }

    const [login, domain] = email.split('@');

    try {
        const response = await axios.get(`${BASE_URL}?action=getMessages&login=${login}&domain=${domain}`);
        res.json(response.data);
    } catch (error) {
        console.error('Inbox Hatası:', error.message);
        res.status(500).json({ error: 'Mailler alınamadı' });
    }
});

// 3. Tekil Maili Oku
app.get('/api/message', async (req, res) => {
    const { email, id } = req.query;
    if (!email || !id) {
        return res.status(400).json({ error: 'Eksik parametre' });
    }

    const [login, domain] = email.split('@');

    try {
        const response = await axios.get(`${BASE_URL}?action=readMessage&login=${login}&domain=${domain}&id=${id}`);
        res.json(response.data);
    } catch (error) {
        console.error('Detay Hatası:', error.message);
        res.status(500).json({ error: 'Mail içeriği alınamadı' });
    }
});

app.listen(API_PORT, () => {
    console.log(`🚀 GERÇEK Mail Servisi Çalışıyor: http://localhost:${API_PORT}`);
    console.log(`🌍 Altyapı: 1secmail API`);
});
