import { useRef, useState, useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';
import { importFromFile, importFromText } from '../lib/importLeads';
import type { Lead } from '../lib/types';

type Props = {
  onImport: (leads: Lead[], source: string) => void;
  loading: boolean;
};

const ACCEPTED = '.csv,.tsv,.txt,.json';

export default function ImportLeads({ onImport, loading }: Props) {
  const [dragging, setDragging] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const processContent = useCallback((content: string, filename: string) => {
    setError('');
    const result = filename === 'pasted text'
      ? importFromText(content)
      : importFromFile(content, filename);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.leads.length === 0) {
      setError('No recognized leads found.');
      return;
    }
    onImport(result.leads, filename === 'pasted text' ? 'pasted text' : filename);
    setPasteText('');
  }, [onImport]);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        processContent(reader.result, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handlePaste = () => {
    if (pasteText.trim()) {
      processContent(pasteText, 'pasted text');
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-border-light'
        }`}
      >
        <Upload className="w-5 h-5 mx-auto mb-2 text-text-dim" />
        <p className="text-xs text-text-muted">Drop file or click to import</p>
        <p className="text-[10px] text-text-dim font-mono mt-1">CSV, TSV, TXT, JSON</p>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        className="hidden"
      />
      <div>
        <textarea
          value={pasteText}
          onChange={e => { setPasteText(e.target.value); setError(''); }}
          placeholder="Paste CSV or one email per line..."
          rows={3}
          disabled={loading}
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs font-mono text-text placeholder:text-text-dim focus:outline-none focus:border-primary/50 transition-colors resize-none disabled:opacity-50"
        />
        <button
          onClick={handlePaste}
          disabled={loading || !pasteText.trim()}
          className="mt-2 w-full bg-panel border border-border rounded-lg px-3 py-1.5 text-xs text-text-muted hover:text-text hover:border-border-light transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <FileText className="w-3 h-3" />
          Import Pasted
        </button>
      </div>
      {error && <p className="text-error text-xs font-mono">{error}</p>}
    </div>
  );
}
