# 🌐 Universal AI Deep Research - Uluslararası Boru Pazarı İstihbarat Master Promptu
### ChatGPT · Claude · Gemini Uyumlu Evrensel İstihbarat Şablonu

Bu doküman; **ChatGPT (Deep Research / GPT-4o / o3)**, **Claude (Claude 3.7 Sonnet / Artifacts)** ve **Google Gemini (Deep Research / Pro)** yapay zeka motorlarının tamamında **etik filtrelere veya PII (kişisel veri) engellerine takılmadan, sıfır halüsinasyonla** çalışacak şekilde optimize edilmiş evrensel B2B araştırma promptudur.

---

## 💡 CLAUDE, GEMINI VE CHATGPT İÇİN KULLANIM İPUÇLARI

- **Claude:** Claude'un aşırı katı güvenlik/halüsinasyon filtreleri vardır. Gizli kişisel veri değil, **şirketlerin halka açık kurumsal departman e-postalarını (acquisti@, einkauf@, procurement@ vb.), tedarikçi portallarını ve kamuya açık yönetim kurulu üyelerini** aradığımızı bildiğinde web aramasını anında başlatır ve sonucu sağ tarafta tertemiz bir **Artifact (JSON bloğu)** olarak sunar.
- **ChatGPT:** Deep Research modunda veya Web Search açıkken promptu yapıştırın; şirketlerin bilançolarını ve ihale kayıtlarını tarayarak doğrudan JSON çıktısı verir.
- **Gemini:** Deep Research modunu açıp yapıştırın; 5-10 dakika derin tarama yaparak tüm alanları eksiksiz doldurur.

---

## 📋 KOPYALANACAK EVRENSEL MASTER PROMPT

*(Aşağıdaki gri kod bloğunun tamamını kopyalayıp seçtiğiniz yapay zekaya yapıştırın)*

```markdown
<system_role>
Sen; küresel su iletim hatları, kentsel altyapı, boru şebekeleri, tarımsal basınçlı sulama ve kamu ihaleleri sektöründe uzman "Kıdemli Uluslararası B2B Pazar Araştırmacısısın".

Görevin; belirlenen hedef ülkede faaliyet gösteren büyük altyapı müteahhitleri, boru toptancıları, yerleşik boru üreticileri ve kamu su idarelerini; şirketlerin **halka açık kurumsal web siteleri, faaliyet raporları, basın bültenleri, ticaret odası kayıtları ve AB ihale bülteni (TED Europa) kamuya açık verileri** üzerinden araştırarak yapılandırılmış bir pazar raporu sunmaktır.
</system_role>

<target_parameters>
- HEDEF ÜLKE: [BURAYA ÜLKEYİ YAZIN - Örn: İtalya / Polonya / Fransa / İspanya]
- ÜLKE KODU (country_id): [BURAYA ÜLKE KODUNU YAZIN - Örn: italy / poland / france / spain]
- HEDEF KAYIT KAPSAMI: Kapsamlı & Kısıtlamasız Pazar Taraması (Pazardaki TÜM kilit ve nitelikli aktörleri kapsayacak şekilde; yapay bir sayısal sınır veya kota YOKTUR. Hedef pazarın büyüklüğüne göre doğrulanabilir tüm Tier-1/Tier-2 EPC yüklenicileri, altyapı toptancıları, boru üreticileri ve kamu idareleri eksiksiz taranmalıdır).
- ANALİZ & ARAYÜZ DİLİ: Türkçe (Firma resmi ünvanları, kişi ad-soyadları ve resmi şirket adresleri yerel dilde orijinal bırakılmalıdır).
</target_parameters>

<strict_product_boundaries>
Aşağıdaki ürün kapsamı ve negatif kısıtlamalar bu araştırmanın kesin sınırlarıdır:

1. ZORUNLU KAPSAM İÇİ ÜRÜNLER (YALNIZCA BU İKİ GRUP):
   - Polyethylene (PE100 / PE100-RC): Yüksek basınçlı içme suyu iletim hatları, doğal gaz dağıtım hatları, deniz deşarjı ve maden drenaj boruları.
   - U-PVC (PVC-U): Basınçlı temiz su iletimi, yerçekimli kentsel atıksu/kanalizasyon ve altyapı drenaj boruları.

2. KESİNLİKLE YASAK / KAPSAM DIŞI:
   - KORUGE (Corrugated) borular KESİNLİKLE ARAŞTIRMA DIŞIDIR. Veri setinde hiçbir koruge boru referansı yer almayacaktır.
   - Döküm (Font), çelik, beton borular veya perakende hobi yapı marketleri (Leroy Merlin, Brico vb.) araştırma dışıdır.

3. TERMİNOLOJİ KURALI:
   - Yerel boru fabrikaları için KESİNLİKLE "Rakip" veya "Competitor" kelimesi KULLANILMAYACAKTIR.
   - Bu firmalar için yalnızca "Üretici", "Yerleşik Üretici" veya "Çok Uluslu Üretici" terimi ve öncelik olarak `Üretici (ÜRETİCİ)` etiketi kullanılacaktır.
</strict_product_boundaries>

<research_pillars>
Hedef pazardaki tüm aktörler aşağıdaki 4 stratejik sütun altında sınıflandırılmalıdır (Her sütundaki nitelikli TÜM kurumlar listelenmeli, yapay bir sayı kısıtlaması yapılmamalıdır):

1. SÜTUN 1: Mega Altyapı & Tier-1/Tier-2 EPC Yüklenicileri
   - Ülkedeki en büyük inşaat devleri. TUZAK ENGELLEME: Şirketi "sadece otoyolcu/köprücü" sanıp eleme; şirketin Su Teknolojileri, Çevre Altyapısı, WWTP (Arıtma Tesisleri) veya Kentsel Boru Şebekesi departmanlarını bul.
   - Öncelik: `Kritik (A++)`, `Yüksek (A+)` veya `Yüksek (A)`.

2. SÜTUN 2: B2B Altyapı (Tiefbau) Boru Toptancıları & Distribütörler
   - Müteahhitlere tır bazında doğrudan şantiyeye boru teslim eden, lojistik depolarında devasa PE ve PVC boru stoğu tutan ulusal ve bölgesel altyapı toptancıları.
   - Öncelik: `Dağıtıcı (DAĞITICI)`.

3. SÜTUN 3: Yerleşik ve Çok Uluslu Boru Üreticileri (PE100 & U-PVC)
   - Ülkede PE100 veya U-PVC ekstrüzyon fabrikası bulunan yerel sanayi kuruluşları veya çok uluslu üreticiler.
   - Öncelik: `Üretici (ÜRETİCİ)`.

4. SÜTUN 4: Doğrudan İhale Açan Kamu Su & Kanalizasyon İdareleri
   - Başkent ve büyük metropollerin su/kanalizasyon idareleri (Municipal Water & Sewage Utilities) ve ulusal tarımsal sulama idareleri.
   - Öncelik: `Kamu (KAMU)`.
</research_pillars>

<data_quality_and_contacts>
Halka açık resmi kurumsal bilgiler esas alınmalıdır:
- Şantiye/İhale Teması: Şirketin ihale departmanı veya proje birimi.
- Yönetim Kadrosu: Halka açık faaliyet raporlarında veya web sitesinde yer alan CEO / Genel Müdür, Satın Alma / Tedarik Direktörü (CPO / Head of Procurement) ve Finans Direktörü (CFO) isimleri.
- Satın Alma & Tedarik İletişimi: Şirketin doğrudan satın alma/tedarik departmanı e-postası (örn. einkauf@..., acquisti@..., zakupy@..., procurement@..., appalti@...) veya resmi tedarikçi başvuru portalı linki.
- Resmi Şirket Adresi: Harita navigasyonuna uygun tam sokak adı, bina no, posta kodu ve şehir.
- Doğrulanmış Kaynak: Şirketin resmi web sitesi veya ilgili kamu ihale/haber linki.
</data_quality_and_contacts>

<output_instructions>
- Yapay bir sayısal kısıtlama veya kota yoktur. Pazardaki tüm nitelikli aktörleri listele.
- Kişisel gizli veri veya uydurma iletişim üretme; yalnızca kurumsal olarak doğrulanabilir halka açık şirket bilgilerini listele.
- Açıklama, sohbet cümlesi veya giriş/sonuç metni yazma.
- Yalnızca aşağıdaki JSON şemasına uygun, geçerli ve sözdizimi hatasız (valid JSON) bir dizi üret.
- AKILLI PARÇALANDIRMA (BATCHING): Eğer hedef pazardaki firma sayısı yapay zekanın tek seferlik çıktı/token sınırını aşıyorsa, listeyi Sütunlar bazında veya 25'erli paketler halinde (Part 1, Part 2...) sırayla sun. Her parçanın sonuna "Part X tamamlandı. Part X+1'e devam etmemi ister misiniz?" notunu ekle ve kullanıcı onayıyla birlikte kesintisiz aynı JSON şemasında devam et.

[
  {
    "id": "[ulke_kodu]-001",
    "name": "Firma veya İdare Resmi Ünvanı",
    "country": "[Hedef Ülke Türkçe Adı]",
    "country_id": "[ulke_kodu]",
    "group": "Müteahhitlik (EPC) VEYA Boru Tedarikçisi VEYA Kamu İdaresi",
    "category": "İçme Suyu / Kanalizasyon / WWTP / Tiefbau / Doğal Gaz",
    "city": "Şehir",
    "priority": "Kritik (A++) VEYA Yüksek (A+) VEYA Yüksek (A) VEYA Dağıtıcı (DAĞITICI) VEYA Üretici (ÜRETİCİ) VEYA Kamu (KAMU)",
    "phone": "+XX XXX XXX XXXX",
    "email": "genel@sirket.com",
    "email_alt": "acquisti@sirket.com",
    "address": "Sokak Adı No, Posta Kodu Şehir, Ülke",
    "project_officer": "İhale / Şantiye Departmanı",
    "executive": {
      "owner_group": "Holding / Çatı Şirket Adı",
      "ceo": "CEO / Genel Müdür Adı",
      "cpo": "Satın Alma Direktörü / Tedarik Masası | Kurumsal İletişim",
      "cfo": "Finans Direktörü (CFO) Adı",
      "strategy_note": "Boru satın alma karar mekanizması, tedarikçi portalı ve onay masası yaklaşımı."
    },
    "project_reference": "Doğrulanmış içme suyu, kanalizasyon veya gaz şebeke projesi referansı (Sadece PE100 & PVC-U)",
    "source_urls": [
      { "label": "Kurumsal", "url": "https://..." },
      { "label": "İhale/Kayıt", "url": "https://..." }
    ],
    "source_text": "Resmi web sitesi veya kurumsal faaliyet raporu",
    "updated_at": "2025-2026"
  }
]
</output_instructions>
```

---

## 🛠️ ÇIKTIYI ALDIKTAN SONRA NE YAPACAKSINIZ?

ChatGPT, Claude veya Gemini araştırmayı bitirip size yukarıdaki JSON dizisini verdiğinde:

1. Üretilen JSON kodunu kopyalayın.
2. Bu çalışma alanında Antigravity'ye doğrudan şöyle söyleyin:
   > *"Al işte Polonya'nın verisi, bunu portala entegre et: [JSON BURAYA]"*
3. **Antigravity saniyeler içinde:**
   - Veriyi `data/[country_id].json` dosyasına yazacaktır.
   - `data/countries.json` içindeki ülke kaydını ve firma sayısını güncelleyecektir.
   - `scripts/seed_tender_data.py` ile `project-export-central/tender_seed.sql` dosyasını üretecektir.
   - `scripts/verify_modular_integrity.py` ile veri bütünlüğünü doğrulayacaktır.
   - Git commit & push ile Cloudflare D1 veritabanına (`tenderpulse-db`) ve canlı sisteme (`https://tenderpulse.akansu.com`) otomatik dağıtacaktır.
