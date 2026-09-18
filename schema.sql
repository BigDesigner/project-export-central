-- 1. Ülke Master Tablosu
CREATE TABLE IF NOT EXISTS countries (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    region TEXT NOT NULL
);

-- 2. Temsilciler Tablosu
CREATE TABLE IF NOT EXISTS representatives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    representative_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    color_hex TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    drive_folder_id TEXT, -- Temsilcinin Google Drive'daki kök klasör ID'si (REP_ID_[id] formatında)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Atamalar Tablosu (Geliştirilmiş)
CREATE TABLE IF NOT EXISTS country_assignments (
    country_code TEXT PRIMARY KEY,
    representative_id INTEGER NOT NULL,
    drive_folder_id TEXT, -- Ülke klasörünün Google Drive ID'si
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (representative_id) REFERENCES representatives(id) ON DELETE CASCADE,
    FOREIGN KEY (country_code) REFERENCES countries(code) ON DELETE RESTRICT
);

-- 4. Müşteriler Tablosu (Temsilci Soft Delete Desteğiyle)
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country_code TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    social_media TEXT,
    product_groups TEXT,
    drive_folder_id TEXT,
    notes_doc_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME DEFAULT NULL, -- Soft Delete tarihi
    deleted_by_representative_id INTEGER DEFAULT NULL, -- Silen temsilci
    FOREIGN KEY (country_code) REFERENCES countries(code) ON DELETE RESTRICT,
    FOREIGN KEY (deleted_by_representative_id) REFERENCES representatives(id) ON DELETE SET NULL
);

-- 5. Teklifler Tablosu (Soft Delete Desteğiyle)
CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL CHECK(currency IN ('USD', 'EUR', 'TRY')),
    status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    drive_file_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME DEFAULT NULL,
    deleted_by_representative_id INTEGER DEFAULT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (deleted_by_representative_id) REFERENCES representatives(id) ON DELETE SET NULL
);

-- 6. Arka Plan İş Kuyruğu Tablosu (CF Workers CPU ve Kota Dostu)
CREATE TABLE IF NOT EXISTS background_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_type TEXT NOT NULL CHECK(job_type IN ('create_customer_folders', 'move_country_folders', 'archive_customer_folders')),
    payload TEXT NOT NULL, -- JSON formatında işlem verileri (örn: { "customer_id": 123 })
    status TEXT NOT NULL CHECK(status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_assignment_rep ON country_assignments(representative_id);
CREATE INDEX IF NOT EXISTS idx_customer_country ON customers(country_code);
CREATE INDEX IF NOT EXISTS idx_quote_customer ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_deleted ON customers(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quote_deleted ON quotes(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_status ON background_jobs(status);

-- ==============================================================================
-- 7. İHALE & HEDEF PAZAR İSTİHBARAT MODÜLÜ TABLOLARI (DEEPRESEARCH MODULE)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS tender_countries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    flag TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tender_companies (
    id TEXT PRIMARY KEY,
    country_id TEXT NOT NULL,
    name TEXT NOT NULL,
    group_name TEXT NOT NULL,
    category TEXT NOT NULL,
    city TEXT NOT NULL,
    priority TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    email_alt TEXT,
    address TEXT,
    project_officer TEXT,
    owner_group TEXT,
    ceo TEXT,
    cpo TEXT,
    cfo TEXT,
    strategy_note TEXT,
    project_reference TEXT,
    source_text TEXT,
    brevo_contact_id TEXT,
    brevo_synced_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME DEFAULT NULL,
    FOREIGN KEY (country_id) REFERENCES tender_countries(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS tender_source_urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id TEXT NOT NULL,
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES tender_companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tender_crm_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id TEXT NOT NULL,
    representative_id INTEGER,
    note TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES tender_companies(id) ON DELETE CASCADE,
    FOREIGN KEY (representative_id) REFERENCES representatives(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tender_company_country ON tender_companies(country_id);
CREATE INDEX IF NOT EXISTS idx_tender_company_group ON tender_companies(group_name);
CREATE INDEX IF NOT EXISTS idx_tender_company_priority ON tender_companies(priority);
CREATE INDEX IF NOT EXISTS idx_tender_company_deleted ON tender_companies(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tender_source_company ON tender_source_urls(company_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tender_source_unique ON tender_source_urls(company_id, url);
CREATE INDEX IF NOT EXISTS idx_tender_notes_company ON tender_crm_notes(company_id);


-- ==============================================================================
-- 8. MASTER COUNTRIES SEED (Safe Idempotent INSERT OR IGNORE)
-- ==============================================================================
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('af', 'Afganistan', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ax', 'Aland Adaları', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('al', 'Arnavutluk', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('dz', 'Cezayir', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('as', 'Amerikan Samoası', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ad', 'Andorra', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ao', 'Angola', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ai', 'Anguilla', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('aq', 'Antarktika', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ag', 'Antigua ve Barbuda', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ar', 'Arjantin', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('am', 'Ermenistan', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('aw', 'Aruba', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('au', 'Avustralya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('at', 'Avusturya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('az', 'Azerbaycan', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('bs', 'Bahamalar', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('bh', 'Bahreyn', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('bd', 'Bangladeş', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('bb', 'Barbados', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('by', 'Belarus', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('be', 'Belçika', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('bz', 'Belize', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('bj', 'Benin', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('bm', 'Bermuda', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('bt', 'Butan', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('bo', 'Bolivya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('bq', 'Karayip Hollandası', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ba', 'Bosna-Hersek', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('bw', 'Botsvana', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('bv', 'Bouvet Adası', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('br', 'Brezilya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('io', 'Britanya Hint Okyanusu Toprakları', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('bn', 'Brunei', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('bg', 'Bulgaristan', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('bf', 'Burkina Faso', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('bi', 'Burundi', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('cv', 'Yeşil Burun Adaları', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('kh', 'Kamboçya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('cm', 'Kamerun', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ca', 'Kanada', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ky', 'Cayman Adaları', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('cf', 'Orta Afrika Cumhuriyeti', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('td', 'Çad', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('cl', 'Şili', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('cn', 'Çin', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('cx', 'Christmas Adası', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('cc', 'Cocos Adaları', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('co', 'Kolombiya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('km', 'Komorlar', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('cd', 'Kongo Demokratik Cumhuriyeti', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('cg', 'Kongo Cumhuriyeti', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ck', 'Cook Adaları', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('cr', 'Kosta Rika', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ci', 'Fildişi Sahili', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('hr', 'Hırvatistan', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('cu', 'Küba', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('cw', 'Curaçao', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('cy', 'Kıbrıs', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('cz', 'Çekya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('dk', 'Danimarka', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('dj', 'Cibuti', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('dm', 'Dominika', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('do', 'Dominik Cumhuriyeti', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ec', 'Ekvador', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('eg', 'Mısır', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('sv', 'El Salvador', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('gq', 'Ekvator Ginesi', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('er', 'Eritre', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ee', 'Estonya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('sz', 'Esvatini', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('et', 'Etiyopya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('fk', 'Falkland Adaları', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('fo', 'Faroe Adaları', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('fj', 'Fiji', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('fi', 'Finlandiya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('fr', 'Fransa', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('gf', 'Fransız Guyanası', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('pf', 'Fransız Polinezyası', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('tf', 'Fransız Güney Toprakları', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ga', 'Gabon', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('gm', 'Gambiya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ge', 'Gürcistan', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('de', 'Almanya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('gh', 'Gana', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('gi', 'Cebelitarık', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('gr', 'Yunanistan', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('gl', 'Grönland', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('gd', 'Grenada', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('gp', 'Guadelup', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('gu', 'Guam', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('gt', 'Guatemala', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('gg', 'Guernsey', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('gn', 'Gine', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('gw', 'Gine-Bissau', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('gy', 'Guyana', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ht', 'Haiti', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('hm', 'Heard Adası ve McDonald Adaları', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('va', 'Vatikan', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('hn', 'Honduras', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('hk', 'Hong Kong', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('hu', 'Macaristan', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('is', 'İzlanda', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('in', 'Hindistan', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('id', 'Endonezya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ir', 'İran', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('iq', 'Irak', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ie', 'İrlanda', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('im', 'Isle of Man', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('il', 'İsrail', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('it', 'İtalya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('jm', 'Jamaika', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('jp', 'Japonya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('je', 'Jersey', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('jo', 'Ürdün', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('kz', 'Kazakistan', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ke', 'Kenya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ki', 'Kiribati', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('kp', 'Kuzey Kore', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('kr', 'Güney Kore', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('kw', 'Kuveyt', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('kg', 'Kırgızistan', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('la', 'Laos', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('lv', 'Letonya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('lb', 'Lübnan', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ls', 'Lesotho', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('lr', 'Liberia', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ly', 'Libya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('li', 'Lihtenştayn', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('lt', 'Litvanya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('lu', 'Lüksemburg', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('mo', 'Makao', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('mg', 'Madagaskar', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('mw', 'Malavi', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('my', 'Malezya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('mv', 'Maldivler', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ml', 'Mali', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('mt', 'Malta', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('mh', 'Marshall Adaları', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('mq', 'Martinik', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('mr', 'Moritanya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('mu', 'Mauritius', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('yt', 'Mayotte', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('mx', 'Meksika', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('fm', 'Micronesia', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('md', 'Moldova', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('mc', 'Monako', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('mn', 'Moğolistan', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('me', 'Karadağ', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ms', 'Montserrat', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ma', 'Fas', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('mz', 'Mozambik', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('mm', 'Myanmar', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('na', 'Namibya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('nr', 'Nauru', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('np', 'Nepal', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('nl', 'Hollanda', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('nc', 'Yeni Kaledonya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('nz', 'Yeni Zelanda', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ni', 'Nikaragua', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ne', 'Nijer', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ng', 'Nijerya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('nu', 'Niue', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('nf', 'Norfolk Adası', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('mk', 'Kuzey Makedonya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('mp', 'Kuzey Mariana Adaları', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('no', 'Norveç', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('om', 'Umman', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('pk', 'Pakistan', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('pw', 'Palau', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ps', 'Filistin', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('pa', 'Panama', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('pg', 'Papua Yeni Ginesi', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('py', 'Paraguay', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('pe', 'Peru', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ph', 'Filipinler', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('pn', 'Pitcairn Adaları', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('pl', 'Polonya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('pt', 'Portekiz', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('pr', 'Porto Riko', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('qa', 'Katar', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('re', 'Reunion', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ro', 'Romanya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ru', 'Rusya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('rw', 'Ruanda', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('bl', 'Saint Barthelemy', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('sh', 'Saint Helena', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('kn', 'Saint Kitts ve Nevis', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('lc', 'Saint Lucia', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('mf', 'Saint Martin', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('pm', 'Saint Pierre ve Miquelon', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('vc', 'Saint Vincent ve Grenadinler', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ws', 'Samoa', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('sm', 'San Marino', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('st', 'Sao Tome ve Principe', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('sa', 'Suudi Arabistan', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('sn', 'Senegal', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('rs', 'Sırbistan', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('sc', 'Seyşeller', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('sl', 'Sierra Leone', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('sg', 'Singapur', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('sx', 'Sint Maarten', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('sk', 'Slovakya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('si', 'Slovenya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('sb', 'Solomon Adaları', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('so', 'Somali', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('za', 'Güney Afrika', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('gs', 'Güney Georgia ve Güney Sandwich Adaları', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ss', 'Güney Sudan', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('es', 'İspanya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('lk', 'Sri Lanka', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('sd', 'Sudan', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('sr', 'Suriname', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('sj', 'Svalbard ve Jan Mayen', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('se', 'İsveç', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ch', 'İsviçre', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('sy', 'Suriye', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('tw', 'Tayvan', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('tj', 'Tacikistan', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('tz', 'Tanzanya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('th', 'Tayland', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('tl', 'Doğu Timor', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('tg', 'Togo', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('tk', 'Tokelau', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('to', 'Tonga', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('tt', 'Trinidad ve Tobago', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('tn', 'Tunus', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('tr', 'Türkiye', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('tm', 'Türkmenistan', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('tc', 'Turks ve Caicos Adaları', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('tv', 'Tuvalu', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ug', 'Uganda', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ua', 'Ukrayna', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ae', 'Birleşik Arap Emirlikleri', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('gb', 'Birleşik Krallık', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('um', 'Amerika Birleşik Devletleri Küçük Dış Adaları', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('us', 'Amerika Birleşik Devletleri', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('uy', 'Uruguay', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('uz', 'Özbekistan', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('vu', 'Vanuatu', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ve', 'Venezuela', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('vn', 'Vietnam', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('vg', 'Britanya Virjin Adaları', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('vi', 'ABD Virjin Adaları', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('wf', 'Wallis ve Futuna', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('eh', 'Batı Sahra', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('ye', 'Yemen', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('zm', 'Zambia', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('zw', 'Zimbabwe', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('xs', 'Somaliland', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('xq', 'Kırım', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('xk', 'Kosova', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('xc', 'Kuzey Kıbrıs', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('gb-eng', 'İngiltere', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('gb-sct', 'İskoçya', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('gb-wls', 'Galler', 'Global');
INSERT OR IGNORE INTO countries (code, name, region) VALUES ('gb-nir', 'Kuzey İrlanda', 'Global');
