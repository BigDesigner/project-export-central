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
CREATE INDEX IF NOT EXISTS idx_tender_notes_company ON tender_crm_notes(company_id);

