import type { Lead } from './types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELD_ALIASES: Record<string, string> = {
  name: 'name',
  business_name: 'name',
  'business name': 'name',
  company: 'name',
  title: 'name',
  full_name: 'name',
  'full name': 'name',
  email: 'email',
  phone: 'phone',
  phone_number: 'phone',
  'phone number': 'phone',
  telephone: 'phone',
  mobile: 'phone',
  website: 'website',
  website_url: 'website',
  'website url': 'website',
  url: 'website',
  address: 'address',
  full_address: 'address',
  'full address': 'address',
  location: 'address',
  category: 'category',
  categories: 'categories',
  types: 'categories',
  rating: 'rating',
  stars: 'rating',
  reviews: 'reviews',
  review_count: 'reviews',
  reviews_count: 'reviews',
  city: 'city',
  country: 'country',
  facebook: 'facebook',
  facebook_url: 'facebook',
  instagram: 'instagram',
  instagram_url: 'instagram',
  linkedin: 'linkedin',
  linkedin_url: 'linkedin',
  maps: 'maps',
  maps_url: 'maps',
  socials: 'socials',
};

function normalizeKey(key: string): string {
  return FIELD_ALIASES[key.toLowerCase().trim()] || key.toLowerCase().trim();
}

function isEmail(s: string): boolean {
  return EMAIL_REGEX.test(s);
}

function parseCSVRow(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

function detectDelimiter(firstLine: string): string {
  const counts = [
    (firstLine.match(/,/g) || []).length,
    (firstLine.match(/;/g) || []).length,
    (firstLine.match(/\t/g) || []).length,
  ];
  const max = Math.max(...counts);
  if (max === 0) return ',';
  if (counts[0] === max) return ',';
  if (counts[1] === max) return ';';
  return '\t';
}

function parseCSV(content: string): Lead[] {
  const lines = content.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return [];

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCSVRow(lines[0], delimiter).map(normalizeKey);

  const leads: Lead[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVRow(lines[i], delimiter);
    const lead: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      if (values[idx] !== undefined) {
        lead[h] = values[idx].trim();
      }
    });
    const normalized: Lead = {};
    for (const [k, v] of Object.entries(lead)) {
      const nk = normalizeKey(k);
      if (nk && v) (normalized as Record<string, unknown>)[nk] = v;
    }
    if (normalized.email || normalized.name || normalized.phone) {
      leads.push(normalized);
    }
  }
  return leads;
}

function parseEmailPerLine(content: string): Lead[] {
  const lines = content.trim().split(/\r?\n/).filter(l => l.trim());
  const leads: Lead[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (isEmail(trimmed)) {
      const localPart = trimmed.split('@')[0];
      const displayName = localPart
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      leads.push({ email: trimmed, name: displayName });
    }
  }
  return leads;
}

function parseJSONLeads(content: string): Lead[] {
  const parsed = JSON.parse(content);

  function extract(data: unknown): Lead[] {
    if (Array.isArray(data)) {
      return data.flatMap(item => extract(item));
    }
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      if (obj.leads && Array.isArray(obj.leads)) {
        return obj.leads.flatMap(item => extract(item));
      }
      if (obj.json && typeof obj.json === 'object') {
        return extract(obj.json);
      }
      const lead: Lead = {};
      for (const [k, v] of Object.entries(obj)) {
        const nk = normalizeKey(k);
        if (nk && v !== null && v !== undefined) {
          (lead as Record<string, unknown>)[nk] = v;
        }
      }
      if (lead.email || lead.name || lead.phone) {
        return [lead];
      }
    }
    return [];
  }

  return extract(parsed);
}

function detectFormat(filename: string): 'csv' | 'json' | 'text' {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.csv') || lower.endsWith('.tsv')) return 'csv';
  return 'text';
}

export function importFromFile(
  content: string,
  filename: string
): { leads: Lead[]; error?: string } {
  try {
    const format = detectFormat(filename);

    if (format === 'json') {
      const leads = parseJSONLeads(content);
      if (leads.length === 0) return { leads: [], error: 'No recognized leads found in the JSON file.' };
      return { leads };
    }

    if (format === 'csv') {
      const leads = parseCSV(content);
      if (leads.length === 0) {
        const emailLeads = parseEmailPerLine(content);
        if (emailLeads.length > 0) return { leads: emailLeads };
        return { leads: [], error: 'No recognized leads found in the CSV file.' };
      }
      return { leads };
    }

    const emailLeads = parseEmailPerLine(content);
    if (emailLeads.length > 0) return { leads: emailLeads };
    const csvLeads = parseCSV(content);
    if (csvLeads.length > 0) return { leads: csvLeads };
    return { leads: [], error: 'No recognized leads found. Expected emails, CSV, or JSON data.' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Parse error';
    return { leads: [], error: `Failed to parse file: ${msg}` };
  }
}

export function importFromText(text: string): { leads: Lead[]; error?: string } {
  return importFromFile(text, 'pasted.txt');
}
