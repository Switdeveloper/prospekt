import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, Zap, Upload, History, Send, ChevronRight } from 'lucide-react';

import Header from './components/Header';
import SettingsModal from './components/SettingsModal';
import MessageModal from './components/MessageModal';
import GeneratorForm from './components/GeneratorForm';
import ImportLeads from './components/ImportLeads';
import HistoryPanel from './components/HistoryPanel';
import LeadsGrid from './components/LeadsGrid';
import RadarLoader from './components/RadarLoader';
import ErrorPanel from './components/ErrorPanel';

import type { Lead, Settings, MessageTemplate, HistoryBatch, SendState, ParseError } from './lib/types';
import { loadSettings, saveSettings, resetSettings } from './lib/settings';
import { callWebhook } from './lib/proxy';
import { parseWebhookResponse, parseProxyError } from './lib/parseLeads';
import { loadHistory, saveHistory, addBatch, deleteBatch } from './lib/history';
import { loadTemplate, saveTemplate, renderTemplate } from './lib/messageTemplate';
import { getLeadEmail } from './lib/leadFields';

type Tab = 'generator' | 'auto' | 'import' | 'history';

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [template, setTemplate] = useState<MessageTemplate>(loadTemplate);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sendStates, setSendStates] = useState<Record<string, SendState>>({});
  const [history, setHistory] = useState<HistoryBatch[]>(loadHistory);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [batchTitle, setBatchTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ParseError | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [tab, setTab] = useState<Tab>('generator');
  const [showSettings, setShowSettings] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [batchSending, setBatchSending] = useState(false);
  const [batchProgress, setBatchProgress] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Restore active batch on startup
  useEffect(() => {
    const activeId = localStorage.getItem('prospekt.activeBatchId');
    if (activeId) {
      const batch = history.find(b => b.id === activeId);
      if (batch) {
        setLeads(batch.leads);
        setActiveBatchId(batch.id);
        setBatchTitle(batch.label);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const persistActiveBatch = useCallback((id: string, batchLeads: Lead[], label: string) => {
    localStorage.setItem('prospekt.activeBatchId', id);
    setLeads(batchLeads);
    setActiveBatchId(id);
    setBatchTitle(label);
  }, []);

  const handleGenerate = async (category: string, city: string, country: string, maxResults: number) => {
    setLoading(true);
    setError(null);
    setLeads([]);
    setActiveBatchId(null);
    setBatchTitle('');
    startTimer();

    try {
      const res = await callWebhook(settings.generatorUrl, {
        category,
        city,
        country,
        max_results: maxResults,
      }, settings.passcode);

      const body = await res.text();
      stopTimer();

      if (!res.ok) {
        const pe = parseProxyError(body);
        setError(pe);
        return;
      }

      const result = parseWebhookResponse(res.status, body);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      const batchId = crypto.randomUUID();
      const label = `${category} · ${city || 'Any city'}, ${country}`;
      const batch: HistoryBatch = { id: batchId, query: category, label, ts: Date.now(), leads: result.leads };
      const newHistory = addBatch(batch);
      saveHistory(newHistory);
      setHistory(newHistory);
      persistActiveBatch(batchId, result.leads, label);
    } catch (err) {
      stopTimer();
      setError({
        code: 'proxy_error',
        message: err instanceof Error ? err.message : 'Unknown error',
        hint: 'Check your network connection and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoScrape = async () => {
    setLoading(true);
    setError(null);
    setLeads([]);
    setActiveBatchId(null);
    setBatchTitle('');
    startTimer();

    try {
      const res = await callWebhook(settings.autoUrl, { trigger: 'auto' }, settings.passcode);
      const body = await res.text();
      stopTimer();

      if (!res.ok) {
        setError(parseProxyError(body));
        return;
      }

      const result = parseWebhookResponse(res.status, body);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      const batchId = crypto.randomUUID();
      const label = 'Auto Scrape · automatic';
      const batch: HistoryBatch = { id: batchId, query: 'auto', label, ts: Date.now(), leads: result.leads };
      const newHistory = addBatch(batch);
      saveHistory(newHistory);
      setHistory(newHistory);
      persistActiveBatch(batchId, result.leads, label);
    } catch (err) {
      stopTimer();
      setError({
        code: 'proxy_error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (importedLeads: Lead[], source: string) => {
    const batchId = crypto.randomUUID();
    const label = `Import · ${source}`;
    const batch: HistoryBatch = { id: batchId, query: 'import', label, ts: Date.now(), leads: importedLeads };
    const newHistory = addBatch(batch);
    saveHistory(newHistory);
    setHistory(newHistory);
    persistActiveBatch(batchId, importedLeads, label);
  };

  const handleRestoreBatch = (batch: HistoryBatch) => {
    persistActiveBatch(batch.id, batch.leads, batch.label);
    setTab('generator');
  };

  const handleDeleteBatch = (id: string) => {
    const newHistory = deleteBatch(id);
    saveHistory(newHistory);
    setHistory(newHistory);
    if (activeBatchId === id) {
      setLeads([]);
      setActiveBatchId(null);
      setBatchTitle('');
      localStorage.removeItem('prospekt.activeBatchId');
    }
  };

  const handleSendLead = async (lead: Lead) => {
    const key = lead.email || lead.name || '';
    if (!key) return;

    setSendStates(p => ({ ...p, [key]: 'loading' }));

    try {
      const subject = renderTemplate(template.subject, lead);
      const body = renderTemplate(template.body, lead);

      const res = await callWebhook(settings.mailUrl, {
        lead,
        action: 'send',
        subject,
        body,
        message: body,
        email_subject: subject,
        email_body: body,
      }, settings.passcode);

      const text = await res.text();
      const confirmed = isSendConfirmed(res.status, text);

      setSendStates(p => ({ ...p, [key]: confirmed ? 'Sent' : 'Resend' }));
    } catch {
      setSendStates(p => ({ ...p, [key]: 'Resend' }));
    }
  };

  const handleBatchSend = async () => {
    const eligible = leads.filter(l => getLeadEmail(l));
    if (eligible.length === 0) return;

    setBatchSending(true);
    setSendStates({});

    for (let i = 0; i < eligible.length; i++) {
      setBatchProgress(`Sending ${i + 1} of ${eligible.length}…`);
      await handleSendLead(eligible[i]);
    }

    setBatchProgress('');
    setBatchSending(false);
  };

  const handleResendFailed = async () => {
    const failed = leads.filter(l => {
      const key = l.email || l.name || '';
      return getLeadEmail(l) && sendStates[key] === 'Resend';
    });
    if (failed.length === 0) return;

    setBatchSending(true);
    for (let i = 0; i < failed.length; i++) {
      setBatchProgress(`Resending ${i + 1} of ${failed.length}…`);
      await handleSendLead(failed[i]);
    }
    setBatchProgress('');
    setBatchSending(false);
  };

  const failedCount = leads.filter(l => {
    const key = l.email || l.name || '';
    return sendStates[key] === 'Resend';
  }).length;

  const allSent = leads.length > 0 && leads.every(l => {
    const key = l.email || l.name || '';
    return !getLeadEmail(l) || sendStates[key] === 'Sent';
  });

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <Header
        hasPasscode={!!settings.passcode.trim()}
        loading={loading || batchSending}
        onSettings={() => setShowSettings(true)}
        onMessage={() => setShowMessage(true)}
      />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-panel/50`}>
          <div className="p-4 space-y-1">
            <SidebarButton
              icon={<Radar className="w-4 h-4" />}
              label="Lead Generator"
              active={tab === 'generator'}
              onClick={() => setTab('generator')}
              disabled={loading || batchSending}
            />
            <SidebarButton
              icon={<Zap className="w-4 h-4" />}
              label="Auto Scrape"
              active={tab === 'auto'}
              onClick={() => setTab('auto')}
              disabled={loading || batchSending}
              variant="amber"
            />
            <SidebarButton
              icon={<Upload className="w-4 h-4" />}
              label="Lead Import"
              active={tab === 'import'}
              onClick={() => setTab('import')}
              disabled={loading || batchSending}
            />
            <div className="border-t border-border my-2" />
            <SidebarButton
              icon={<History className="w-4 h-4" />}
              label="History"
              active={tab === 'history'}
              onClick={() => setTab('history')}
              disabled={loading || batchSending}
            />
          </div>
        </aside>

        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed bottom-4 left-4 z-30 p-3 bg-primary rounded-full text-base shadow-lg"
        >
          <ChevronRight className={`w-5 h-5 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 lg:p-6">
          {/* Sidebar panels */}
          {tab === 'generator' && !loading && (
            <div className="max-w-md mb-6">
              <GeneratorForm onSubmit={handleGenerate} loading={loading} />
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] font-mono text-text-dim uppercase">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <button
                onClick={handleAutoScrape}
                disabled={loading || batchSending}
                className="w-full bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 text-secondary font-medium text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Auto Scrape
              </button>
            </div>
          )}

          {tab === 'auto' && !loading && (
            <div className="max-w-md mb-6">
              <p className="text-xs text-text-muted font-mono mb-3">Click below to start auto discovery.</p>
              <button
                onClick={handleAutoScrape}
                disabled={loading || batchSending}
                className="w-full bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 text-secondary font-medium text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Auto Scrape
              </button>
            </div>
          )}

          {tab === 'import' && !loading && (
            <div className="max-w-md mb-6">
              <ImportLeads onImport={handleImport} loading={loading || batchSending} />
            </div>
          )}

          {tab === 'history' && !loading && (
            <div className="max-w-md mb-6">
              <HistoryPanel
                history={history}
                activeId={activeBatchId}
                onRestore={handleRestoreBatch}
                onDelete={handleDeleteBatch}
                disabled={loading || batchSending}
              />
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <RadarLoader elapsed={elapsed} />
          )}

          {/* Error state */}
          {error && !loading && (
            <ErrorPanel error={error} />
          )}

          {/* Empty state */}
          {!loading && !error && leads.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="relative w-16 h-16 mb-4">
                <svg viewBox="0 0 64 64" className="w-full h-full">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#57e6a4" strokeWidth="1" opacity="0.15" />
                  <circle cx="32" cy="32" r="20" fill="none" stroke="#57e6a4" strokeWidth="1" opacity="0.25" />
                  <circle cx="32" cy="32" r="12" fill="none" stroke="#57e6a4" strokeWidth="1" opacity="0.4" />
                  <circle cx="32" cy="32" r="3" fill="#57e6a4" />
                </svg>
              </div>
              <p className="text-xs font-mono text-text-dim uppercase tracking-widest mb-2">Prospect Intelligence</p>
              <h2 className="text-lg font-semibold text-text mb-1">Turn your market into a conversation</h2>
              <p className="text-xs text-text-muted max-w-sm mb-4">
                Generate leads, discover prospects automatically, or import your own data.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-2.5 py-1 bg-panel border border-border rounded-full text-[10px] font-mono text-text-dim">No browser-to-webhook calls</span>
                <span className="px-2.5 py-1 bg-panel border border-border rounded-full text-[10px] font-mono text-text-dim">Live workflow status</span>
              </div>
            </motion.div>
          )}

          {/* Batch info bar */}
          {!loading && leads.length > 0 && (
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-text truncate max-w-xs">{batchTitle}</h2>
                <span className="text-xs font-mono text-text-dim">{leads.length} leads</span>
              </div>
              <div className="flex items-center gap-2">
                {batchProgress && (
                  <span className="text-xs font-mono text-primary">{batchProgress}</span>
                )}
                {failedCount > 0 && !batchSending && (
                  <button
                    onClick={handleResendFailed}
                    className="px-3 py-1 text-xs font-medium text-secondary bg-secondary/10 border border-secondary/20 rounded-lg hover:bg-secondary/20 transition-colors"
                  >
                    Resend failed ({failedCount})
                  </button>
                )}
                {!allSent && (
                  <button
                    onClick={handleBatchSend}
                    disabled={batchSending}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-base bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3 h-3" />
                    {batchSending ? batchProgress || 'Sending…' : 'Send batch'}
                  </button>
                )}
                {allSent && (
                  <span className="text-xs font-mono text-primary">All sent</span>
                )}
              </div>
            </div>
          )}

          {/* Leads grid */}
          {!loading && (
            <LeadsGrid
              leads={leads}
              sendStates={sendStates}
              onSend={handleSendLead}
              disabled={loading || batchSending}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showSettings && (
          <SettingsModal
            settings={settings}
            onSave={(s) => { setSettings(s); saveSettings(s); }}
            onReset={() => { const s = resetSettings(); setSettings(s); }}
            onClose={() => setShowSettings(false)}
          />
        )}
        {showMessage && (
          <MessageModal
            template={template}
            onSave={(t) => { setTemplate(t); saveTemplate(t); }}
            onClose={() => setShowMessage(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarButton({
  icon,
  label,
  active,
  onClick,
  disabled,
  variant = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'amber';
}) {
  const colors = variant === 'amber'
    ? 'text-secondary'
    : 'text-text-muted';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        active
          ? 'bg-primary/10 text-primary border border-primary/20'
          : `hover:bg-panel border border-transparent ${colors} hover:text-text`
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function isSendConfirmed(status: number, body: string): boolean {
  if (status < 200 || status >= 300) return false;
  const lower = body.toLowerCase();
  if (lower.includes('not sent') || lower.includes('unsent') || lower.includes('failed') || lower.includes('error')) {
    return false;
  }
  if (lower.includes('sent') || lower.includes('"sent":true') || lower.includes('"sent": true')) {
    return true;
  }
  try {
    const parsed = JSON.parse(body);
    if (typeof parsed === 'boolean') return parsed;
    if (parsed && typeof parsed === 'object') {
      if (parsed.sent === true || parsed.status === 'sent') return true;
      if (parsed.data && (parsed.data.status === 'sent' || parsed.data.sent === true)) return true;
      if (Array.isArray(parsed)) {
        return parsed.some(item => {
          if (item?.json?.message === 'sent' || item?.json?.status === 'sent') return true;
          if (item?.sent === true) return true;
          return false;
        });
      }
    }
  } catch { /* not json */ }
  return false;
}
