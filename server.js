const express = require('express');
const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

// --- KONFIGÜRASYON ---
// Kullanılabilecek Domainler Listesi
const DOMAINS = [
    'ghostmail.com',
    'ghostmail.com', // .com ağırlıklı olsun diye iki kere ekledim
    'fastinbox.com',
    'secureline.com',
    'ghostdrop.net',
    'privatemail.live'
];
const API_PORT = 3000;
const SMTP_PORT = 2525; // Normalde 25 olur ama localde izin vermeyebilirler, test için 2525

// --- VERİTABANI KURULUMU ---
const db = new sqlite3.Database(':memory:'); // Test için RAM'de tutuyoruz. İstersen dosyaya çeviririz.

db.serialize(() => {
    db.run(`CREATE TABLE emails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        to_address TEXT,
        from_address TEXT,
        subject TEXT,
        text_content TEXT,
        html_content TEXT,
        otp_codes TEXT,
        links TEXT,
        received_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// --- YARDIMCI FONKSİYONLAR ---
function extractOTP(text) {
    if (!text) return null;
    // 4 ile 8 basamaklı sayıları arar. Genelde OTP'ler böyledir.
    const regex = /\b\d{4,8}\b/g;
    const matches = text.match(regex);
    return matches ? matches.join(', ') : null;
}

function extractLinks(text) {
    if (!text) return null;
    const regex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(regex);
    return matches ? matches : [];
}

// --- SMTP SUNUCUSU (Mail Alma Kısmı) ---
const mailServer = new SMTPServer({
    authOptional: true, // Herkes mail atabilsin diye
    onData(stream, session, callback) {
        simpleParser(stream, (err, parsed) => {
            if (err) {
                console.error('Mail parse hatası:', err);
                return callback(err);
            }

            const toAddress = parsed.to && parsed.to.text ? parsed.to.text : 'unknown';
            const fromAddress = parsed.from && parsed.from.text ? parsed.from.text : 'unknown';
            const subject = parsed.subject;
            const textContent = parsed.text;
            const htmlContent = parsed.html;

            // OTP ve Link Bulma
            const otpCodes = extractOTP(textContent || htmlContent);
            const links = extractLinks(textContent || htmlContent);

            console.log(`📥 YENİ MAIL GELDİ! -> Kime: ${toAddress}`);

            const stmt = db.prepare(`INSERT INTO emails (to_address, from_address, subject, text_content, html_content, otp_codes, links) VALUES (?, ?, ?, ?, ?, ?, ?)`);
            stmt.run(toAddress, fromAddress, subject, textContent, htmlContent, otpCodes, JSON.stringify(links));
            stmt.finalize();

            callback();
        });
    }
});

mailServer.listen(SMTP_PORT, () => {
    console.log(`📧 SMTP Sunucusu çalışıyor: port ${SMTP_PORT}`);
});


// --- WEB API SUNUCUSU (Frontend ve API) ---
const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Rastgele Mail Üret (Random Domain Seçimi)
app.get('/api/generate', (req, res) => {
    const randomPart = Math.random().toString(36).substring(2, 10);
    const randomDomain = DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
    const email = `${randomPart}@${randomDomain}`;
    res.json({ email: email });
});

// Gelen Kutusunu Oku (Belirli bir mail adresi için)
app.get('/api/inbox/:email', (req, res) => {
    const email = req.params.email;
    // Basit bir LIKE sorgusu yapıyoruz ki alias'ları da yakalayabilelim
    db.all("SELECT id, from_address, subject, otp_codes, received_at FROM emails WHERE to_address LIKE ? ORDER BY id DESC", [`%${email}%`], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Mail Detayını Oku
app.get('/api/email/:id', (req, res) => {
    const id = req.params.id;
    db.get("SELECT * FROM emails WHERE id = ?", [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(row);
    });
});

app.listen(API_PORT, () => {
    console.log(`🌐 Web Arayüzü & API çalışıyor: http://localhost:${API_PORT}`);
});
