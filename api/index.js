```javascript
const express = require('express');
const axios = require('axios');
const cors = require('cors');

// --- KONFIGÜRASYON ---
const BASE_URL = 'https://www.1secmail.com/api/v1/';

// --- WEB API SUNUCUSU ---
const app = express();

// Vercel Proxy Ayarı (Önemli)
app.set('trust proxy', 1);
app.use(cors());

// Statik dosya sunumunu kaldırdık (Vercel bunu otomatik yapar)
// Rate Limit ve Helmet'i geçici olarak kaldırdık (Hata kaynağı olabiliyorlar)

// Axios Ayarları
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
});

// API Rotaları
app.get('/api/domains', async (req, res) => {
    try {
        const response = await api.get('?action=getDomainList');
        res.json(response.data);
    } catch (error) {
        console.error('API Hatası (Domain):', error.message);
        // Hata olsa bile boş dönme, fallback listesi ver
        res.json(["1secmail.com", "1secmail.org", "1secmail.net"]);
    }
});

app.get('/api/inbox', async (req, res) => {
    const { email } = req.query;
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Geçersiz email' });
    const [login, domain] = email.split('@');
    try {
        const response = await api.get(`? action = getMessages & login=${ login }& domain=${ domain } `);
        res.json(response.data);
    } catch (error) {
        // Hata durumunda boş liste dön ki frontend patlamasın
        res.json([]);
    }
});

app.get('/api/message', async (req, res) => {
    const { email, id } = req.query;
    if (!email || !id) return res.status(400).json({ error: 'Eksik parametre' });
    const [login, domain] = email.split('@');
    try {
        const response = await api.get(`? action = readMessage & login=${ login }& domain=${ domain }& id=${ id } `);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Mail içeriği alınamadı' });
    }
});

// Vercel İçin Export
module.exports = app;
