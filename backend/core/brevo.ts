export interface BrevoContactPayload {
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  country?: string;
  city?: string;
  phone?: string;
  jobTitle?: string;
  pipeSegment?: string;
  listId?: number;
}

export interface BrevoSyncResult {
  success: boolean;
  contactId?: string;
  error?: string;
}

export async function syncContactToBrevo(
  apiKey: string,
  payload: BrevoContactPayload
): Promise<BrevoSyncResult> {
  if (!apiKey) {
    return {
      success: false,
      error: 'BREVO_API_KEY is not configured in Worker secrets.'
    };
  }

  if (!payload.email || !payload.email.includes('@')) {
    return {
      success: false,
      error: 'Geçersiz veya eksik e-posta adresi.'
    };
  }

  const attributes: Record<string, any> = {};
  if (payload.firstName) attributes['FIRSTNAME'] = payload.firstName;
  if (payload.lastName) attributes['LASTNAME'] = payload.lastName;
  if (payload.companyName) attributes['COMPANY'] = payload.companyName;
  if (payload.country) attributes['COUNTRY'] = payload.country;
  if (payload.city) attributes['CITY'] = payload.city;
  if (payload.phone) attributes['PHONE'] = payload.phone;
  if (payload.jobTitle) attributes['JOB_TITLE'] = payload.jobTitle;
  if (payload.pipeSegment) attributes['PIPE_SEGMENT'] = payload.pipeSegment;

  const requestBody: Record<string, any> = {
    email: payload.email.trim().toLowerCase(),
    attributes,
    updateEnabled: true
  };

  if (payload.listId && !isNaN(payload.listId)) {
    requestBody['listIds'] = [payload.listId];
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (res.status === 201 || res.status === 204) {
      const data: any = await res.json().catch(() => ({}));
      return {
        success: true,
        contactId: data?.id ? String(data.id) : undefined
      };
    }

    if (res.status === 200) {
      return { success: true };
    }

    const errData: any = await res.json().catch(() => ({}));
    const message = errData?.message || `Brevo API returned status ${res.status}`;
    return {
      success: false,
      error: message
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Brevo API bağlantı hatası oluştu.'
    };
  }
}
