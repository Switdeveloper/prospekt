import { motion } from 'framer-motion';

export default function RadarLoader({ elapsed }: { elapsed: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 128 128" className="w-full h-full">
          <circle cx="64" cy="64" r="56" fill="none" stroke="#57e6a4" strokeWidth="1" opacity="0.15" />
          <circle cx="64" cy="64" r="42" fill="none" stroke="#57e6a4" strokeWidth="1" opacity="0.25" />
          <circle cx="64" cy="64" r="28" fill="none" stroke="#57e6a4" strokeWidth="1" opacity="0.35" />
          <circle cx="64" cy="64" r="14" fill="none" stroke="#57e6a4" strokeWidth="1" opacity="0.5" />
          <circle cx="64" cy="64" r="3" fill="#57e6a4" />
          <motion.path
            d="M64 64 L64 8 A56 56 0 0 1 108 30 Z"
            fill="#57e6a4"
            opacity="0.2"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '64px 64px' }}
          />
        </svg>
      </div>
      <div className="text-center space-y-2">
        <p className="text-primary font-medium text-sm tracking-wide uppercase">Scanning for prospects</p>
        <p className="text-text-muted font-mono text-xs">{elapsed}s — waiting for workflow</p>
      </div>
    </div>
  );
}
