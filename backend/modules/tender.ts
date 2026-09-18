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

async function getAllowedCountryIdsForSession(
  env: TenderEnv,
  session: SessionData | null
): Promise<{ isAll: boolean; allowedIds: string[] }> {
  if (!session) {
    return { isAll: false, allowedIds: [] };
  }

  // Admin has access to all countries
  if (session.role === 'admin') {
    return { isAll: true, allowedIds: [] };
  }

  // Representative: only countries assigned in Pazar Haritası (country_assignments)
  if (session.role === 'representative' && session.id) {
    const assignStmt = env.DB.prepare(
      'SELECT country_code FROM country_assignments WHERE representative_id = ?'
    ).bind(session.id);
    const { results: assignRows } = await assignStmt.all();
    const assignedCodes = (assignRows || []).map((r: any) =>
      String(r.country_code || '').trim().toLowerCase()
    );

    if (assignedCodes.length === 0) {
      return { isAll: false, allowedIds: [] };
    }

    // Active tender countries
    const tcStmt = env.DB.prepare('SELECT id, name FROM tender_countries WHERE active = 1');
    const { results: tcRows } = await tcStmt.all();

    // Map of country names from master countries table
    const cStmt = env.DB.prepare('SELECT code, name FROM countries');
    const { results: cRows } = await cStmt.all();

    const codeToName: Record<string, string> = {};
    (cRows || []).forEach((r: any) => {
      if (r.code && r.name) {
        codeToName[String(r.code).toLowerCase()] = String(r.name).toLowerCase();
      }
    });

    const KNOWN_CODE_TO_ID: Record<string, string> = {
      ro: 'romania',
      de: 'germany',
      it: 'italy',
      tr: 'turkey',
      fr: 'france',
      es: 'spain',
      gb: 'united-kingdom',
      uk: 'united-kingdom',
      us: 'united-states',
      nl: 'netherlands',
      be: 'belgium',
      pl: 'poland'
    };

    const allowedIds = new Set<string>();

    for (const code of assignedCodes) {
      if (KNOWN_CODE_TO_ID[code]) {
        allowedIds.add(KNOWN_CODE_TO_ID[code]);
      }
      const directMatch = (tcRows || []).find(
        (tc: any) => String(tc.id).toLowerCase() === code
      );
      if (directMatch) {
        allowedIds.add(directMatch.id);
      }
      const countryName = codeToName[code];
      if (countryName) {
        const nameMatch = (tcRows || []).find(
          (tc: any) => String(tc.name).toLowerCase() === countryName
        );
        if (nameMatch) {
          allowedIds.add(nameMatch.id);
        }
      }
    }

    return { isAll: false, allowedIds: Array.from(allowedIds) };
  }

  return { isAll: false, allowedIds: [] };
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
    if (!session) {
      return jsonResponse({ error: 'Oturum açmanız gerekmektedir.' }, 401, corsHeaders);
    }

    try {
      const { isAll, allowedIds } = await getAllowedCountryIdsForSession(env, session);
      if (!isAll && allowedIds.length === 0) {
        return jsonResponse({ countries: [] }, 200, corsHeaders);
      }

      let query = `
        SELECT c.id, c.name, c.flag, 
               COUNT(comp.id) as count, c.active
        FROM tender_countries c
        LEFT JOIN tender_companies comp ON comp.country_id = c.id AND comp.deleted_at IS NULL
        WHERE c.active = 1
      `;
      const bindings: any[] = [];

      if (!isAll) {
        const placeholders = allowedIds.map(() => '?').join(',');
        query += ` AND c.id IN (${placeholders})`;
        bindings.push(...allowedIds);
      }

      query += `
        GROUP BY c.id, c.name, c.flag, c.active
        ORDER BY count DESC, c.name ASC
      `;

      const stmt = env.DB.prepare(query).bind(...bindings);
      const { results } = await stmt.all();
      return jsonResponse({ countries: results || [] }, 200, corsHeaders);
    } catch (err: any) {
      console.error('Failed to get tender countries:', err);
      return jsonResponse({ error: 'Ülke listesi yüklenemedi.' }, 500, corsHeaders);
    }
  }

  // 2. GET /api/tender/companies
  if (path === '/api/tender/companies' && method === 'GET') {
    if (!session) {
      return jsonResponse({ error: 'Oturum açmanız gerekmektedir.' }, 401, corsHeaders);
    }

    try {
      const { isAll, allowedIds } = await getAllowedCountryIdsForSession(env, session);
      if (!isAll && allowedIds.length === 0) {
        return jsonResponse({ companies: [], total: 0, limit: 100, offset: 0 }, 200, corsHeaders);
      }

      const country = url.searchParams.get('country') || '';
      const group = url.searchParams.get('group') || '';
      const priority = url.searchParams.get('priority') || '';
      const search = (url.searchParams.get('search') || '').trim().toLowerCase();
      const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '100', 10), 1), 200);
      const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);

      const whereConditions: string[] = ['c.deleted_at IS NULL'];
      const filterBindings: any[] = [];

      // Enforce representative country isolation
      if (!isAll) {
        if (country && country !== 'all') {
          if (!allowedIds.includes(country)) {
            // Representative trying to view an unassigned country
            return jsonResponse({ companies: [], total: 0, limit, offset }, 200, corsHeaders);
          }
          whereConditions.push('c.country_id = ?');
          filterBindings.push(country);
        } else {
          const placeholders = allowedIds.map(() => '?').join(',');
          whereConditions.push(`c.country_id IN (${placeholders})`);
          filterBindings.push(...allowedIds);
        }
      } else {
        // Admin
        if (country && country !== 'all') {
          whereConditions.push('c.country_id = ?');
          filterBindings.push(country);
        }
      }

      if (group && group !== 'all') {
        whereConditions.push('c.group_name = ?');
        filterBindings.push(group);
      }

      if (priority && priority !== 'all') {
        whereConditions.push('c.priority = ?');
        filterBindings.push(priority);
      }

      if (search) {
        whereConditions.push(`(
          LOWER(c.name) LIKE ? OR 
          LOWER(c.city) LIKE ? OR 
          LOWER(c.category) LIKE ? OR 
          LOWER(c.ceo) LIKE ? OR 
          LOWER(c.cpo) LIKE ? OR 
          LOWER(c.project_reference) LIKE ?
        )`);
        const searchPattern = `%${search}%`;
        filterBindings.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      const query = `
        SELECT c.*, 
               (SELECT COUNT(*) FROM tender_crm_notes n WHERE n.company_id = c.id) as notes_count
        FROM tender_companies c
        ${whereClause}
        ORDER BY c.created_at DESC LIMIT ? OFFSET ?
      `;

      const stmt = env.DB.prepare(query).bind(...filterBindings, limit, offset);
      const { results } = await stmt.all();

      // Total count query with same filters
      const countQuery = `SELECT COUNT(*) as total FROM tender_companies c ${whereClause}`;
      const countStmt = env.DB.prepare(countQuery).bind(...filterBindings);
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
    if (!session) {
      return jsonResponse({ error: 'Oturum açmanız gerekmektedir.' }, 401, corsHeaders);
    }

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

      // Check permission for representative
      const { isAll, allowedIds } = await getAllowedCountryIdsForSession(env, session);
      if (!isAll && !allowedIds.includes(company.country_id)) {
        return jsonResponse({ error: 'Bu firmanın raporunu görüntüleme yetkiniz bulunmamaktadır.' }, 403, corsHeaders);
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
        country_id, name, group_name, category, city, priority,
        phone, email, email_alt, address, project_officer,
        owner_group, ceo, cpo, cfo, strategy_note, project_reference, source_text
      } = body;

      if (!name || !group_name) {
        return jsonResponse({ error: 'Firma Adı ve Grup alanları zorunludur.' }, 400, corsHeaders);
      }

      await env.DB.prepare(`
        UPDATE tender_companies SET
          country_id = COALESCE(?, country_id),
          name = ?, group_name = ?, category = ?, city = ?, priority = ?,
          phone = ?, email = ?, email_alt = ?, address = ?, project_officer = ?,
          owner_group = ?, ceo = ?, cpo = ?, cfo = ?, strategy_note = ?,
          project_reference = ?, source_text = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND deleted_at IS NULL
      `).bind(
        country_id || null,
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
      const { isAll, allowedIds } = await getAllowedCountryIdsForSession(env, session);
      if (!isAll) {
        const comp: any = await env.DB.prepare('SELECT country_id FROM tender_companies WHERE id = ? AND deleted_at IS NULL').bind(id).first();
        if (!comp || !allowedIds.includes(comp.country_id)) {
          return jsonResponse({ error: 'Bu firmaya not ekleme yetkiniz bulunmamaktadır.' }, 403, corsHeaders);
        }
      }

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

      const { isAll, allowedIds } = await getAllowedCountryIdsForSession(env, session);
      if (!isAll && !allowedIds.includes(company.country_id)) {
        return jsonResponse({ error: 'Bu firmayı senkronize etme yetkiniz bulunmamaktadır.' }, 403, corsHeaders);
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
