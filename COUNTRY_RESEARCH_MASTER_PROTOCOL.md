# Akansu Boru TenderPulse - Uluslararası Ülke Ekleme & İstihbarat Master Protokolü

Bu doküman, projeye yeni bir ülke ekleneceğinde veya mevcut bir ülkenin (örneğin Almanya, Polonya, Romanya vb.) veri tabanı genişletileceğinde **harfiyen uygulanması zorunlu olan operasyonel standarttır**.

Kullanıcı **"Almanya'yı genişlet/ekle"**, **"Polonya'yı ekle"** veya herhangi bir hedef ülke için talimat verdiğinde yapay zeka ajanı doğrudan bu protokolü işletir.

---

## 1. TEMEL ARAŞTIRMA & VERİ KALİTE KURALLARI

1. **"Tek Etiket" Yanılgısını Engelle (Tier-1 EPC Devleri):**
   Hedef ülkedeki uluslararası inşaat devlerini (STRABAG, PORR, VINCI, BUDIMEX, WEBUILD, BOUYGUES vb.) "sadece otoyolcu/tünelci" varsayıp ATLAMAYACAKSIN. Bu devlerin ülkedeki "Su Teknolojileri", "Çevre Altyapısı", "Boru Hatları" ve "Arıtma Tesisleri" birimlerini mutlaka tespit edip listeye alacaksın.

2. **Safkan B2B Altyapı Stokçularını Bul (Tiefbau Stockists):**
   Perakende yapı marketleri değil; doğrudan müteahhitlere tır bazında şantiyeye boru teslim eden B2B ihtisas distribütörlerini (HTI Group, GC-Gruppe vb. muadilleri) zorunlu olarak tespit edeceksin.

3. **Çift Kademeli İletişim Mimarisi (C-Level & CPO Zorunluluğu):**
   Şantiye panosundaki kontrol mühendisi ile yetinmek YASAKTIR. Her kurum için iki kademeli veri vereceksin:
   - **Kademe A:** Proje/İhale yetkilisi, teklif sorumlusu veya santral.
   - **Kademe B (Karar Verici):** Şirket Sahibi/Hissedar, CEO/Genel Müdür, Satın Alma Direktörü/CPO (Head of Procurement) ve CFO. Doğrudan satın alma departmanı e-postasını (`achizitii@...`, `einkauf@...`, `procurement@...`, `zakupy@...`) ve onay mekanizmasını belirteceksin.

4. **Ticari Öncelik (B2B Skorlama Matrisi):**
   Her kuruma şu kodlardan biri atanmalıdır:
   - `Kritik (A++)` : Yıllık yüzlerce km boru tüketen Mega Altyapı EPC Devleri.
   - `Yüksek (A+)` : Büyük sulama ve bölgesel su şebekesi ana yüklenicileri.
   - `Yüksek (A)` : Kentsel altyapı ve gaz/su ana müteahhitleri.
   - `Orta (B)` : Arıtma, pompa veya niş drenaj projeleri yürüten uzman müteahhitler.
   - `Kamu (KAMU)` : İhaleyi doğrudan açan bölgesel su/kanalizasyon ve sulama idareleri.
   - `Dağıtıcı (DAĞITICI)` : Boru stoğu tutan toptancı ve distribütörler.
   - `Üretici (ÜRETİCİ)` : Yerel PE/PVC boru fabrikası veya ekstrüzyon tesisi olan üreticiler.
   - `Partner (PARTNER)` : CTP veya özel otomasyon tamamlayıcıları.

5. **Navigasyon & GPS Uyumlu Tam Adres:**
   Adres alanı tam ve açık olmalıdır (Sokak, Bina No, Posta Kodu, Şehir, Ülke). Akansu portalında bu adres doğrudan yerel harita (Apple Maps / Google Maps) rotasını açacaktır.

6. **Sıfır Halüsinasyon & Resmi Doğrulama:**
   "Bilgi yok" ifadesi kullanılamaz. İhale kayıt numaraları (SEAP, TED Europa, KIO, EBRD) ve doğrulanabilir kurumsal URL bağlantıları (`source_urls`) zorunludur.

---

## 2. EVRENSEL MASTER PROMPT (AI ARAŞTIRMA ŞABLONU)

Yeni bir ülke araştırılırken modele verilecek master komut bloğu:

```markdown
# ROL VE GÖREV TANIMI
Sen; küresel altyapı, su iletim hatları, boru şebekeleri ve kamu ihaleleri sektöründe 20 yıllık deneyime sahip Kıdemli Uluslararası B2B Pazar İstihbarat Danışmanısın. Resmi ticaret sicilleri (Handelsregister, ONRC, KRS vb.), kamu ihale bültenleri (TED Europa, SEAP/SICAP vb.) ve kalkınma bankaları (Dünya Bankası, EBRD, EIB) projelerine tam erişim metodolojisine hakimsin.

# HEDEF PARAMETRELER
- HEDEF ÜLKE: [HEDEF_ULKE_ADI - Örn: Polonya / Almanya / Bulgaristan]
- ÜLKE KODU (country_id): [hedef_ulke_id - Örn: poland / germany / bulgaria]
- HEDEF ÜRÜN GRUBU: Altyapı Boru Sistemleri: YALNIZCA Polyethylene (PE100 / PE100-RC Basınçlı Temiz Su ve Gaz Boruları) ve U-PVC (PVC-U Basınçlı İçme Suyu, Kanalizasyon ve Drenaj Boruları). Not: Koruge borular bu projenin kapsamı dışındadır.
- İNCELENECEK SEKTÖRLER: İçme Suyu & Kanalizasyon, Tarımsal Sulama, Maden Drenajı, Balık Çiftlikleri (Akuakültür), Atıksu Arıtma Tesisleri (WWTP), Doğal Gaz Dağıtımı.

# ZORUNLU KURAL
Açıklama, giriş veya ek metin yazma. SADECE aşağıdaki JSON şemasına uygun geçerli bir JSON dizisi üret:

[
  {
    "id": "[ulke_id]-001",
    "name": "Firma veya İdare Resmi Ünvanı",
    "country": "[Hedef Ülke Türkçe Adı]",
    "country_id": "[hedef_ulke_id]",
    "group": "Müteahhitlik (EPC) VEYA Boru Tedarikçisi VEYA Kamu İdaresi",
    "category": "İçme Suyu / Kanalizasyon / Tarımsal Sulama / WWTP / Gaz",
    "city": "Şehir",
    "priority": "Kritik (A++)",
    "phone": "+XX XXX XXX XXXX",
    "email": "genel@sirket.com",
    "email_alt": "achizitii@sirket.com",
    "address": "Cadde/Sokak No, Posta Kodu, Şehir, Ülke",
    "project_officer": "Proje Şefi veya İhale Teklif Sorumlusu",
    "executive": {
      "owner_group": "Holding / Çatı Şirket Adı",
      "ceo": "CEO / Genel Müdür İsim Soyisim",
      "cpo": "Satın Alma Direktörü İsim Soyisim | CPO Direkt Maili / Telefonu",
      "cfo": "Finans Direktörü İsim Soyisim",
      "strategy_note": "Boru satın alma karar mekanizması ve onay masası notu."
    },
    "project_reference": "Doğrulanmış büyük ihale adı veya devam eden şantiye referansı",
    "source_urls": [
      { "label": "Kurumsal", "url": "https://..." },
      { "label": "İhale/Proje", "url": "https://..." }
    ],
    "source_text": "Resmi teyit kaynakları metni",
    "updated_at": "2025-2026"
  }
]
```

---

## 3. PORTALA ENTEGRASYON ADIMLARI (MODERN CLOUDFLARE D1 & WORKER MİMARİSİ)

TenderPulse sistemi tamamen modern **Cloudflare Worker (`tenderpulse-api`)**, **Cloudflare D1 Veritabanı (`tenderpulse-db`)** ve **Cloudflare Pages (`tenderpulse-frontend`)** altyapısıyla çalışmaktadır. Veriler artık statik JS dosyalarına gömülmemekte, doğrudan Cloudflare D1 veritabanından dinamik API (`/api/tender/*`) aracılığıyla çekilmektedir.

Yapay zeka ajanı yeni bir ülkeyi sisteme eklerken şu 5 adımı sırayla ve hatasız uygular:

### Adım 1: JSON Dosyasını Oluşturun
Üretilen veriyi hem ana çalışma alanındaki `data/[country_id].json` dosyasına hem de `project-export-central/data/[country_id].json` konumuna kaydedin (Örn: `data/poland.json`).

### Adım 2: `data/countries.json` Listesine Ülkeyi Ekleyin
`data/countries.json` (ve `project-export-central/data/countries.json`) dosyasına yeni ülkenin tanımını ekleyin:
```json
{
  "id": "poland",
  "name": "Polonya",
  "file": "data/poland.json",
  "flag": "🇵🇱",
  "count": 35,
  "active": true
}
```

### Adım 3: D1 SQL Tohumlama Scriptini Çalıştırın (`seed_tender_data.py`)
Terminalden `project-export-central` dizinine gidip SQL tohumlama scriptini çalıştırın:
```bash
python3 project-export-central/scripts/seed_tender_data.py
```
Bu script, `data/countries.json` ve ilgili tüm ülke JSON dosyalarını okuyarak `project-export-central/tender_seed.sql` dosyasını `INSERT OR IGNORE` formatında otomatik ve güvenli olarak yeniden üretir.

### Adım 4: Mimari ve Bütünlük Doğrulamasını Çalıştırın (`verify_modular_integrity.py`)
Sistemin sıfır hata prensibiyle çalıştığını doğrulamak için doğrulama testini çalıştırın:
```bash
python3 project-export-central/scripts/verify_modular_integrity.py
```
Bu test; `schema.sql` yapısının korunduğunu, `tender_seed.sql` kayıt adetlerini, API rotalarını ve PWA bileşenlerinin bütünlüğünü doğrular.

### Adım 5: Canlıya Alma & CI/CD Dağıtımı (Git Commit & Push)
Değişiklikleri `project-export-central` git deposunda commit edin ve `main` branch'ine push yapın:
```bash
cd project-export-central
git add data/ tender_seed.sql
git commit -m "feat(data): add Poland tender intelligence dataset (35 companies)"
git push origin main
```
**Otomasyon:** GitHub Actions CI/CD pipeline'ı (`deploy.yml`) push anında otomatik tetiklenir:
1. `tender_seed.sql` dosyasını Cloudflare D1 veritabanına (`tenderpulse-db`) işler.
2. Cloudflare Worker (`tenderpulse-api.akansu.com`) backend'ini günceller.
3. Cloudflare Pages (`tenderpulse.akansu.com`) frontend'ini derler ve yayınlar.
Yeni eklenen ülke anında haritada ve Ülke Raporu modülünde filtrelenebilir hale gelir.

---

## ⚠️ ESKİ STATİK YAPI HAKKINDA KRİTİK UYARI
- `data/embedded-data.js` ve `sw.js` dosyaları projenin eski statik PWA prototipinden kalmadır.
- **YENİ MİMARİDE KESİNLİKLE BU DOSYALARI DÜZENLEMEYİN VEYA GÜNCELLEMEYE ÇALIŞMAYIN.**
- Veritabanı ve istihbarat yönetimi %100 Cloudflare D1 (`tenderpulse-db`) üzerinden yürütülmektedir.
