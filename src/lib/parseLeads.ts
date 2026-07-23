import type { Lead, ParseError } from './types';

const KNOWN_FIELDS = [
  'name', 'email', 'phone', 'website', 'address', 'category', 'categories',
  'rating', 'reviews', 'facebook', 'instagram', 'linkedin', 'maps', 'socials',
  'business_name', 'business name', 'company', 'title', 'full_name', 'full name',
  'phone_number', 'phone number', 'telephone', 'mobile',
  'website_url', 'website url', 'url',
  'full_address', 'full address', 'location',
  'categories', 'types', 'stars', 'review_count', 'reviews_count',
  'facebook_url', 'instagram_url', 'linkedin_url', 'maps_url',
  'city', 'country',
];

const FIELD_ALIASES: Record<string, string> = {
  business_name: 'name',
  'business name': 'name',
  company: 'name',
  title: 'name',
  full_name: 'name',
  'full name': 'name',
  phone_number: 'phone',
  'phone number': 'phone',
  telephone: 'phone',
  mobile: 'phone',
  website_url: 'website',
  'website url': 'website',
  url: 'website',
  full_address: 'address',
  'full address': 'address',
  location: 'address',
  types: 'categories',
  stars: 'rating',
  review_count: 'reviews',
  reviews_count: 'reviews',
  facebook_url: 'facebook',
  instagram_url: 'instagram',
  linkedin_url: 'linkedin',
  maps_url: 'maps',
};

function normalizeLead(raw: Record<string, unknown>): Lead {
  const lead: Lead = {};
  for (const [key, val] of Object.entries(raw)) {
    const lower = key.toLowerCase().trim();
    const target = FIELD_ALIASES[lower] || lower;
    if (KNOWN_FIELDS.includes(target) || KNOWN_FIELDS.includes(lower)) {
      (lead as Record<string, unknown>)[target] = val;
    } else {
      (lead as Record<string, unknown>)[lower] = val;
    }
  }
  return lead;
}

function hasRecognizedField(lead: Lead): boolean {
  return KNOWN_FIELDS.some(f => lead[f as keyof Lead] !== undefined && lead[f as keyof Lead] !== '');
}

function extractLeads(data: unknown, depth = 0): Lead[] {
  if (depth > 5) return [];
  if (Array.isArray(data)) {
    const leads: Lead[] = [];
    for (const item of data) {
      leads.push(...extractLeads(item, depth + 1));
    }
    return leads;
  }
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (obj.json && typeof obj.json === 'object') {
      return extractLeads(obj.json, depth + 1);
    }
    for (const key of ['data', 'leads', 'items']) {
      if (obj[key]) {
        return extractLeads(obj[key], depth + 1);
      }
    }
    const normalized = normalizeLead(obj);
    if (hasRecognizedField(normalized)) {
      return [normalized];
    }
  }
  return [];
}

export type ParseResult =
  | { ok: true; leads: Lead[] }
  | { ok: false; error: ParseError };

export function parseWebhookResponse(
  status: number,
  body: string
): ParseResult {
  if (!body || !body.trim()) {
    return { ok: false, error: { code: 'empty', message: 'The response body is empty.' } };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return {
      ok: false,
      error: {
        code: 'non_json',
        message: 'The workflow returned a non-JSON response.',
        hint: 'Switch the n8n response to JSON.',
        raw: body,
      },
    };
  }

  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (obj.error || obj.errorMessage) {
      const msg = typeof obj.error === 'string' ? obj.error : typeof obj.errorMessage === 'string' ? obj.errorMessage : 'n8n error';
      if (status === 404) {
        return { ok: false, error: { code: 'n8n_error', message: 'Webhook not found (404).', hint: 'Activate the n8n workflow, then try again.' } };
      }
      return { ok: false, error: { code: 'n8n_error', message: msg } };
    }
    const msg = JSON.stringify(parsed).toLowerCase();
    if (msg.includes('workflow started') || msg.includes('workflow was started')) {
      return {
        ok: false,
        error: {
          code: 'workflow_started',
          message: 'The workflow started but did not return leads.',
          hint: 'Set the n8n Webhook response mode to "When Last Node Finishes", not "Respond Immediately".',
        },
      };
    }
  }

  const leads = extractLeads(parsed);
  if (leads.length === 0) {
    return {
      ok: false,
      error: {
        code: 'invalid_format',
        message: 'No recognized lead data found in the response.',
        raw: typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2),
      },
    };
  }

  return { ok: true, leads };
}

export function parseProxyError(body: string): ParseError {
  try {
    const obj = JSON.parse(body);
    if (obj.error === 'proxy_connection_error') {
      return {
        code: 'proxy_error',
        message: obj.message || 'Proxy connection error',
        hint: obj.hint || 'Check the webhook URL and confirm the n8n workflow is active.',
      };
    }
  } catch { /* not json */ }
  return { code: 'http_error', message: body || 'Unknown error' };
}
