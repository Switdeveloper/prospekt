import type { ParseError } from '../lib/types';
import { AlertTriangle, Copy } from 'lucide-react';
import { useState } from 'react';

export default function ErrorPanel({ error }: { error: ParseError }) {
  const [copied, setCopied] = useState(false);

  const copyRaw = () => {
    if (error.raw) {
      navigator.clipboard.writeText(error.raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 gap-4">
      <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-error" />
      </div>
      <p className="text-text font-medium text-sm">{error.message}</p>
      {error.hint && (
        <p className="text-text-muted text-xs font-mono max-w-md text-center">{error.hint}</p>
      )}
      {error.raw && (
        <div className="w-full max-w-lg mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-text-dim text-xs font-mono uppercase tracking-wider">Raw response</span>
            <button
              onClick={copyRaw}
              className="text-text-dim hover:text-primary text-xs flex items-center gap-1 transition-colors"
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="bg-input border border-border rounded-lg p-3 text-xs font-mono text-text-muted overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-all">
            {error.raw}
          </pre>
        </div>
      )}
    </div>
  );
}
