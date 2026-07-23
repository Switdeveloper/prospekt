import { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, RotateCcw } from 'lucide-react';
import type { Settings } from '../lib/types';
import { getDefaults } from '../lib/settings';

type Props = {
  settings: Settings;
  onSave: (settings: Settings) => void;
  onReset: () => void;
  onClose: () => void;
};

function isValidUrl(s: string): boolean {
  if (!s.trim()) return false;
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function SettingsModal({ settings, onSave, onReset, onClose }: Props) {
  const [gen, setGen] = useState(settings.generatorUrl);
  const [mail, setMail] = useState(settings.mailUrl);
  const [auto, setAuto] = useState(settings.autoUrl);
  const [passcode, setPasscode] = useState(settings.passcode);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!isValidUrl(gen)) errs.gen = 'Must be a valid HTTP(S) URL';
    if (!isValidUrl(mail)) errs.mail = 'Must be a valid HTTP(S) URL';
    if (!isValidUrl(auto)) errs.auto = 'Must be a valid HTTP(S) URL';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      version: 3,
      generatorUrl: gen.trim(),
      mailUrl: mail.trim(),
      autoUrl: auto.trim(),
      passcode: passcode.trim(),
    });
    onClose();
  };

  const handleReset = () => {
    const defaults = getDefaults();
    setGen(defaults.generatorUrl);
    setMail(defaults.mailUrl);
    setAuto(defaults.autoUrl);
    setPasscode('');
    setErrors({});
    onReset();
  };

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
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
          <h2 className="text-sm font-semibold text-text">Settings</h2>
          <button onClick={onClose} className="p-1 text-text-dim hover:text-text transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">Generator Webhook</label>
            <input
              type="url"
              value={gen}
              onChange={e => { setGen(e.target.value); setErrors(p => ({ ...p, gen: '' })); }}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs font-mono text-text placeholder:text-text-dim focus:outline-none focus:border-primary/50 transition-colors"
            />
            {errors.gen && <p className="text-error text-xs mt-1 font-mono">{errors.gen}</p>}
          </div>
          <div>
            <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">Send Mail Webhook</label>
            <input
              type="url"
              value={mail}
              onChange={e => { setMail(e.target.value); setErrors(p => ({ ...p, mail: '' })); }}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs font-mono text-text placeholder:text-text-dim focus:outline-none focus:border-primary/50 transition-colors"
            />
            {errors.mail && <p className="text-error text-xs mt-1 font-mono">{errors.mail}</p>}
          </div>
          <div>
            <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">Auto Scraper Webhook</label>
            <input
              type="url"
              value={auto}
              onChange={e => { setAuto(e.target.value); setErrors(p => ({ ...p, auto: '' })); }}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs font-mono text-text placeholder:text-text-dim focus:outline-none focus:border-primary/50 transition-colors"
            />
            {errors.auto && <p className="text-error text-xs mt-1 font-mono">{errors.auto}</p>}
          </div>
          <div>
            <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">
              Passcode
              {passcode.trim() && (
                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-[10px]">Active</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                placeholder="Optional"
                className="w-full bg-input border border-border rounded-lg px-3 py-2 pr-9 text-xs font-mono text-text placeholder:text-text-dim focus:outline-none focus:border-primary/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-dim hover:text-text transition-colors"
              >
                {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-text-dim font-mono mt-1">Empty passcode is omitted from webhook requests.</p>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-base/50">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-text-dim hover:text-text transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <div className="flex items-center gap-2">
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
    </div>
  );
}
