import type { HistoryBatch } from './types';

const STORAGE_KEY = 'prospekt.history';
const MAX_BATCHES = 25;

export function loadHistory(): HistoryBatch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryBatch[];
  } catch {
    return [];
  }
}

export function saveHistory(batches: HistoryBatch[]): void {
  const sorted = batches
    .sort((a, b) => b.ts - a.ts)
    .slice(0, MAX_BATCHES);

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
      return;
    } catch {
      if (sorted.length > 0) {
        sorted.pop();
      } else {
        return;
      }
    }
  }
}

export function addBatch(batch: HistoryBatch): HistoryBatch[] {
  const history = loadHistory();
  history.unshift(batch);
  return history.slice(0, MAX_BATCHES);
}

export function deleteBatch(id: string): HistoryBatch[] {
  return loadHistory().filter(b => b.id !== id);
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
