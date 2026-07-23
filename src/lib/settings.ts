import type { Settings } from './types';

const STORAGE_KEY = 'prospekt.settings';

const DEFAULT_URLS = {
  generatorUrl: 'https://unknownt.app.n8n.cloud/webhook/134ce4a1-31a5-49fb-8647-4bd82fd6ddf6lead',
  mailUrl: 'https://unknownt.app.n8n.cloud/webhook/134ce4a1-31a5-49fb-8647-4bd82fd6ddf6Sendmail',
  autoUrl: 'https://unknownt.app.n8n.cloud/webhook/b205b14c-a7b6-429b-aa8d-523a3117772auto',
};

const OLD_DEFAULT_DOMAINS = ['n8n-swit.zocomputer.io', 'n8n.zocomputer.io'];

function isOldDefault(url: string): boolean {
  return OLD_DEFAULT_DOMAINS.some(d => url.includes(d));
}

const DEFAULT_SETTINGS: Settings = {
  version: 3,
  ...DEFAULT_URLS,
  passcode: '',
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const migrated: Settings = {
      version: 3,
      generatorUrl: parsed.generatorUrl || DEFAULT_URLS.generatorUrl,
      mailUrl: parsed.mailUrl || DEFAULT_URLS.mailUrl,
      autoUrl: parsed.autoUrl || DEFAULT_URLS.autoUrl,
      passcode: parsed.passcode || '',
    };
    if (isOldDefault(migrated.generatorUrl)) migrated.generatorUrl = DEFAULT_URLS.generatorUrl;
    if (isOldDefault(migrated.mailUrl)) migrated.mailUrl = DEFAULT_URLS.mailUrl;
    if (isOldDefault(migrated.autoUrl)) migrated.autoUrl = DEFAULT_URLS.autoUrl;
    saveSettings(migrated);
    return migrated;
  } catch {
    saveSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch { /* quota exceeded — ignore */ }
}

export function resetSettings(): Settings {
  saveSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export function getDefaults() {
  return { ...DEFAULT_URLS };
}
