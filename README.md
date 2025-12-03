# 🎮 Renkli Şifreler Dünyası

**5-6 Yaş Çocuklar İçin Yapay Zeka Destekli, Ses Kontrollü Eğitim ve Oyun Platformu**

> "Hayal Et • Söyle • Oyna"

Renkli Şifreler Dünyası, okul öncesi çağındaki çocukların teknolojiyi pasif bir tüketici olarak değil, **etkileşimli ve üretken** bir şekilde kullanmalarını sağlayan yeni nesil bir web uygulamasıdır. **Google Gemini Live API** gücüyle çalışan bu oyun, çocukların sesli komutlarla ekrana dokunmadan oyun oynamalarını, çizim yapmalarını ve kendi karakterlerini tasarlamalarını sağlar.

---

## 🌟 Öne Çıkan Özellikler

### 🎙️ Gemini ile Sesli Kontrol (Sihirli Mikrofon)
Bu oyunun kalbi, çocukları dinleyen ve anlayan yapay zekadır. Çocuklar karmaşık menülerde kaybolmak yerine, sadece konuşarak oyunun akışını yönetebilirler.
*   **Doğal Diyalog:** "Merhaba", "Sıkıldım", "Bana bir masal anlat" gibi doğal konuşmaları anlar.
*   **Navigasyon:** "Hazine avını aç", "Boyama yapmak istiyorum" diyerek ekranlar arası geçiş yapabilirler.
*   **Yaratıcılık:** "Kırmızı bir kedi yap", "Kafasına şapka tak" veya "Bir ağaç çiz" diyerek ekrandaki içerikleri sesle oluşturabilirler.

### 🎨 Karakter Atölyesi
Çocuklar hayallerindeki oyun arkadaşını kendileri tasarlar!
*   **Sesle Tasarım:** "Mavi bir köpek olsun", "Gözlük taksın" komutlarıyla anlık değişim.
*   **AI Görsel Üretimi:** Tasarlanan karakter, Google Imagen modeli kullanılarak çocuğa özel, 3 boyutlu ve sevimli bir çizgi film karakterine dönüştürülür.
*   **Kişiselleştirme:** Oluşturulan karakterler oyunların içine (Hafıza kartlarına, piyonlara vb.) dahil olur.

### 🧠 Eğitici Oyunlar
5-6 yaş grubunun bilişsel gelişimini destekleyen oyunlar:
1.  **Şifre Çözücü:** Mantık yürütme ve sembol eşleştirme.
2.  **Örüntü Tamamlama:** Dizileri takip etme ve sıradakini tahmin etme.
3.  **Hazine Avı:** Sayma ve adım takibi.
4.  **Hafıza Oyunu:** Görsel hafıza gelişimi (Kendi tasarladıkları karakterlerle!).
5.  **Kayıp Sembol:** Dikkat ve odaklanma.
6.  **Sayı Avcısı:** Refleks ve sayı tanıma.
7.  **Gölge Eşleştirme:** Şekil ve form algısı.
8.  **Dedektif:** Temel matematik ve çıkarım yapma.

### 🖌️ Akıllı Boyama Kitabı
*   **Sesli Çizim:** Çocuk "Bir güneş çiz" dediğinde, Gemini ekrana boyanabilir bir güneş şablonu getirir.
*   **Kova ve Fırça:** Klasik boyama araçlarıyla çocuklar çizimleri renklendirir.

---

## 🚀 Teknolojik Altyapı

Bu proje, modern web teknolojileri ve Google'ın en yeni AI modelleri üzerine kurulmuştur:

*   **Frontend:** React 19, TypeScript, Tailwind CSS.
*   **AI Core:** `@google/genai` SDK.
*   **Multimodal Etkileşim:**
    *   **Gemini 2.5 Flash Native Audio:** Gerçek zamanlı ses işleme (Websocket üzerinden).
    *   **Gemini 2.5 Flash Image:** Karakter ve boyama şablonu üretimi.
    *   **Function Calling:** Sesli komutları (navigasyon, çizim, karakter güncelleme) uygulama içi aksiyonlara dönüştürme.
*   **Ses İşleme:** Web Audio API (PCM Stream işleme ve dönüştürme).

---

## 🛠️ Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için:

1.  **Depoyu Klonlayın:**
    ```bash
    git clone https://github.com/kullaniciadi/renkli-sifreler.git
    cd renkli-sifreler
    ```

2.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    ```

3.  **API Anahtarını Ayarlayın:**
    Kök dizinde `.env` dosyası oluşturun ve Google AI Studio'dan aldığınız anahtarı ekleyin:
    ```env
    API_KEY=AIzaSy...
    ```

4.  **Uygulamayı Başlatın:**
    ```bash
    npm start
    ```

---

## 🎮 Nasıl Oynanır?

1.  **Başla:** Giriş ekranındaki büyük "OYUNA BAŞLA" butonuna tıkla.
2.  **Konuş:** Mikrofon izni verildikten sonra yapay zeka seni dinlemeye başlar.
3.  **Örnek Komutlar:**
    *   *"Karakter yapmak istiyorum."*
    *   *"Kırmızı renk olsun."*
    *   *"Bir şapka tak."*
    *   *"Boyama sayfasına git."*
    *   *"Ekrana bir ev çiz."*
    *   *"Hazine avı oyununu aç."*

---

## 👶 Çocuk Dostu Tasarım İlkeleri

*   **Okuma Yazma Gerektirmez:** Tüm kritik fonksiyonlar sesle veya büyük simgelerle yönetilebilir.
*   **Hata Yok, Eğlence Var:** Yanlış yapıldığında cezalandırıcı sesler yerine cesaretlendirici geri bildirimler verilir.
*   **Güvenli İçerik:** AI promptları, sadece çocuklara uygun, sevimli ve şiddet içermeyen görseller üretecek şekilde kısıtlanmıştır.

---

*Geleceğin mucitleri için sevgiyle kodlandı.* ❤️