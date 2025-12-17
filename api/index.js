const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// --- KONFIGÜRASYON ---
const BASE_URL = 'https://www.1secmail.com/api/v1/';

// --- GÜVENLİK VE LİMİTLEME ---
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
});

// --- WEB API SUNUCUSU ---
const app = express();

app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(cors());
app.use(limiter);

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
        res.status(500).json({ error: 'Domain listesi alınamadı' });
    }
});

app.get('/api/inbox', async (req, res) => {
    const { email } = req.query;
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Geçersiz email' });
    const [login, domain] = email.split('@');
    try {
        const response = await api.get(`?action=getMessages&login=${login}&domain=${domain}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Mailler alınamadı' });
    }
});

app.get('/api/message', async (req, res) => {
    const { email, id } = req.query;
    if (!email || !id) return res.status(400).json({ error: 'Eksik parametre' });
    const [login, domain] = email.split('@');
    try {
        const response = await api.get(`?action=readMessage&login=${login}&domain=${domain}&id=${id}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Mail içeriği alınamadı' });
    }
});

// Vercel İçin Export
module.exports = app;
