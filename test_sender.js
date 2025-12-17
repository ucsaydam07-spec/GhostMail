const nodemailer = require('nodemailer');

// Parametreleri al (kime gidecek?)
const targetEmail = process.argv[2] || 'test@ghostdrop.net'; // Varsayılan

async function sendTestMail() {
    // Localdeki 2525 portuna bağlanacak bir transporter oluşturuyoruz
    let transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 2525,
        secure: false, // TLS yok
        tls: { rejectUnauthorized: false }
    });

    console.log(`📨 Mail gönderiliyor: ${targetEmail}...`);

    let info = await transporter.sendMail({
        from: '"Instagram" <support@instagram.com>', // Gönderen sahte
        to: targetEmail,
        subject: "Instagram Güvenlik Kodu: 123456", // Konu
        text: "Merhaba, Instagram giriş kodunuz: 837492. Bu kodu kimseyle paylaşmayın.", // İçerik
        html: `
            <div style="font-family: Arial; padding: 20px; border: 1px solid #ddd;">
                <h2 style="color: #333;">Instagram</h2>
                <p>Merhaba,</p>
                <p>Hesabınıza giriş yapmak için aşağıdaki kodu kullanın:</p>
                <h1 style="background: #eee; padding: 10px; text-align: center; letter-spacing: 5px;">837492</h1>
                <p>Veya şifrenizi yenilemek için tıklayın:</p>
                <a href="https://instagram.com/reset-password?token=xyz123" style="color: blue;">Şifremi Yenile</a>
            </div>
        `
    });

    console.log("✅ Mail Gönderildi! Message ID: %s", info.messageId);
}

sendTestMail().catch(console.error);
