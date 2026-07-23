import type { HistoryBatch } from '../lib/types';
import { formatRelativeTime } from '../lib/history';
import { Clock, Trash2, RotateCcw } from 'lucide-react';

type Props = {
  history: HistoryBatch[];
  activeId: string | null;
  onRestore: (batch: HistoryBatch) => void;
  onDelete: (id: string) => void;
  disabled: boolean;
};

export default function HistoryPanel({ history, activeId, onRestore, onDelete, disabled }: Props) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-8 h-8 mx-auto text-text-dim mb-2" />
        <p className="text-xs text-text-dim">No history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
      {history.map(batch => (
        <div
          key={batch.id}
          className={`group flex items-start gap-2 p-2 rounded-lg border transition-colors ${
            activeId === batch.id
              ? 'border-primary/30 bg-primary/5'
              : 'border-transparent hover:border-border hover:bg-panel/50'
          }`}
        >
          <button
            onClick={() => onRestore(batch)}
            disabled={disabled}
            className="flex-1 text-left disabled:cursor-not-allowed"
          >
            <p className="text-xs text-text font-medium truncate">{batch.label}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-text-dim">{batch.leads.length} leads</span>
              <span className="text-[10px] font-mono text-text-dim">{formatRelativeTime(batch.ts)}</span>
            </div>
          </button>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onRestore(batch)}
              disabled={disabled}
              title="Restore"
              className="p-1 text-text-dim hover:text-primary transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDelete(batch.id)}
              disabled={disabled}
              title="Delete"
              className="p-1 text-text-dim hover:text-error transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
