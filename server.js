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
// Statik dosyaları sadece localde bu şekilde sunuyoruz. Vercel'de vercel.json halledecek.
app.use(express.static(path.join(__dirname, 'public')));

// Axios Ayarları (Browser gibi görünmek için User-Agent ekliyoruz)
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
});

// 1. Mevcut Domainleri Getir
app.get('/api/domains', async (req, res) => {
    try {
        const response = await api.get('?action=getDomainList');
        res.json(response.data);
    } catch (error) {
        console.error('API Hatası (Domain):', error.message);
        if (error.response) console.error('Detay:', error.response.data);
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
        const response = await api.get(`?action=getMessages&login=${login}&domain=${domain}`);
        res.json(response.data);
    } catch (error) {
        console.error('API Hatası (Inbox):', error.message);
        if (error.response) console.error('Detay:', error.response.data);
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
        const response = await api.get(`?action=readMessage&login=${login}&domain=${domain}&id=${id}`);
        res.json(response.data);
    } catch (error) {
        console.error('API Hatası (Message):', error.message);
        if (error.response) console.error('Detay:', error.response.data);
        res.status(500).json({ error: 'Mail içeriği alınamadı' });
    }
});

// Vercel için Export ediyoruz
module.exports = app;

// Localde çalışırken port dinle (Vercel'de bu kısım çalışmaz)
if (require.main === module) {
    app.listen(API_PORT, () => {
        console.log(`🚀 GERÇEK Mail Servisi Çalışıyor: http://localhost:${API_PORT}`);
        console.log(`🌍 Altyapı: 1secmail API`);
    });
}
