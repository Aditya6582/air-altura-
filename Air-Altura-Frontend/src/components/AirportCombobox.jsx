import { useState, useRef, useEffect } from 'react';
import { AIRPORTS } from '../constants/airports';
import { X, ChevronDown } from 'lucide-react';

/*
 * AirportCombobox
 * pill=true  — label lives inside; code shown inline with city ("BOM · Mumbai")
 *              so the single value line aligns with Date/Cabin/Stops/Pax.
 * onOpenChange(bool) — called when dropdown opens/closes so parent can
 *              apply a focus ring to the wrapping field div.
 */
export default function AirportCombobox({
  value, onChange, placeholder = 'City or code', exclude,
  pill = false, label = '', onOpenChange, dropUp = false,
}) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const containerRef      = useRef(null);
  const inputRef          = useRef(null);
  const selected          = AIRPORTS.find(a => a.code === value);

  const filtered = AIRPORTS.filter(a => {
    if (a.code === exclude) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return a.city.toLowerCase().includes(q) || a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
  });

  useEffect(() => {
    const handler = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function openDropdown() {
    setOpen(true);
    onOpenChange?.(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function close() {
    setOpen(false);
    setQuery('');
    onOpenChange?.(false);
  }

  function handleSelect(code) {
    onChange(code);
    close();
  }

  function handleClear(e) {
    e.stopPropagation();
    onChange('');
  }

  const dropdownPanel = (
    <div
      className="absolute z-50 left-0 bg-white border border-aa-mist overflow-hidden"
      style={{
        ...(dropUp ? { bottom: 'calc(100% + 10px)' } : { top: 'calc(100% + 10px)' }),
        minWidth:     '260px',
        borderRadius: '12px',
        boxShadow:    '0 8px 32px rgba(14,59,77,0.14)',
      }}
    >
      <div className="p-2 border-b border-aa-mist">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search city or code…"
          className="w-full font-body text-sm text-aa-ink bg-aa-cream rounded-lg px-3 py-2 outline-none placeholder:text-aa-slate/50"
          style={{ border: 'none' }}
        />
      </div>
      <div className="max-h-[220px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-3 font-body text-sm text-aa-slate">No airports found.</div>
        ) : filtered.map(a => (
          <button
            key={a.code}
            type="button"
            onClick={() => handleSelect(a.code)}
            className={[
              'w-full text-left px-4 py-2.5 flex items-center gap-3 border-none cursor-pointer transition-colors duration-100',
              a.code === value ? 'bg-aa-horizon/10 text-aa-horizon' : 'bg-white hover:bg-[#EBF4FF]',
            ].join(' ')}
          >
            <span className={`font-body text-[11px] font-semibold tracking-[0.15em] w-8 shrink-0 ${a.code === value ? 'text-aa-horizon' : 'text-aa-slate'}`}>
              {a.code}
            </span>
            <div className="flex flex-col min-w-0">
              <span className={`font-body text-sm font-medium ${a.code === value ? 'text-aa-horizon' : 'text-aa-ink'}`}>{a.city}</span>
              <span className="font-body text-[11px] text-aa-slate truncate">{a.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  if (pill) {
    return (
      <div ref={containerRef} className="relative w-full">
        <button
          type="button"
          onClick={openDropdown}
          className="w-full flex items-center justify-between gap-1.5 bg-transparent border-none outline-none cursor-pointer px-0 py-0 text-left"
        >
          <span className="flex flex-col min-w-0 flex-1">
            {label && (
              <span className="font-body text-[10px] font-medium tracking-[0.22em] uppercase text-aa-slate/60 leading-none mb-1">
                {label}
              </span>
            )}
            {selected ? (
              /* Code inline with city — single value line, aligns with Date/Cabin/etc. */
              <span className="font-body text-sm font-medium text-aa-ink truncate leading-snug">
                <span className="text-aa-slate text-[11px] font-semibold tracking-wider uppercase mr-1.5">{selected.code}</span>
                {selected.city}
              </span>
            ) : (
              <span className="font-body text-sm text-aa-slate/55 leading-snug">{placeholder}</span>
            )}
          </span>
          <span className="flex items-center gap-1 shrink-0 ml-1">
            {selected
              ? <X size={12} className="text-aa-slate/60 hover:text-aa-ink" onClick={handleClear} />
              : <ChevronDown size={12} className="text-aa-slate/40" />
            }
          </span>
        </button>

        {open && dropdownPanel}
      </div>
    );
  }

  // Standalone (non-pill) variant
  return (
    <div ref={containerRef} className="relative w-full">
      <button type="button" onClick={openDropdown}
        className="aa-input w-full flex items-center justify-between gap-2 text-left cursor-pointer"
      >
        {selected ? (
          <span className="flex flex-col min-w-0 flex-1">
            <span className="font-body text-[10px] font-medium tracking-[0.2em] uppercase text-aa-slate leading-none mb-0.5">{selected.code}</span>
            <span className="font-body text-sm font-medium text-aa-ink truncate leading-tight">{selected.city}</span>
          </span>
        ) : (
          <span className="font-body text-sm text-aa-slate/60 flex-1">{placeholder}</span>
        )}
        <span className="flex items-center gap-1 shrink-0">
          {selected
            ? <X size={12} className="text-aa-slate hover:text-aa-ink" onClick={handleClear} />
            : <ChevronDown size={12} className="text-aa-slate/50" />
          }
        </span>
      </button>

      {open && dropdownPanel}
    </div>
  );
}
