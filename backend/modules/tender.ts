import { SessionData } from '../session';
import { syncContactToBrevo } from '../core/brevo';

export interface TenderEnv {
  DB: D1Database;
  BREVO_API_KEY?: string;
  BREVO_LIST_ID?: string;
}

function jsonResponse(data: any, status = 200, headers?: Headers): Response {
  const resHeaders = headers || new Headers();
  resHeaders.set('Content-Type', 'application/json');
  resHeaders.set('X-Content-Type-Options', 'nosniff');
  return new Response(JSON.stringify(data), { status, headers: resHeaders });
}

export async function handleTenderRoute(
  request: Request,
  env: TenderEnv,
  session: SessionData | null,
  corsHeaders: Headers
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // 1. GET /api/tender/countries
  if (path === '/api/tender/countries' && method === 'GET') {
    try {
      const stmt = env.DB.prepare(`
        SELECT c.id, c.name, c.flag, 
               COUNT(comp.id) as count, c.active
        FROM tender_countries c
        LEFT JOIN tender_companies comp ON comp.country_id = c.id AND comp.deleted_at IS NULL
        WHERE c.active = 1
        GROUP BY c.id, c.name, c.flag, c.active
        ORDER BY count DESC, c.name ASC
      `);
      const { results } = await stmt.all();
      return jsonResponse({ countries: results || [] }, 200, corsHeaders);
    } catch (err: any) {
      console.error('Failed to get tender countries:', err);
      return jsonResponse({ error: 'Ülke listesi yüklenemedi.' }, 500, corsHeaders);
    }
  }

  // 2. GET /api/tender/companies
  if (path === '/api/tender/companies' && method === 'GET') {
    try {
      const country = url.searchParams.get('country') || '';
      const group = url.searchParams.get('group') || '';
      const priority = url.searchParams.get('priority') || '';
      const search = (url.searchParams.get('search') || '').trim().toLowerCase();
      const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '100', 10), 1), 200);
      const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);

      let query = `
        SELECT c.*, 
               (SELECT COUNT(*) FROM tender_crm_notes n WHERE n.company_id = c.id) as notes_count
        FROM tender_companies c
        WHERE c.deleted_at IS NULL
      `;
      const bindings: any[] = [];

      if (country && country !== 'all') {
        query += ` AND c.country_id = ?`;
        bindings.push(country);
      }

      if (group && group !== 'all') {
        query += ` AND c.group_name = ?`;
        bindings.push(group);
      }

      if (priority && priority !== 'all') {
        query += ` AND c.priority = ?`;
        bindings.push(priority);
      }

      if (search) {
        query += ` AND (
          LOWER(c.name) LIKE ? OR 
          LOWER(c.city) LIKE ? OR 
          LOWER(c.category) LIKE ? OR 
          LOWER(c.ceo) LIKE ? OR 
          LOWER(c.cpo) LIKE ? OR 
          LOWER(c.project_reference) LIKE ?
        )`;
        const searchPattern = `%${search}%`;
        bindings.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      }

      query += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
      bindings.push(limit, offset);

      const stmt = env.DB.prepare(query).bind(...bindings);
      const { results } = await stmt.all();

      // Total count query with same filters
      let countQuery = `SELECT COUNT(*) as total FROM tender_companies c WHERE c.deleted_at IS NULL`;
      const countBindings: any[] = [];

      if (country && country !== 'all') {
        countQuery += ` AND c.country_id = ?`;
        countBindings.push(country);
      }
      if (group && group !== 'all') {
        countQuery += ` AND c.group_name = ?`;
        countBindings.push(group);
      }
      if (priority && priority !== 'all') {
        countQuery += ` AND c.priority = ?`;
        countBindings.push(priority);
      }
      if (search) {
        countQuery += ` AND (
          LOWER(c.name) LIKE ? OR 
          LOWER(c.city) LIKE ? OR 
          LOWER(c.category) LIKE ? OR 
          LOWER(c.ceo) LIKE ? OR 
          LOWER(c.cpo) LIKE ? OR 
          LOWER(c.project_reference) LIKE ?
        )`;
        const searchPattern = `%${search}%`;
        countBindings.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      }

      const countStmt = env.DB.prepare(countQuery).bind(...countBindings);
      const countRes: any = await countStmt.first();
      const total = countRes ? countRes.total : (results?.length || 0);

      return jsonResponse({
        companies: results || [],
        total,
        limit,
        offset
      }, 200, corsHeaders);
    } catch (err: any) {
      console.error('Failed to get tender companies:', err);
      return jsonResponse({ error: 'Firma listesi yüklenemedi.' }, 500, corsHeaders);
    }
  }

  // 3. GET /api/tender/companies/:id
  const companyDetailMatch = path.match(/^\/api\/tender\/companies\/([a-zA-Z0-9_-]+)$/);
  if (companyDetailMatch && method === 'GET') {
    const id = companyDetailMatch[1];
    try {
      const compStmt = env.DB.prepare(`
        SELECT c.*, tc.name as country_name, tc.flag as country_flag
        FROM tender_companies c
        JOIN tender_countries tc ON tc.id = c.country_id
        WHERE c.id = ? AND c.deleted_at IS NULL
      `).bind(id);
      const company: any = await compStmt.first();

      if (!company) {
        return jsonResponse({ error: 'Firma bulunamadı.' }, 404, corsHeaders);
      }

      // Sources
      const srcStmt = env.DB.prepare(`
        SELECT id, label, url FROM tender_source_urls WHERE company_id = ? ORDER BY id ASC
      `).bind(id);
      const { results: sources } = await srcStmt.all();

      // CRM Notes
      const notesStmt = env.DB.prepare(`
        SELECT n.id, n.note, n.created_at, r.name as representative_name
        FROM tender_crm_notes n
        LEFT JOIN representatives r ON r.id = n.representative_id
        WHERE n.company_id = ?
        ORDER BY n.created_at DESC
      `).bind(id);
      const { results: notes } = await notesStmt.all();

      return jsonResponse({
        company,
        sources: sources || [],
        notes: notes || []
      }, 200, corsHeaders);
    } catch (err: any) {
      console.error('Failed to get tender company detail:', err);
      return jsonResponse({ error: 'Firma detayları yüklenemedi.' }, 500, corsHeaders);
    }
  }

  // ============================================================================
  // STATE-CHANGING ENDPOINTS (Require Session Authentication)
  // ============================================================================
  if (!session) {
    return jsonResponse({ error: 'Yetkilendirme gerekiyor. Lütfen giriş yapın.' }, 401, corsHeaders);
  }

  // 4. POST /api/tender/companies (Admin Only)
  if (path === '/api/tender/companies' && method === 'POST') {
    if (session.role !== 'admin') {
      return jsonResponse({ error: 'Yeni firma ekleme yetkisi sadece yöneticilere aittir.' }, 403, corsHeaders);
    }

    try {
      const body: any = await request.json();
      const {
        country_id, name, group_name, category, city, priority,
        phone, email, email_alt, address, project_officer,
        owner_group, ceo, cpo, cfo, strategy_note, project_reference, source_text,
        source_urls
      } = body;

      if (!country_id || !name || !group_name) {
        return jsonResponse({ error: 'Ülke, Firma Adı ve Grup alanları zorunludur.' }, 400, corsHeaders);
      }

      const id = `${country_id}-${Date.now().toString(36)}`;

      await env.DB.prepare(`
        INSERT INTO tender_companies (
          id, country_id, name, group_name, category, city, priority,
          phone, email, email_alt, address, project_officer,
          owner_group, ceo, cpo, cfo, strategy_note, project_reference, source_text
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, country_id, name, group_name, category || '', city || '', priority || 'Öncelikli (A)',
        phone || '', email || '', email_alt || '', address || '', project_officer || '',
        owner_group || '', ceo || '', cpo || '', cfo || '', strategy_note || '', project_reference || '', source_text || ''
      ).run();

      // Add sources if provided
      if (Array.isArray(source_urls)) {
        for (const s of source_urls) {
          if (s && s.url) {
            await env.DB.prepare(`
              INSERT INTO tender_source_urls (company_id, label, url) VALUES (?, ?, ?)
            `).bind(id, s.label || 'Web', s.url).run();
          }
        }
      }

      return jsonResponse({ success: true, id }, 201, corsHeaders);
    } catch (err: any) {
      console.error('Failed to create tender company:', err);
      return jsonResponse({ error: 'Firma oluşturulamadı.' }, 500, corsHeaders);
    }
  }

  // 5. PUT /api/tender/companies/:id (Admin Only)
  if (companyDetailMatch && method === 'PUT') {
    if (session.role !== 'admin') {
      return jsonResponse({ error: 'Firma düzenleme yetkisi sadece yöneticilere aittir.' }, 403, corsHeaders);
    }

    const id = companyDetailMatch[1];
    try {
      const body: any = await request.json();
      const {
        name, group_name, category, city, priority,
        phone, email, email_alt, address, project_officer,
        owner_group, ceo, cpo, cfo, strategy_note, project_reference, source_text
      } = body;

      if (!name || !group_name) {
        return jsonResponse({ error: 'Firma Adı ve Grup alanları zorunludur.' }, 400, corsHeaders);
      }

      await env.DB.prepare(`
        UPDATE tender_companies SET
          name = ?, group_name = ?, category = ?, city = ?, priority = ?,
          phone = ?, email = ?, email_alt = ?, address = ?, project_officer = ?,
          owner_group = ?, ceo = ?, cpo = ?, cfo = ?, strategy_note = ?,
          project_reference = ?, source_text = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND deleted_at IS NULL
      `).bind(
        name, group_name, category || '', city || '', priority || '',
        phone || '', email || '', email_alt || '', address || '', project_officer || '',
        owner_group || '', ceo || '', cpo || '', cfo || '', strategy_note || '',
        project_reference || '', source_text || '', id
      ).run();

      return jsonResponse({ success: true }, 200, corsHeaders);
    } catch (err: any) {
      console.error('Failed to update tender company:', err);
      return jsonResponse({ error: 'Firma güncellenemedi.' }, 500, corsHeaders);
    }
  }

  // 6. DELETE /api/tender/companies/:id (Admin Only - Soft Delete)
  if (companyDetailMatch && method === 'DELETE') {
    if (session.role !== 'admin') {
      return jsonResponse({ error: 'Firma silme yetkisi sadece yöneticilere aittir.' }, 403, corsHeaders);
    }

    const id = companyDetailMatch[1];
    try {
      await env.DB.prepare(`
        UPDATE tender_companies 
        SET deleted_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND deleted_at IS NULL
      `).bind(id).run();

      return jsonResponse({ success: true }, 200, corsHeaders);
    } catch (err: any) {
      console.error('Failed to delete tender company:', err);
      return jsonResponse({ error: 'Firma silinemedi.' }, 500, corsHeaders);
    }
  }

  // 7. POST /api/tender/companies/:id/notes (Admin or Representative)
  const notesMatch = path.match(/^\/api\/tender\/companies\/([a-zA-Z0-9_-]+)\/notes$/);
  if (notesMatch && method === 'POST') {
    const id = notesMatch[1];
    try {
      const body: any = await request.json();
      const noteText = (body.note || '').trim();

      if (!noteText) {
        return jsonResponse({ error: 'Not içeriği boş olamaz.' }, 400, corsHeaders);
      }

      await env.DB.prepare(`
        INSERT INTO tender_crm_notes (company_id, representative_id, note)
        VALUES (?, ?, ?)
      `).bind(id, session.id || null, noteText).run();

      return jsonResponse({ success: true }, 201, corsHeaders);
    } catch (err: any) {
      console.error('Failed to add tender note:', err);
      return jsonResponse({ error: 'Görüşme notu eklenemedi.' }, 500, corsHeaders);
    }
  }

  // 8. POST /api/tender/companies/:id/sync-brevo (Admin or Representative)
  const brevoMatch = path.match(/^\/api\/tender\/companies\/([a-zA-Z0-9_-]+)\/sync-brevo$/);
  if (brevoMatch && method === 'POST') {
    const id = brevoMatch[1];
    try {
      const companyStmt = env.DB.prepare(`
        SELECT c.*, tc.name as country_name
        FROM tender_companies c
        JOIN tender_countries tc ON tc.id = c.country_id
        WHERE c.id = ? AND c.deleted_at IS NULL
      `).bind(id);
      const company: any = await companyStmt.first();

      if (!company) {
        return jsonResponse({ error: 'Firma bulunamadı.' }, 404, corsHeaders);
      }

      const targetEmail = (company.email || company.email_alt || '').trim();
      if (!targetEmail || !targetEmail.includes('@')) {
        return jsonResponse({ error: 'Firma için geçerli bir e-posta adresi bulunamadı.' }, 400, corsHeaders);
      }

      const apiKey = env.BREVO_API_KEY || '';
      const listId = env.BREVO_LIST_ID ? parseInt(env.BREVO_LIST_ID, 10) : undefined;

      // Extract CEO / contact name
      let firstName = company.ceo || company.project_officer || company.name;
      let lastName = '';
      if (firstName.includes(' ')) {
        const parts = firstName.split(' ');
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
      }

      const syncRes = await syncContactToBrevo(apiKey, {
        email: targetEmail,
        firstName,
        lastName,
        companyName: company.name,
        country: company.country_name,
        city: company.city,
        phone: company.phone,
        jobTitle: company.ceo ? 'CEO / Yönetici' : company.project_officer || 'Satın Alma Yetkilisi',
        pipeSegment: company.category,
        listId
      });

      if (!syncRes.success) {
        return jsonResponse({ error: syncRes.error || 'Brevo ile senkronize edilemedi.' }, 400, corsHeaders);
      }

      // Update Brevo sync status in D1
      await env.DB.prepare(`
        UPDATE tender_companies 
        SET brevo_contact_id = ?, brevo_synced_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(syncRes.contactId || 'synced', id).run();

      return jsonResponse({
        success: true,
        message: `${company.name} yetkilisi Brevo CRM ile başarıyla senkronize edildi.`,
        contactId: syncRes.contactId
      }, 200, corsHeaders);
    } catch (err: any) {
      console.error('Brevo sync error:', err);
      return jsonResponse({ error: 'Brevo senkronizasyonu sırasında hata oluştu.' }, 500, corsHeaders);
    }
  }

  return jsonResponse({ error: 'Tender endpoint not found.' }, 404, corsHeaders);
}
