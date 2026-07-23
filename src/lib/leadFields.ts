import type { Lead } from './types';

export function getLeadField(lead: Lead, field: string): string {
  const val = lead[field];
  if (val === undefined || val === null) return '';
  return String(val);
}

export function getLeadEmail(lead: Lead): string {
  return getLeadField(lead, 'email');
}

export function getLeadName(lead: Lead): string {
  return getLeadField(lead, 'name') || getLeadEmail(lead) || 'Unknown';
}

export function getCategories(lead: Lead): string[] {
  const raw = lead.categories || lead.category;
  if (!raw) return [];
  return String(raw)
    .split(/[|,]/)
    .map(c => c.trim())
    .filter(Boolean);
}

export function getSocialLinks(lead: Lead): { network: string; url: string }[] {
  const links: { network: string; url: string }[] = [];
  const add = (network: string, url?: string) => {
    if (url && url.trim()) links.push({ network, url: url.trim() });
  };

  add('facebook', lead.facebook);
  add('instagram', lead.instagram);
  add('linkedin', lead.linkedin);

  if (lead.socials && typeof lead.socials === 'object' && !Array.isArray(lead.socials)) {
    const s = lead.socials as Record<string, string>;
    for (const [k, v] of Object.entries(s)) {
      if (k !== 'facebook' && k !== 'instagram' && k !== 'linkedin') {
        add(k, v);
      }
    }
  } else if (typeof lead.socials === 'string') {
    const parts = lead.socials.split(/[|,]/).map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
      if (part.includes('facebook')) add('facebook', part);
      else if (part.includes('instagram')) add('instagram', part);
      else if (part.includes('linkedin')) add('linkedin', part);
      else add('link', part);
    }
  }

  return links;
}

export function getWebsiteUrl(lead: Lead): string {
  const url = getLeadField(lead, 'website');
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return 'https://' + url;
}

export function getMapsUrl(lead: Lead): string {
  const maps = getLeadField(lead, 'maps');
  if (maps) return maps;
  const addr = getLeadField(lead, 'address');
  if (addr) return `https://maps.google.com/?q=${encodeURIComponent(addr)}`;
  return '';
}
