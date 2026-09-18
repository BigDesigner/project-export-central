/**
 * Tender Intelligence Module - View Controller
 * Implements the 100% PWA, mobile-first responsive DeepSearch design system
 */

import { TenderApi, TenderCompany, TenderCountry } from './tenderApi';

function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export class TenderViewController {
  private container: HTMLElement;
  private currentRole: 'admin' | 'representative' | null = null;
  private countries: TenderCountry[] = [];
  private activeCountry: string = 'all';
  private activeGroup: string = 'all';
  private activePriority: string = 'all';
  private searchQuery: string = '';
  private companies: TenderCompany[] = [];
  private totalCompanies: number = 0;
  private isLoading: boolean = false;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container #${containerId} not found.`);
    this.container = el;
  }

  public setRole(role: 'admin' | 'representative' | null) {
    this.currentRole = role;
  }

  public async init() {
    this.renderSkeleton();
    await this.loadCountries();
    await this.loadCompanies();
    this.render();
  }

  private async loadCountries() {
    this.countries = await TenderApi.getCountries();
    if (this.activeCountry !== 'all' && !this.countries.some(c => c.id === this.activeCountry)) {
      this.activeCountry = 'all';
    }
  }

  private async loadCompanies() {
    this.isLoading = true;
    const res = await TenderApi.getCompanies({
      country: this.activeCountry,
      group: this.activeGroup,
      priority: this.activePriority,
      search: this.searchQuery,
      limit: 150
    });
    this.companies = res.companies;
    this.totalCompanies = res.total;
    this.isLoading = false;
  }

  private renderSkeleton() {
    this.container.innerHTML = `
      <div class="w-full flex items-center justify-center p-12 text-slate-400 font-sans">
        <div class="flex items-center gap-3">
          <div class="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-sm font-medium">Ülke Raporu yükleniyor...</span>
        </div>
      </div>
    `;
  }

  public render() {
    const totalRecords = this.countries.reduce((sum, c) => sum + (c.count || 0), 0) || this.totalCompanies;
    const cLevelCount = Math.round(totalRecords * 2.6);

    this.container.innerHTML = `
      <div class="w-full min-h-screen bg-slate-50 text-slate-900 font-sans antialiased pb-20">
        
        <!-- 40px LOW-PROFILE METRIC TICKER -->
        <section class="w-full bg-white border-b border-slate-200 shadow-xs">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 h-10 flex items-center justify-between sm:justify-start sm:gap-8 text-xs text-slate-600 divide-x divide-slate-100 overflow-x-auto no-scrollbar font-mono">
            <div class="flex items-center gap-2 pr-4 sm:pr-8 shrink-0">
              <span class="text-slate-400 text-[10px] uppercase tracking-wider font-sans">İhale Hacmi:</span>
              <span class="font-bold text-slate-900 text-xs">€ 3.25B+</span>
            </div>
            <div class="flex items-center gap-2 px-4 sm:px-8 shrink-0">
              <span class="text-slate-400 text-[10px] uppercase tracking-wider font-sans">Kurumsal Dosya:</span>
              <span class="font-bold text-slate-900 text-xs">${totalRecords} Kayıt</span>
            </div>
            <div class="flex items-center gap-2 pl-4 sm:pl-8 shrink-0">
              <span class="text-slate-400 text-[10px] uppercase tracking-wider font-sans">Karar Verici:</span>
              <span class="font-bold text-slate-900 text-xs">${cLevelCount}+ C-Level</span>
            </div>
          </div>
        </section>

        <!-- COMMAND & FILTER BAR -->
        <section class="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-2">
          <div class="flex flex-col gap-3">
            
            <!-- Top Controls Row -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              
              <!-- Search Input -->
              <div class="relative flex-1">
                <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1016.65 16.65z"/>
                </svg>
                <input 
                  type="text" 
                  id="tender-search-input" 
                  value="${escapeHtml(this.searchQuery)}"
                  placeholder="Firma, şehir, yetkili veya PE100 / PVC ihale referansı ara..."
                  class="w-full pl-10 pr-10 h-10 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition shadow-xs"
                />
                ${this.searchQuery ? `
                  <button type="button" id="tender-search-clear" class="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition text-xs font-bold cursor-pointer z-10" title="Aramayı Temizle">✕</button>
                ` : ''}
              </div>

              <!-- Filter Dropdowns -->
              <div class="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <select id="tender-group-select" class="h-10 pl-3 pr-8 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 shadow-xs cursor-pointer shrink-0 transition">
                  <option value="all">Tüm Pazar Grupları</option>
                  <option value="Kamu Su İdaresi" ${this.activeGroup.includes('Kamu') ? 'selected' : ''}>Kamu Su İdareleri</option>
                  <option value="Müteahhitlik (EPC)" ${this.activeGroup.includes('EPC') ? 'selected' : ''}>EPC & Altyapı Müteahhitleri</option>
                  <option value="Dağıtıcı" ${this.activeGroup.includes('Dağıtıcı') ? 'selected' : ''}>Tiefbau Toptancı / Dağıtıcı</option>
                  <option value="Üretici" ${this.activeGroup.includes('Üretici') ? 'selected' : ''}>Boru Üreticileri</option>
                </select>

                <select id="tender-priority-select" class="h-10 pl-3 pr-8 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 shadow-xs cursor-pointer shrink-0 transition">
                  <option value="all">Tüm Öncelikler</option>
                  <option value="A++" ${this.activePriority === 'A++' ? 'selected' : ''}>Kritik (A++)</option>
                  <option value="A+" ${this.activePriority === 'A+' ? 'selected' : ''}>Yüksek (A+)</option>
                  <option value="A" ${this.activePriority === 'A' ? 'selected' : ''}>Öncelikli (A)</option>
                </select>

                ${this.currentRole === 'admin' ? `
                  <button type="button" id="tender-add-company-btn" class="h-10 px-3.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold rounded-lg shrink-0 flex items-center gap-1.5 transition shadow-xs cursor-pointer">
                    <span>+</span>
                    <span>Yeni Firma</span>
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- Country Pills / Chips Row -->
            <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <button 
                type="button"
                data-country="all" 
                class="tender-country-pill px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer shrink-0 border ${this.activeCountry === 'all' ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300'}"
              >
                🌍 Tüm Ülkeler (${totalRecords})
              </button>
              ${this.countries.map(c => `
                <button 
                  type="button"
                  data-country="${escapeHtml(c.id)}" 
                  class="tender-country-pill px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer shrink-0 border ${this.activeCountry === c.id ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300'}"
                >
                  ${escapeHtml(c.flag)} ${escapeHtml(c.name)} (${c.count})
                </button>
              `).join('')}
            </div>

          </div>
        </section>

        <!-- COMPANIES SCALABLE GRID (1 col mobile, 2 cols tablet, 3 cols desktop) -->
        <main class="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-3">
          
          <div class="flex items-center justify-between text-xs text-slate-500 font-medium mb-3">
            <span>Listelenen: <strong>${this.companies.length}</strong> / ${this.totalCompanies} Kurumsal Dosya</span>
            ${this.isLoading ? '<span class="text-slate-400 animate-pulse">Filtreleniyor...</span>' : ''}
          </div>

          ${this.countries.length === 0 ? `
            <div class="w-full bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
              <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-xl">🗺️</div>
              <h3 class="text-sm font-bold text-slate-900 mb-1">Henüz Size Atanmış Bir Ülke Bulunmuyor</h3>
              <p class="text-xs text-slate-500 max-w-md mx-auto">Pazar Haritası üzerinden yöneticiniz tarafından size ülke atandığında, ilgili ülke ihale ve müşteri raporları otomatik olarak burada listelenecektir.</p>
            </div>
          ` : this.companies.length === 0 ? `
            <div class="w-full bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
              <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-xl">🔍</div>
              <h3 class="text-sm font-bold text-slate-900 mb-1">Aramanızla Eşleşen Firma Bulunamadı</h3>
              <p class="text-xs text-slate-500">Lütfen filtreleri sıfırlayarak veya arama terimini değiştirerek tekrar deneyin.</p>
            </div>
          ` : `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              ${this.companies.map(comp => this.renderCompanyCard(comp)).join('')}
            </div>
          `}
        </main>

        <!-- MODAL CONTAINER (Dynamic) -->
        <div id="tender-modal-root"></div>
      </div>
    `;

    this.bindEvents();
  }

  private renderCompanyCard(comp: TenderCompany): string {
    const isWaterUtility = (comp.group_name || '').includes('Kamu');
    const isEpc = (comp.group_name || '').includes('EPC');
    const isDistributor = (comp.group_name || '').includes('Dağıtıcı');
    const isProducer = (comp.group_name || '').includes('Üretici');

    let badgeClass = 'bg-slate-100 text-slate-800 border-slate-200';
    if (isWaterUtility) badgeClass = 'bg-sky-50 text-sky-800 border-sky-200';
    else if (isEpc) badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    else if (isDistributor) badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
    else if (isProducer) badgeClass = 'bg-purple-50 text-purple-800 border-purple-200';

    const priorityBadge = comp.priority ? `
      <span class="text-[10px] font-bold px-2 py-0.5 rounded border ${
        comp.priority.includes('A++') ? 'bg-emerald-600 text-white border-emerald-700' :
        comp.priority.includes('A+') ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
        'bg-slate-100 text-slate-700 border-slate-200'
      }">
        ${escapeHtml(comp.priority)}
      </span>
    ` : '';

    const isBrevoSynced = !!comp.brevo_contact_id;

    // Direct phone calling
    const rawPhone = comp.phone ? comp.phone.trim() : '';
    const cleanPhone = rawPhone.split('/')[0].split(';')[0].replace(/[^\d+]/g, '');

    // Direct email client
    const rawEmail = comp.email ? comp.email.trim() : '';
    const firstEmail = rawEmail.split(';')[0].split(',')[0].trim();

    // Map navigation logic (iOS opens Apple Maps, Desktop/Android opens Google Maps)
    const addressParts: string[] = [];
    if (comp.address && comp.address.trim() && comp.address.trim() !== '-') {
      addressParts.push(comp.address.trim());
    } else if (comp.name && comp.name.trim()) {
      addressParts.push(comp.name.trim());
    }
    if (comp.city && comp.city.trim() && comp.city.trim() !== '-') {
      addressParts.push(comp.city.trim());
    }
    if (comp.country_name || comp.country_id) {
      addressParts.push(comp.country_name || comp.country_id);
    }
    const navQuery = addressParts.join(', ');
    const encodedNavQuery = encodeURIComponent(navQuery);
    const isAppleMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const navUrl = isAppleMobile
      ? `https://maps.apple.com/?daddr=${encodedNavQuery}&dirflg=d`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodedNavQuery}`;

    return `
      <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        
        <div>
          <!-- Header: Badges & City -->
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeClass}">
              ${escapeHtml(comp.group_name)}
            </span>
            <div class="flex items-center gap-1.5">
              ${priorityBadge}
              <span class="text-[11px] text-slate-500 font-medium">📍 ${escapeHtml(comp.city)}</span>
            </div>
          </div>

          <!-- Company Name -->
          <h2 class="text-sm font-bold text-slate-900 leading-snug mb-1.5 line-clamp-1 hover:text-sky-600 transition-colors cursor-pointer tender-card-title" data-id="${escapeHtml(comp.id)}">
            ${escapeHtml(comp.name)}
          </h2>

          <!-- Category / Pipeline Focus -->
          <p class="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed">
            ${escapeHtml(comp.category)}
          </p>

          <!-- Decision Maker Box -->
          <div class="bg-slate-50/80 border border-slate-100 rounded-lg p-2.5 mb-3 text-xs flex flex-col gap-1 font-sans">
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Karar Verici:</span>
              ${comp.notes_count ? `<span class="text-[10px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.2 rounded">📝 ${comp.notes_count} Not</span>` : ''}
            </div>
            <div class="font-bold text-slate-900 text-xs truncate">
              ${escapeHtml(comp.ceo || comp.project_officer || 'Merkezi Satın Alma Masası')}
            </div>
            ${comp.cpo ? `<div class="text-[11px] text-slate-600 truncate">CPO: ${escapeHtml(comp.cpo)}</div>` : ''}
          </div>
        </div>

        <!-- Action Footer with 44px touch targets -->
        <div class="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
          
          <div class="flex items-center gap-1.5">
            ${cleanPhone ? `
              <a href="tel:${cleanPhone}" class="min-w-[36px] h-9 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 text-xs rounded-lg flex items-center justify-center transition shadow-2xs" title="Telefonla Ara: ${escapeHtml(rawPhone)}" onclick="event.stopPropagation();">
                📞
              </a>
            ` : ''}
            ${firstEmail ? `
              <a href="mailto:${escapeHtml(firstEmail)}" class="min-w-[36px] h-9 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 text-xs rounded-lg flex items-center justify-center transition shadow-2xs" title="E-Posta Gönder: ${escapeHtml(rawEmail)}" onclick="event.stopPropagation();">
                ✉️
              </a>
            ` : ''}
            <a href="${navUrl}" target="_blank" rel="noopener noreferrer" class="min-w-[36px] h-9 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 text-xs rounded-lg flex items-center justify-center transition shadow-2xs" title="Haritada Aç / Yol Tarifi: ${escapeHtml(navQuery)}" onclick="event.stopPropagation();">
              📍
            </a>
            <button 
              type="button"
              class="tender-sync-brevo-btn h-9 px-2.5 ${isBrevoSynced ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' : 'bg-slate-50 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 text-slate-700 border border-slate-200'} text-xs font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer shadow-2xs"
              data-id="${escapeHtml(comp.id)}"
              title="${isBrevoSynced ? 'Brevo CRM ile senkronize edildi' : 'Brevo CRM kontaktlarına aktar'}"
              onclick="event.stopPropagation();"
            >
              <span>${isBrevoSynced ? '✓' : '⚡'}</span>
              <span class="hidden sm:inline">${isBrevoSynced ? 'Brevo' : 'Brevo\'ya Aktar'}</span>
            </button>
          </div>

          <div class="flex items-center gap-1.5">
            ${this.currentRole === 'admin' ? `
              <button 
                type="button" 
                class="tender-edit-company-btn h-9 px-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-200 hover:border-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer shadow-2xs"
                data-id="${escapeHtml(comp.id)}"
                title="Firmayı Düzenle"
                onclick="event.stopPropagation();"
              >
                <span>✏️</span>
                <span class="hidden sm:inline">Düzenle</span>
              </button>
            ` : ''}

            <button 
              type="button"
              class="tender-view-detail-btn h-9 px-3.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              data-id="${escapeHtml(comp.id)}"
            >
              <span>Detay</span>
              <span>→</span>
            </button>
          </div>

        </div>

      </div>
    `;
  }

  private bindEvents() {
    // Search input
    const searchInput = document.getElementById('tender-search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
          this.searchQuery = searchInput.value;
          await this.loadCompanies();
          this.render();
        }
      });
    }

    const clearBtn = document.getElementById('tender-search-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        this.searchQuery = '';
        await this.loadCompanies();
        this.render();
      });
    }

    // Group select
    const groupSelect = document.getElementById('tender-group-select') as HTMLSelectElement;
    if (groupSelect) {
      groupSelect.addEventListener('change', async () => {
        this.activeGroup = groupSelect.value;
        await this.loadCompanies();
        this.render();
      });
    }

    // Priority select
    const prioSelect = document.getElementById('tender-priority-select') as HTMLSelectElement;
    if (prioSelect) {
      prioSelect.addEventListener('change', async () => {
        this.activePriority = prioSelect.value;
        await this.loadCompanies();
        this.render();
      });
    }

    // Country pills
    const pills = this.container.querySelectorAll('.tender-country-pill');
    pills.forEach(p => {
      p.addEventListener('click', async (e) => {
        const country = (e.currentTarget as HTMLElement).getAttribute('data-country') || 'all';
        this.activeCountry = country;
        await this.loadCompanies();
        this.render();
      });
    });

    // Detail modal triggers
    const detailButtons = this.container.querySelectorAll('.tender-view-detail-btn, .tender-card-title');
    detailButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
        if (id) this.openDetailModal(id);
      });
    });

    // Brevo sync triggers
    const brevoButtons = this.container.querySelectorAll('.tender-sync-brevo-btn');
    brevoButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
        if (!id) return;
        const targetBtn = e.currentTarget as HTMLButtonElement;
        targetBtn.disabled = true;
        targetBtn.innerText = 'İşleniyor...';

        const res = await TenderApi.syncBrevo(id);
        if (res.success) {
          alert(res.message || 'Başarıyla Brevo CRM ile senkronize edildi.');
          await this.loadCompanies();
          this.render();
        } else {
          alert('Hata: ' + (res.error || 'Brevo senkronizasyonu başarısız oldu.'));
          targetBtn.disabled = false;
          targetBtn.innerHTML = '<span>⚡</span><span>Brevo</span>';
        }
      });
    });

    // Edit company triggers (Admin)
    const editButtons = this.container.querySelectorAll('.tender-edit-company-btn');
    editButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
        if (id) this.openEditCompanyModal(id);
      });
    });

    // Add company button
    const addBtn = document.getElementById('tender-add-company-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openAddCompanyModal());
    }
  }

  private async openDetailModal(id: string) {
    const data = await TenderApi.getCompanyDetail(id);
    if (!data) {
      alert('Firma detayları yüklenemedi.');
      return;
    }

    const { company, sources, notes } = data;
    const modalRoot = document.getElementById('tender-modal-root');
    if (!modalRoot) return;

    // Direct phone calling
    const rawPhone = company.phone ? company.phone.trim() : '';
    const cleanPhone = rawPhone.split('/')[0].split(';')[0].replace(/[^\d+]/g, '');

    // Direct email client
    const rawEmail = company.email ? company.email.trim() : '';
    const firstEmail = rawEmail.split(';')[0].split(',')[0].trim();

    // Map navigation logic (iOS opens Apple Maps, Desktop/Android opens Google Maps)
    const addressParts: string[] = [];
    if (company.address && company.address.trim() && company.address.trim() !== '-') {
      addressParts.push(company.address.trim());
    } else if (company.name && company.name.trim()) {
      addressParts.push(company.name.trim());
    }
    if (company.city && company.city.trim() && company.city.trim() !== '-') {
      addressParts.push(company.city.trim());
    }
    if (company.country_name || company.country_id) {
      addressParts.push(company.country_name || company.country_id);
    }
    const navQuery = addressParts.join(', ');
    const encodedNavQuery = encodeURIComponent(navQuery);
    const isAppleMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const modalNavUrl = isAppleMobile
      ? `https://maps.apple.com/?daddr=${encodedNavQuery}&dirflg=d`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodedNavQuery}`;

    modalRoot.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
          
          <!-- Modal Header -->
          <div class="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
            <div>
              <div class="flex items-center gap-2 mb-1.5">
                <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800">
                  ${escapeHtml(company.country_name || company.country_id)}
                </span>
                <span class="text-xs font-bold text-slate-500">📍 ${escapeHtml(company.city)}</span>
                ${company.priority ? `<span class="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">${escapeHtml(company.priority)}</span>` : ''}
              </div>
              <h2 class="text-lg font-extrabold text-slate-900 leading-snug">${escapeHtml(company.name)}</h2>
              <p class="text-xs text-slate-500 font-medium">${escapeHtml(company.group_name)}</p>
            </div>
            <button type="button" id="tender-modal-close" class="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 hover:border-slate-300 flex items-center justify-center font-bold text-base transition cursor-pointer">✕</button>
          </div>

          <!-- Modal Body (Scrollable) -->
          <div class="p-5 overflow-y-auto space-y-4 text-xs">
            
            <!-- Category & Focus -->
            <div>
              <h3 class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Faaliyet & Boru İhtiyacı</h3>
              <p class="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed font-mono text-[11px]">
                ${escapeHtml(company.category)}
              </p>
            </div>

            <!-- Contact & Address -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div class="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div class="text-[10px] text-slate-400 font-bold uppercase mb-1">İletişim Bilgileri</div>
                ${cleanPhone ? `<div>📞 <strong>Tel:</strong> <a href="tel:${cleanPhone}" class="text-sky-700 hover:underline font-semibold" title="Aramak için tıklayın">${escapeHtml(company.phone)}</a></div>` : ''}
                ${firstEmail ? `<div>✉️ <strong>Email:</strong> <a href="mailto:${escapeHtml(firstEmail)}" class="text-sky-700 hover:underline font-semibold" title="E-posta göndermek için tıklayın">${escapeHtml(company.email)}</a></div>` : ''}
                ${company.email_alt ? `<div>✉️ <strong>Alt Email:</strong> <a href="mailto:${escapeHtml(company.email_alt.trim())}" class="text-sky-700 hover:underline font-semibold">${escapeHtml(company.email_alt)}</a></div>` : ''}
              </div>
              <div class="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div class="text-[10px] text-slate-400 font-bold uppercase mb-1">Açık Adres & Konum</div>
                <div class="text-slate-700 mb-2">${escapeHtml(company.address || 'Kayıtlı adres bulunmuyor.')}</div>
                <a href="${modalNavUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-800 hover:underline" title="Haritada Aç / Yol Tarifi: ${escapeHtml(navQuery)}">
                  <span>📍</span> Haritada Aç / Yol Tarifi
                </a>
              </div>
            </div>

            <!-- Decision Makers -->
            <div class="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div class="text-[10px] text-slate-400 font-bold uppercase mb-1.5">C-Level & Satın Alma Heyeti</div>
              <div class="space-y-1">
                ${company.owner_group ? `<div>🏢 <strong>Bağlı Grup:</strong> ${escapeHtml(company.owner_group)}</div>` : ''}
                ${company.ceo ? `<div>👤 <strong>CEO / Genel Müdür:</strong> ${escapeHtml(company.ceo)}</div>` : ''}
                ${company.cpo ? `<div>💼 <strong>Satın Alma (CPO):</strong> ${escapeHtml(company.cpo)}</div>` : ''}
                ${company.cfo ? `<div>📊 <strong>Finans (CFO):</strong> ${escapeHtml(company.cfo)}</div>` : ''}
                ${company.strategy_note ? `<div class="mt-2 text-slate-600 bg-white p-2 rounded border border-slate-100 italic">📌 <strong>Karar Notu:</strong> ${escapeHtml(company.strategy_note)}</div>` : ''}
              </div>
            </div>

            <!-- Project Reference -->
            ${company.project_reference ? `
              <div>
                <h3 class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Ana Proje Referansları</h3>
                <p class="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed font-mono text-[11px]">
                  ${escapeHtml(company.project_reference)}
                </p>
              </div>
            ` : ''}

            <!-- Sources -->
            ${sources && sources.length > 0 ? `
              <div>
                <h3 class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Doğrulanmış Kaynaklar & İhale Portalları</h3>
                <div class="flex flex-wrap gap-1.5">
                  ${sources.map(s => `
                    <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 bg-white border border-slate-200 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-800 text-sky-700 rounded-md text-[11px] font-medium transition flex items-center gap-1 shadow-2xs">
                      <span>🔗 ${escapeHtml(s.label)}</span>
                      <span>↗</span>
                    </a>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- CRM Notes Section -->
            <div class="pt-3 border-t border-slate-100">
              <h3 class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Temsilci Görüşme & CRM Notları</h3>
              
              <!-- Add Note Form -->
              <div class="flex gap-2 mb-3">
                <input 
                  type="text" 
                  id="tender-new-note-input" 
                  placeholder="Görüşme notu ekleyin (örn: Numune boru istendi)..." 
                  class="flex-1 h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
                <button 
                  type="button" 
                  id="tender-save-note-btn" 
                  class="h-9 px-3.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold rounded-lg text-xs transition cursor-pointer shrink-0 shadow-2xs"
                >
                  Notu Kaydet
                </button>
              </div>

              <!-- Notes List -->
              <div class="space-y-1.5 max-h-36 overflow-y-auto">
                ${notes && notes.length > 0 ? notes.map(n => `
                  <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-start justify-between">
                    <div>
                      <div class="text-slate-800 font-medium">${escapeHtml(n.note)}</div>
                      <div class="text-[10px] text-slate-400 mt-0.5">${escapeHtml(n.representative_name || 'Temsilci')} · ${new Date(n.created_at).toLocaleDateString('tr-TR')}</div>
                    </div>
                  </div>
                `).join('') : '<div class="text-slate-400 italic text-[11px]">Henüz bir görüşme notu kaydedilmemiş.</div>'}
              </div>
            </div>

          </div>

          <!-- Modal Footer -->
          <div class="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div class="text-[11px] text-slate-500 font-medium">
              ${company.brevo_synced_at ? `✓ Brevo Sync: ${new Date(company.brevo_synced_at).toLocaleDateString('tr-TR')}` : 'Brevo: Beklemede'}
            </div>
            <div class="flex items-center gap-2">
              ${this.currentRole === 'admin' ? `
                <button type="button" id="tender-modal-edit-btn" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs flex items-center gap-1">
                  <span>✏️</span>
                  <span>Düzenle</span>
                </button>
                <button type="button" id="tender-modal-delete-btn" class="px-3.5 py-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs">
                  Firmayı Sil
                </button>
              ` : ''}
              <button type="button" id="tender-modal-footer-close" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs">
                Kapat
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    // Bind modal close
    const closeModal = () => { modalRoot.innerHTML = ''; };
    document.getElementById('tender-modal-close')?.addEventListener('click', closeModal);
    document.getElementById('tender-modal-footer-close')?.addEventListener('click', closeModal);

    // Edit Company (Admin)
    document.getElementById('tender-modal-edit-btn')?.addEventListener('click', () => {
      closeModal();
      this.openEditCompanyModal(id);
    });

    // Save Note
    document.getElementById('tender-save-note-btn')?.addEventListener('click', async () => {
      const input = document.getElementById('tender-new-note-input') as HTMLInputElement;
      const noteVal = input?.value.trim();
      if (!noteVal) return;
      const res = await TenderApi.addNote(id, noteVal);
      if (res.success) {
        this.openDetailModal(id);
      } else {
        alert('Hata: ' + (res.error || 'Not eklenemedi.'));
      }
    });

    // Delete Company (Admin)
    document.getElementById('tender-modal-delete-btn')?.addEventListener('click', async () => {
      if (!confirm(`${company.name} firmasını silmek istediğinizden emin misiniz?`)) return;
      const res = await TenderApi.deleteCompany(id);
      if (res.success) {
        closeModal();
        await this.loadCompanies();
        this.render();
      } else {
        alert('Hata: ' + (res.error || 'Firma silinemedi.'));
      }
    });
  }

  private async openEditCompanyModal(id: string) {
    if (this.currentRole !== 'admin') {
      alert('Firma düzenleme yetkisi sadece yöneticilere aittir.');
      return;
    }

    // Fetch fresh detail data for full fields
    let comp = this.companies.find(c => c.id === id);
    const detailData = await TenderApi.getCompanyDetail(id);
    if (detailData?.company) {
      comp = detailData.company;
    }

    if (!comp) {
      alert('Firma bilgileri bulunamadı.');
      return;
    }

    const modalRoot = document.getElementById('tender-modal-root');
    if (!modalRoot) return;

    modalRoot.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
          
          <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div class="flex items-center gap-2">
              <span class="text-base">✏️</span>
              <div>
                <h3 class="text-sm font-bold text-slate-900">Firmayı Düzenle</h3>
                <p class="text-[11px] text-slate-500">${escapeHtml(comp.name)}</p>
              </div>
            </div>
            <button type="button" id="tender-edit-close" class="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 hover:border-slate-300 flex items-center justify-center font-bold text-base transition cursor-pointer">✕</button>
          </div>

          <form id="tender-edit-form" class="p-4 overflow-y-auto space-y-3 text-xs">
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 mb-1">Ülke</label>
                <select id="edit-country" required class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900">
                  ${this.countries.map(c => `
                    <option value="${escapeHtml(c.id)}" ${c.id === comp!.country_id ? 'selected' : ''}>
                      ${escapeHtml(c.flag)} ${escapeHtml(c.name)}
                    </option>
                  `).join('')}
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-slate-700 mb-1">Pazar Grubu</label>
                <select id="edit-group" required class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900">
                  <option value="Müteahhitlik (EPC)" ${comp.group_name.includes('EPC') ? 'selected' : ''}>Müteahhitlik (EPC)</option>
                  <option value="Kamu Su İdaresi (BÖLGESEL)" ${comp.group_name.includes('Kamu') ? 'selected' : ''}>Kamu Su İdaresi (BÖLGESEL)</option>
                  <option value="Dağıtıcı (TİEFBAU)" ${comp.group_name.includes('Dağıtıcı') ? 'selected' : ''}>Dağıtıcı (TİEFBAU)</option>
                  <option value="Üretici (ÜRETİCİ)" ${comp.group_name.includes('Üretici') ? 'selected' : ''}>Üretici (ÜRETİCİ)</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2">
                <label class="block text-[11px] font-semibold text-slate-700 mb-1">Firma / Kurum Adı *</label>
                <input type="text" id="edit-name" value="${escapeHtml(comp.name)}" required class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900" />
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 mb-1">Öncelik Seviyesi</label>
                <select id="edit-priority" class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900">
                  <option value="Öncelikli (A)" ${comp.priority === 'Öncelikli (A)' ? 'selected' : ''}>Öncelikli (A)</option>
                  <option value="Yüksek (A+)" ${comp.priority === 'Yüksek (A+)' ? 'selected' : ''}>Yüksek (A+)</option>
                  <option value="Kritik (A++)" ${comp.priority === 'Kritik (A++)' ? 'selected' : ''}>Kritik (A++)</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 mb-1">Şehir</label>
                <input type="text" id="edit-city" value="${escapeHtml(comp.city || '')}" placeholder="Örn. Milano" class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900" />
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 mb-1">Telefon</label>
                <input type="text" id="edit-phone" value="${escapeHtml(comp.phone || '')}" placeholder="+39 ..." class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 mb-1">E-Posta</label>
                <input type="email" id="edit-email" value="${escapeHtml(comp.email || '')}" placeholder="info@company.com" class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900" />
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 mb-1">Alternatif E-Posta</label>
                <input type="text" id="edit-email-alt" value="${escapeHtml(comp.email_alt || '')}" placeholder="satinlama@company.com" class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900" />
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-1">Boru İhtiyacı / Faaliyet Alanı</label>
              <input type="text" id="edit-category" value="${escapeHtml(comp.category || '')}" placeholder="Örn. PE100 / PVC Altyapı Boruları" class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900" />
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-1">Açık Adres</label>
              <textarea id="edit-address" rows="2" placeholder="Firma açık adresi..." class="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900">${escapeHtml(comp.address || '')}</textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 mb-1">CEO / Genel Müdür</label>
                <input type="text" id="edit-ceo" value="${escapeHtml(comp.ceo || '')}" placeholder="Örn. Pietro Salini" class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900" />
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 mb-1">CPO / Satın Alma Başkanı</label>
                <input type="text" id="edit-cpo" value="${escapeHtml(comp.cpo || '')}" placeholder="Örn. Marco Rossi" class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900" />
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-1">Strateji / İhale Notu</label>
              <textarea id="edit-strategy-note" rows="2" placeholder="Örn. Doğrudan fabrika teslim veya Tiefbau bayisi üzerinden tedarik tercih ediyor..." class="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900">${escapeHtml(comp.strategy_note || '')}</textarea>
            </div>

            <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button type="button" id="tender-edit-cancel" class="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs">İptal</button>
              <button type="submit" id="tender-edit-submit-btn" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs">Değişiklikleri Kaydet</button>
            </div>
          </form>

        </div>
      </div>
    `;

    const closeModal = () => { modalRoot.innerHTML = ''; };
    document.getElementById('tender-edit-close')?.addEventListener('click', closeModal);
    document.getElementById('tender-edit-cancel')?.addEventListener('click', closeModal);

    document.getElementById('tender-edit-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('tender-edit-submit-btn') as HTMLButtonElement;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Kaydediliyor...';
      }

      const country_id = (document.getElementById('edit-country') as HTMLSelectElement).value;
      const group_name = (document.getElementById('edit-group') as HTMLSelectElement).value;
      const name = (document.getElementById('edit-name') as HTMLInputElement).value.trim();
      const priority = (document.getElementById('edit-priority') as HTMLSelectElement).value;
      const city = (document.getElementById('edit-city') as HTMLInputElement).value.trim();
      const phone = (document.getElementById('edit-phone') as HTMLInputElement).value.trim();
      const email = (document.getElementById('edit-email') as HTMLInputElement).value.trim();
      const email_alt = (document.getElementById('edit-email-alt') as HTMLInputElement).value.trim();
      const category = (document.getElementById('edit-category') as HTMLInputElement).value.trim();
      const address = (document.getElementById('edit-address') as HTMLTextAreaElement).value.trim();
      const ceo = (document.getElementById('edit-ceo') as HTMLInputElement).value.trim();
      const cpo = (document.getElementById('edit-cpo') as HTMLInputElement).value.trim();
      const strategy_note = (document.getElementById('edit-strategy-note') as HTMLTextAreaElement).value.trim();

      const res = await TenderApi.updateCompany(id, {
        country_id,
        name,
        group_name,
        category,
        city,
        priority,
        phone,
        email,
        email_alt,
        address,
        ceo,
        cpo,
        strategy_note
      });

      if (res.success) {
        closeModal();
        await this.loadCompanies();
        this.render();
      } else {
        alert('Hata: ' + (res.error || 'Firma güncellenemedi.'));
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = 'Değişiklikleri Kaydet';
        }
      }
    });
  }

  private openAddCompanyModal() {
    const modalRoot = document.getElementById('tender-modal-root');
    if (!modalRoot) return;

    modalRoot.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
          
          <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 class="text-sm font-bold text-slate-900">Yeni İhale / Müşteri Dosyası Ekle</h3>
            <button type="button" id="tender-add-close" class="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 hover:border-slate-300 flex items-center justify-center font-bold text-base transition cursor-pointer">✕</button>
          </div>

          <form id="tender-add-form" class="p-4 overflow-y-auto space-y-3 text-xs">
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-1">Ülke Seçin</label>
              <select id="add-country" required class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900">
                ${this.countries.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.flag)} ${escapeHtml(c.name)}</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-1">Firma / İdare Adı</label>
              <input type="text" id="add-name" required placeholder="Örn. Webuild S.p.A." class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900" />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 mb-1">Pazar Grubu</label>
                <select id="add-group" required class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900">
                  <option value="Müteahhitlik (EPC)">Müteahhitlik (EPC)</option>
                  <option value="Kamu Su İdaresi (BÖLGESEL)">Kamu Su İdaresi (BÖLGESEL)</option>
                  <option value="Dağıtıcı (TİEFBAU)">Dağıtıcı (TİEFBAU)</option>
                  <option value="Üretici (ÜRETİCİ)">Üretici (ÜRETİCİ)</option>
                </select>
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 mb-1">Şehir</label>
                <input type="text" id="add-city" required placeholder="Örn. Milano" class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900" />
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-1">Boru İhtiyacı / Kategori</label>
              <input type="text" id="add-category" placeholder="Örn. PE100 / PE100-RC İçme Suyu & Kanalizasyon" class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900" />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 mb-1">Telefon</label>
                <input type="text" id="add-phone" placeholder="+39 ..." class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900" />
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 mb-1">E-Posta</label>
                <input type="email" id="add-email" placeholder="info@company.com" class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900" />
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-1">CEO / Karar Verici Adı</label>
              <input type="text" id="add-ceo" placeholder="Örn. Pietro Salini" class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900" />
            </div>

            <div class="pt-2 flex justify-end gap-2">
              <button type="button" id="tender-add-cancel" class="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs">İptal</button>
              <button type="submit" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs">Kaydet</button>
            </div>
          </form>

        </div>
      </div>
    `;

    const closeModal = () => { modalRoot.innerHTML = ''; };
    document.getElementById('tender-add-close')?.addEventListener('click', closeModal);
    document.getElementById('tender-add-cancel')?.addEventListener('click', closeModal);

    document.getElementById('tender-add-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const country_id = (document.getElementById('add-country') as HTMLSelectElement).value;
      const name = (document.getElementById('add-name') as HTMLInputElement).value;
      const group_name = (document.getElementById('add-group') as HTMLSelectElement).value;
      const city = (document.getElementById('add-city') as HTMLInputElement).value;
      const category = (document.getElementById('add-category') as HTMLInputElement).value;
      const phone = (document.getElementById('add-phone') as HTMLInputElement).value;
      const email = (document.getElementById('add-email') as HTMLInputElement).value;
      const ceo = (document.getElementById('add-ceo') as HTMLInputElement).value;

      const res = await TenderApi.createCompany({
        country_id,
        name,
        group_name,
        city,
        category,
        phone,
        email,
        ceo,
        priority: 'Öncelikli (A)'
      });

      if (res.success) {
        closeModal();
        await this.loadCountries();
        await this.loadCompanies();
        this.render();
      } else {
        alert('Hata: ' + (res.error || 'Firma eklenemedi.'));
      }
    });
  }
}
