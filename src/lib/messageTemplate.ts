import type { MessageTemplate, Lead } from './types';

const STORAGE_KEY = 'prospekt.messageTemplate';

const DEFAULT_TEMPLATE: MessageTemplate = {
  subject: 'A quick idea for {{name}}',
  body: `Hi {{name}},\n\nI came across {{name}} and wanted to reach out with an idea that could help you connect with more customers. Would you be open to a quick conversation?\n\nBest,`,
};

export function loadTemplate(): MessageTemplate {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_TEMPLATE };
    return JSON.parse(raw) as MessageTemplate;
  } catch {
    return { ...DEFAULT_TEMPLATE };
  }
}

export function saveTemplate(template: MessageTemplate): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(template));
  } catch { /* quota exceeded */ }
}

export function renderTemplate(template: string, lead: Lead): string {
  const tokens: Record<string, string> = {
    name: String(lead.name || ''),
    email: String(lead.email || ''),
    phone: String(lead.phone || ''),
    address: String(lead.address || ''),
    website: String(lead.website || ''),
    category: String(lead.category || ''),
    categories: String(lead.categories || ''),
    city: String(lead.city || ''),
    country: String(lead.country || ''),
  };

  let result = template;
  for (const [key, value] of Object.entries(tokens)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}
