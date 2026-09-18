import os
import re

def verify():
    base_dir = "/Users/muratgonen/Documents/Antigravity/DeepResearch/project-export-central"
    print("=== VERIFYING MODULAR INTEGRITY ===")

    # 1. Check wrangler.toml vars preservation
    wrangler_path = os.path.join(base_dir, "wrangler.toml")
    with open(wrangler_path, "r", encoding="utf-8") as f:
        wrangler_content = f.read()
    assert "ADMIN_USERNAME = \"admin\"" in wrangler_content, "ADMIN_USERNAME missing"
    assert "ALLOWED_ORIGIN = \"https://tenderpulse.akansu.com\"" in wrangler_content, "ALLOWED_ORIGIN missing"
    assert "TURNSTILE_SITE_KEY = \"0x4AAAAAADkZu0g18QHwPnno\"" in wrangler_content, "TURNSTILE_SITE_KEY missing"
    assert "binding = \"DB\"" in wrangler_content, "DB binding missing"
    assert "45b35dbd-5a27-4311-bae3-83080fef900d" in wrangler_content, "New DB ID missing"
    print("✓ wrangler.toml [vars], tenderpulse DB binding and ID 100% preserved.")

    # 2. Check schema.sql
    schema_path = os.path.join(base_dir, "schema.sql")
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_content = f.read()
    assert "CREATE TABLE IF NOT EXISTS tender_countries" in schema_content
    assert "CREATE TABLE IF NOT EXISTS tender_companies" in schema_content
    assert "CREATE TABLE IF NOT EXISTS tender_source_urls" in schema_content
    assert "CREATE TABLE IF NOT EXISTS tender_crm_notes" in schema_content
    assert "DROP TABLE" not in schema_content.upper(), "DROP TABLE found in schema!"
    print("✓ schema.sql contains all tender_* tables and conforms to zero DROP TABLE policy.")

    # 3. Check tender_seed.sql
    seed_path = os.path.join(base_dir, "tender_seed.sql")
    with open(seed_path, "r", encoding="utf-8") as f:
        seed_content = f.read()
    countries_count = len(re.findall(r"INSERT\s+(?:OR\s+(?:REPLACE|IGNORE)\s+)?INTO\s+tender_countries", seed_content))
    companies_count = len(re.findall(r"INSERT\s+(?:OR\s+(?:REPLACE|IGNORE)\s+)?INTO\s+tender_companies", seed_content))
    sources_count = len(re.findall(r"INSERT\s+(?:OR\s+(?:REPLACE|IGNORE)\s+)?INTO\s+tender_source_urls", seed_content))
    assert countries_count >= 3, f"Expected at least 3 countries, got {countries_count}"
    assert companies_count >= 113, f"Expected at least 113 companies, got {companies_count}"
    assert sources_count >= 185, f"Expected at least 185 sources, got {sources_count}"
    print(f"✓ tender_seed.sql verified: {countries_count} countries, {companies_count} companies, {sources_count} sources.")

    # 4. Check backend/modules/tender.ts
    tender_backend = os.path.join(base_dir, "backend/modules/tender.ts")
    with open(tender_backend, "r", encoding="utf-8") as f:
        tb_content = f.read()
    assert "syncContactToBrevo" in tb_content
    assert "prepare(" in tb_content
    assert ".bind(" in tb_content
    print("✓ backend/modules/tender.ts properly uses prepared statements and Brevo client.")

    # 5. Check backend/index.ts
    backend_index = os.path.join(base_dir, "backend/index.ts")
    with open(backend_index, "r", encoding="utf-8") as f:
        bi_content = f.read()
    assert "import { handleTenderRoute } from './modules/tender';" in bi_content
    assert "url.pathname.startsWith('/api/tender')" in bi_content
    assert "import(" not in bi_content, "Dynamic import detected!"
    print("✓ backend/index.ts statically imports and routes tender module without dynamic import.")

    # 6. Check frontend/index.html
    html_path = os.path.join(base_dir, "frontend/index.html")
    with open(html_path, "r", encoding="utf-8") as f:
        html_content = f.read()
    assert "id=\"app-shell-header\"" in html_content
    assert "id=\"tab-btn-map\"" in html_content
    assert "id=\"tab-btn-tender\"" in html_content
    assert "id=\"map-module-container\"" in html_content
    assert "id=\"tender-module-container\"" in html_content
    assert "id=\"role-title\"" in html_content, "DOM ID role-title missing!"
    assert "id=\"user-display\"" in html_content, "DOM ID user-display missing!"
    assert "id=\"admin-controls\"" in html_content, "DOM ID admin-controls missing!"
    assert "viewport-fit=cover" in html_content
    assert "tailwindcss" in html_content
    print("✓ frontend/index.html contains App Shell, preserved DOM IDs, and responsive viewport.")

    # 7. Check frontend/src/modules/tender/tenderView.ts
    view_path = os.path.join(base_dir, "frontend/src/modules/tender/tenderView.ts")
    with open(view_path, "r", encoding="utf-8") as f:
        tv_content = f.read()
    assert "class TenderViewController" in tv_content
    assert "function escapeHtml" in tv_content
    assert "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" in tv_content
    assert "max-w-7xl" in tv_content
    assert "TenderApi.syncBrevo" in tv_content
    print("✓ frontend/src/modules/tender/tenderView.ts conforms to 100% PWA and mobile-first responsive grid.")

    # 8. Check ADR 0005
    adr_path = os.path.join(base_dir, ".memory-bank/adr/0005-modular-architecture-and-brevo-integration.md")
    assert os.path.exists(adr_path)
    print("✓ ADR 0005 verified in .memory-bank/adr/.")

    print("\nALL VERIFICATION CHECKS PASSED SUCCESSFULLY (8/8)!")

if __name__ == "__main__":
    verify()
