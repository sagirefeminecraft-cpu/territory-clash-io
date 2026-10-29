# Territory Clash.io

Territorial.io'dan esinlenen, gerçek zamanlı oda tabanlı bir tarayıcı oyunu başlangıç projesi.

## Yerelde çalıştırma
1. Node.js 20 veya daha yeni sürümü kur.
2. Bu klasörde terminal aç.
3. `npm install`
4. `npm start`
5. Tarayıcıda `http://localhost:3000` aç.

Aynı bilgisayarda ikinci sekme açıp aynı oda kodunu kullanarak test edebilirsin. Aynı Wi-Fi'deki başka cihazların erişimi için bilgisayarın yerel IP adresi ve güvenlik duvarı ayarları gerekir.

## İnternette yayımlama
Bu proje bir Node.js sunucusu ve Socket.IO bağlantısı gerektirir. Yalnızca `index.html` dosyasını statik site olarak yüklemek çok oyunculu oyunu çalıştırmaz.
- Projeyi kendi GitHub hesabına yükle.
- Render gibi Node.js web service destekleyen bir hostta yeni Web Service oluştur.
- Build command: `npm install`
- Start command: `npm start`
- Hostun verdiği HTTPS adresini aç ve arkadaşlarına gönder.

Ücretsiz hosting sağlayıcılarının uykuya geçme, kullanım limiti veya değişen koşulları olabilir. Herkese açık yayından önce güvenlik, hız sınırları, yeniden bağlanma, oda temizliği ve saldırı dengesi geliştirilmelidir.

## İlk sürümde olanlar
- Oda koduyla katılma (en fazla 8 oyuncu)
- Sunucu üzerinden senkronize harita
- Komşu bölgelere saldırı
- Basit asker ve savunma hamleleri
- Oyuncu listesi ve skor

Bu, oynanabilir bir prototiptir; tam ölçekli Territorial.io eşdeğeri değildir.
