import type { Lead, SendState } from '../lib/types';
import LeadCard from './LeadCard';
import { motion } from 'framer-motion';

type Props = {
  leads: Lead[];
  sendStates: Record<string, SendState>;
  onSend: (lead: Lead) => void;
  disabled: boolean;
};

export default function LeadsGrid({ leads, sendStates, onSend, disabled }: Props) {
  if (leads.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
    >
      {leads.map((lead, i) => (
        <LeadCard
          key={lead.id || lead.email || i}
          lead={lead}
          index={i}
          sendState={sendStates[lead.email || lead.name || String(i)] || 'idle'}
          onSend={onSend}
          disabled={disabled}
        />
      ))}
    </motion.div>
  );
}
