import { useState } from 'react';
import { COUNTRIES } from '../lib/countries';

type Props = {
  onSubmit: (category: string, city: string, country: string, maxResults: number) => void;
  loading: boolean;
};

export default function GeneratorForm({ onSubmit, loading }: Props) {
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('ALL');
  const [maxResults, setMaxResults] = useState(25);
  const [catError, setCatError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = category.trim();
    if (!trimmed) {
      setCatError('Category is required');
      return;
    }
    setCatError('');
    const clamped = Math.max(1, Math.min(500, maxResults || 25));
    onSubmit(trimmed, city.trim(), country, clamped);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">Category</label>
        <input
          type="text"
          value={category}
          onChange={e => { setCategory(e.target.value); setCatError(''); }}
          placeholder="boutique hotels"
          disabled={loading}
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
        />
        {catError && <p className="text-error text-xs mt-1 font-mono">{catError}</p>}
      </div>
      <div>
        <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">City</label>
        <input
          type="text"
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="Austin"
          disabled={loading}
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">Country</label>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            disabled={loading}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
          >
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">Max results</label>
          <input
            type="number"
            value={maxResults}
            onChange={e => setMaxResults(Number(e.target.value))}
            min={1}
            max={500}
            disabled={loading}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-medium text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Generate Leads
      </button>
    </form>
  );
}
