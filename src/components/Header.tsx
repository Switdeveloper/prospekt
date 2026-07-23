import { MessageSquare, Settings, Key } from 'lucide-react';

type Props = {
  hasPasscode: boolean;
  loading: boolean;
  onSettings: () => void;
  onMessage: () => void;
};

export default function Header({ hasPasscode, loading, onSettings, onMessage }: Props) {
  return (
    <header className="sticky top-0 z-40 bg-base/90 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8">
            <svg viewBox="0 0 32 32" className="w-full h-full">
              <circle cx="16" cy="16" r="14" fill="none" stroke="#57e6a4" strokeWidth="0.8" opacity="0.2" />
              <circle cx="16" cy="16" r="10" fill="none" stroke="#57e6a4" strokeWidth="0.8" opacity="0.35" />
              <circle cx="16" cy="16" r="6" fill="none" stroke="#57e6a4" strokeWidth="0.8" opacity="0.5" />
              <circle cx="16" cy="16" r="2" fill="#57e6a4" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text leading-none">Prospekt</h1>
            <span className="hidden sm:inline text-[10px] font-mono text-text-dim">Outreach Desk</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onMessage}
            disabled={loading}
            title="Message template"
            className="p-2 rounded-lg text-text-dim hover:text-text hover:bg-panel transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            onClick={onSettings}
            disabled={loading}
            title="Settings"
            className="p-2 rounded-lg text-text-dim hover:text-text hover:bg-panel transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {hasPasscode ? <Key className="w-4 h-4 text-primary" /> : <Settings className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
