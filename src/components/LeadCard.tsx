import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, Phone, Globe, MapPin, Star, ExternalLink,
  Link2, Send
} from 'lucide-react';
import type { Lead, SendState } from '../lib/types';
import { getLeadName, getLeadEmail, getCategories, getWebsiteUrl, getMapsUrl, getSocialLinks } from '../lib/leadFields';

type Props = {
  lead: Lead;
  index: number;
  sendState: SendState;
  onSend: (lead: Lead) => void;
  disabled: boolean;
};

export default function LeadCard({ lead, index, sendState, onSend, disabled }: Props) {
  const [expanded, setExpanded] = useState(false);
  const name = getLeadName(lead);
  const email = getLeadEmail(lead);
  const categories = getCategories(lead);
  const website = getWebsiteUrl(lead);
  const maps = getMapsUrl(lead);
  const socials = getSocialLinks(lead);

  const btnLabel = sendState === 'loading' ? 'Sending…' : sendState === 'Sent' ? 'Sent' : sendState === 'Resend' ? 'Resend' : 'Send';
  const btnDisabled = disabled || sendState === 'loading' || sendState === 'Sent' || !email;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.6) }}
      className="bg-panel border border-border rounded-xl p-4 space-y-3 hover:border-border-light transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-text truncate">{name}</h3>
          {lead.rating !== undefined && (
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3 h-3 text-secondary fill-secondary" />
              <span className="text-xs font-mono text-text-muted">{String(lead.rating)}</span>
              {lead.reviews !== undefined && (
                <span className="text-[10px] font-mono text-text-dim">({String(lead.reviews)})</span>
              )}
            </div>
          )}
        </div>
        {email && (
          <button
            onClick={() => onSend(lead)}
            disabled={btnDisabled}
            title={btnDisabled && !email ? 'No email address' : btnLabel}
            className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              sendState === 'Sent'
                ? 'bg-primary/10 text-primary border border-primary/20'
                : sendState === 'Resend'
                  ? 'bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20'
                  : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Send className="w-3 h-3" />
            {btnLabel}
          </button>
        )}
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {categories.map((c, i) => (
            <span key={i} className="px-2 py-0.5 bg-input border border-border rounded-full text-[10px] font-mono text-text-muted">
              {c}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        {lead.address && (
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <MapPin className="w-3 h-3 shrink-0 text-text-dim" />
            <span className="truncate">{String(lead.address)}</span>
          </div>
        )}
        {lead.phone && (
          <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors">
            <Phone className="w-3 h-3 shrink-0 text-text-dim" />
            <span>{String(lead.phone)}</span>
          </a>
        )}
        {email && (
          <a href={`mailto:${email}`} className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors">
            <Mail className="w-3 h-3 shrink-0 text-text-dim" />
            <span className="truncate">{email}</span>
          </a>
        )}
        {website && (
          <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors">
            <Globe className="w-3 h-3 shrink-0 text-text-dim" />
            <span className="truncate">{website}</span>
            <ExternalLink className="w-2.5 h-2.5 shrink-0 text-text-dim" />
          </a>
        )}
        {maps && (
          <a href={maps} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors">
            <MapPin className="w-3 h-3 shrink-0 text-text-dim" />
            <span>View on Maps</span>
            <ExternalLink className="w-2.5 h-2.5 shrink-0 text-text-dim" />
          </a>
        )}
      </div>

      {socials.length > 0 && (
        <div className="flex items-center gap-2 pt-1">
          {socials.map((s, i) => {
            const icon = <Link2 className="w-3.5 h-3.5" />;
            return (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                title={s.network}
                className="p-1.5 rounded-lg bg-input border border-border text-text-dim hover:text-primary hover:border-primary/30 transition-colors"
              >
                {icon}
              </a>
            );
          })}
        </div>
      )}

      {(lead.facebook || lead.instagram || lead.linkedin || (lead.socials && typeof lead.socials === 'object')) && socials.length === 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-text-dim hover:text-text-muted transition-colors"
        >
          {expanded ? 'Hide socials' : 'Show socials'}
        </button>
      )}
    </motion.div>
  );
}
