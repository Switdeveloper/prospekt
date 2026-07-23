import { useState, useEffect, useRef } from 'react';
import { X, Braces } from 'lucide-react';
import type { MessageTemplate } from '../lib/types';

type Props = {
  template: MessageTemplate;
  onSave: (template: MessageTemplate) => void;
  onClose: () => void;
};

const TOKENS = ['{{name}}', '{{email}}', '{{phone}}', '{{address}}', '{{website}}', '{{category}}', '{{categories}}', '{{city}}', '{{country}}'];

export default function MessageModal({ template, onSave, onClose }: Props) {
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSave = () => {
    onSave({ subject, body });
    onClose();
  };

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  const insertToken = (token: string, target: 'subject' | 'body') => {
    if (target === 'subject') {
      setSubject(prev => prev + token);
    } else {
      setBody(prev => prev + token);
    }
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-panel border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text">Message Template</h2>
          <button onClick={onClose} className="p-1 text-text-dim hover:text-text transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">Body</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={6}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-primary/50 transition-colors resize-none font-mono"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Braces className="w-3 h-3 text-text-dim" />
              <span className="text-[10px] font-mono text-text-dim uppercase tracking-wider">Tokens</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TOKENS.map(t => (
                <button
                  key={t}
                  onClick={() => insertToken(t, 'body')}
                  className="px-2 py-0.5 bg-input border border-border rounded-full text-[10px] font-mono text-text-muted hover:text-primary hover:border-primary/30 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border bg-base/50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-text-muted hover:text-text border border-border rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-medium text-base bg-primary hover:bg-primary/90 rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
