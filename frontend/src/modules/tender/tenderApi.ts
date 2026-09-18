/**
 * Tender Intelligence Module - API Client
 * Connects to /api/tender/* Cloudflare Worker endpoints
 */

export interface TenderCountry {
  id: string;
  name: string;
  flag: string;
  count: number;
  active: number;
}

export interface TenderSourceUrl {
  id?: number;
  label: string;
  url: string;
}

export interface TenderCrmNote {
  id: number;
  note: string;
  created_at: string;
  representative_name?: string;
}

export interface TenderCompany {
  id: string;
  country_id: string;
  name: string;
  group_name: string;
  category: string;
  city: string;
  priority: string;
  phone?: string;
  email?: string;
  email_alt?: string;
  address?: string;
  project_officer?: string;
  owner_group?: string;
  ceo?: string;
  cpo?: string;
  cfo?: string;
  strategy_note?: string;
  project_reference?: string;
  source_text?: string;
  brevo_contact_id?: string;
  brevo_synced_at?: string;
  notes_count?: number;
  country_name?: string;
  country_flag?: string;
}

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? ''
  : (window.location.hostname.includes('tenderpulse')
      ? 'https://tenderpulse-api.akansu.com'
      : 'https://map-api.akansu.com');

function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = `${API_BASE}${path}`;
  init.credentials = 'include';
  return fetch(url, init);
}

export const TenderApi = {
  async getCountries(): Promise<TenderCountry[]> {
    try {
      const res = await apiFetch('/api/tender/countries');
      if (res.ok) {
        const data = await res.json();
        return data.countries || [];
      }
    } catch (e) {
      console.error('Failed to fetch countries:', e);
    }
    return [];
  },

  async getCompanies(params: {
    country?: string;
    group?: string;
    priority?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ companies: TenderCompany[]; total: number }> {
    try {
      const query = new URLSearchParams();
      if (params.country) query.set('country', params.country);
      if (params.group) query.set('group', params.group);
      if (params.priority) query.set('priority', params.priority);
      if (params.search) query.set('search', params.search);
      if (params.limit) query.set('limit', String(params.limit));
      if (params.offset) query.set('offset', String(params.offset));

      const res = await apiFetch(`/api/tender/companies?${query.toString()}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Failed to fetch companies:', e);
    }
    return { companies: [], total: 0 };
  },

  async getCompanyDetail(id: string): Promise<{
    company: TenderCompany;
    sources: TenderSourceUrl[];
    notes: TenderCrmNote[];
  } | null> {
    try {
      const res = await apiFetch(`/api/tender/companies/${encodeURIComponent(id)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Failed to fetch company detail:', e);
    }
    return null;
  },

  async createCompany(data: Partial<TenderCompany> & { source_urls?: TenderSourceUrl[] }): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const res = await apiFetch('/api/tender/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Firma eklenemedi.' };
    }
  },

  async updateCompany(id: string, data: Partial<TenderCompany>): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await apiFetch(`/api/tender/companies/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Firma güncellenemedi.' };
    }
  },

  async deleteCompany(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await apiFetch(`/api/tender/companies/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Firma silinemedi.' };
    }
  },

  async addNote(companyId: string, note: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await apiFetch(`/api/tender/companies/${encodeURIComponent(companyId)}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Not eklenemedi.' };
    }
  },

  async syncBrevo(companyId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await apiFetch(`/api/tender/companies/${encodeURIComponent(companyId)}/sync-brevo`, {
        method: 'POST'
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Brevo senkronizasyonu başarısız.' };
    }
  }
};
