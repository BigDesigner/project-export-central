# ADR 0005: Multi-Module Portal Architecture, D1 Table Isolation & Brevo CRM Integration

## Status
Accepted

## Context
As Akansu Boru's international expansion operations scale, two distinct capabilities emerged:
1. **Pazar Dağıtımı & Harita Atama (`MapAssign`):** Country-level representative assignment, geographic visualization, and regional customer quotas.
2. **Hedef Pazar İstihbaratı (`DeepResearch / TenderPulse`):** Verified C-Level executive directory, water utility (Kamu Su İdaresi) tenders, Tier-1 EPC contractors, PE100/U-PVC infrastructure project tracking across European target markets (Romania, Germany, Italy, etc.).

Maintaining these as separate web applications incurred duplicate authentication logic, multiple domains, and split data stores. Furthermore, sales automation required server-side integration with Brevo CRM to push decision-maker leads without exposing API keys to the browser, alongside full CRUD capabilities and a 100% PWA mobile-first responsive design.

## Decision

1. **Modular Monorepo / App Shell Architecture:**
   - Adopt a unified App Shell hosting independent, plug-and-play modules under a single domain and single authentication session (`__Host-session`).
   - The application header houses a modular tab switcher:
     - `[ 🗺️ Pazar Haritası ]` (`#tab-map`)
     - `[ 🎯 İhale & Altyapı İstihbaratı ]` (`#tab-tender`)
     - Reserved expansion slots for future modules (Logistics, Costing, etc.).

2. **D1 Table Namespace Isolation:**
   - In Cloudflare D1 (`DB`), retain existing `countries`, `representatives`, `customers`, `quotes` tables.
   - Namespace all infrastructure tender intelligence tables with the `tender_` prefix:
     - `tender_countries`
     - `tender_companies`
     - `tender_source_urls`
     - `tender_crm_notes`
   - All SQL operations must strictly use `env.DB.prepare(...).bind(...)` parameterized statements.

3. **Unified Design System Standard:**
   - Standardize on DeepResearch's minimalist, high-density corporate aesthetic across all modules:
     - Tailwind Slate/Zinc/Sky color palette with `#f8fafc` background.
     - `Inter / system-ui` typography.
     - 40px low-profile metric ticker.
     - Border-slate-200 cards and solid `slate-900` buttons.
   - Refactor Map Assign's UI variables and panels to seamlessly blend with this design language.

4. **100% Mobile-First PWA & Scalable Grid:**
   - Enforce an adaptive CSS grid:
     - Mobile (<640px): 1 column, minimum 44x44px touch targets, thumb-zone ergonomics.
     - Tablet (640px-1024px): 2 columns.
     - Desktop (1024px-1440px): 3 columns.
     - Ultra-wide (>1440px): `max-w-7xl` container.
   - Viewport set to `viewport-fit=cover` with `env(safe-area-inset-*)` support for iOS notch and Android system bars.

5. **Server-Side Brevo CRM Integration:**
   - Manage `BREVO_API_KEY` strictly as a Cloudflare Worker secret.
   - Expose `/api/tender/companies/:id/sync-brevo` on the Cloudflare Worker to create or update contacts via Brevo v3 REST API with country, company, and PE100/U-PVC attributes.

## Consequences
- **Positive:** Zero context fragmentation for sales teams; single sign-on; Brevo secrets remain safe; mobile users receive a native-app-grade PWA experience.
- **Positive:** Adding Module 3 or Module 4 in the future requires only creating a submodule directory without risking regressions in existing modules.
- **Risk Mitigation:** Strict CSRF validation, parameter binding, and client-side HTML sanitization (`escapeHtml`) are enforced on all new endpoints and DOM templates.
