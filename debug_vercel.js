const axios = require('axios');

async function test() {
    console.log("🔍 Vercel Test Başlıyor...");
    try {
        const url = 'https://ghost-mail-one.vercel.app/api/inbox?email=zsk0abe6@1secmail.com';
        const response = await axios.get(url);
        console.log("✅ BAŞARILI! Gelen Veri:", response.data);
    } catch (e) {
        console.log("❌ HATA OLUŞTU!");
        if (e.response) {
            console.log("Status Code:", e.response.status);
            console.log("Server Cevabı (Body):", e.response.data);
            console.log("Headers:", JSON.stringify(e.response.headers, null, 2));
        } else {
            console.log("Bağlantı Hatası:", e.message);
        }
    }
}

test();
