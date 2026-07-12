import { useRef, useState, useEffect } from 'react';
import { ArrowLeftRight, Search, ArrowDownUp } from 'lucide-react';
import AirportCombobox from './AirportCombobox';
import Magnet from './Magnet';

const SEAT_CLASSES = [
  { value: 'economy',         label: 'Economy' },
  { value: 'premium-economy', label: 'Prem. Economy' },
  { value: 'business',        label: 'Business' },
  { value: 'first-class',     label: 'First Class' },
];

const STOP_OPTIONS = [
  { value: '',          label: 'Any stops' },
  { value: 'DIRECT',   label: 'Direct only' },
  { value: 'ONE_STOP', label: '1 stop' },
];

const PAX_OPTIONS = Array.from({ length: 9 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} ${i === 0 ? 'passenger' : 'passengers'}`,
}));

const TODAY   = new Date().toISOString().split('T')[0];
const BLUE    = '#1B7ADF';
const ERROR_C = '#C8562A';

const labelSz = 'font-body text-[10px] font-medium tracking-[0.22em] uppercase text-aa-slate/60 mb-1 leading-none block select-none';

function fieldRing(active, error) {
  if (error)  return { outline: `2px solid ${ERROR_C}`, outlineOffset: '-2px', borderRadius: 'inherit' };
  if (active) return { outline: `2px solid ${BLUE}`,    outlineOffset: '-2px', borderRadius: 'inherit' };
  return {};
}

/* ── PillSelect — custom dropdown replacing all native <select> ── */
function PillSelect({ label, value, onChange, options, width, compact, onOpenChange, dropUp, fullWidth }) {
  const [open, setOpen]  = useState(false);
  const containerRef     = useRef(null);
  const selected         = options.find(o => o.value === value || o.value === String(value));

  useEffect(() => {
    const handler = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        onOpenChange?.(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function toggle() {
    const next = !open;
    setOpen(next);
    onOpenChange?.(next);
  }

  function pick(val) {
    onChange(val);
    setOpen(false);
    onOpenChange?.(false);
  }

  const px = compact ? 'px-4' : 'px-5';

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col justify-center ${fullWidth ? 'px-4 py-3 w-full' : `${px} shrink-0 h-full`} hover:bg-aa-cream/70 transition-colors duration-150 cursor-pointer`}
      style={fullWidth ? {} : { width }}
    >
      <button
        type="button"
        onClick={toggle}
        className="flex flex-col text-left bg-transparent border-none outline-none cursor-pointer p-0 w-full"
      >
        <span className={labelSz}>{label}</span>
        <span className="font-body text-sm text-aa-ink leading-snug select-none">
          {selected?.label ?? '—'}
        </span>
      </button>

      {open && (
        <div
          className="absolute z-50 bg-white border border-aa-mist overflow-hidden"
          style={{
            ...(dropUp
              ? { bottom: 'calc(100% + 10px)' }
              : { top:    'calc(100% + 10px)' }),
            left:         0,
            minWidth:     '160px',
            borderRadius: '12px',
            boxShadow:    '0 8px 32px rgba(14,59,77,0.14)',
          }}
        >
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => pick(opt.value)}
              className={[
                'w-full text-left px-4 py-2.5 font-body text-sm border-none cursor-pointer transition-colors duration-100',
                opt.value === value || opt.value === String(value)
                  ? 'bg-aa-horizon/10 text-aa-horizon font-medium'
                  : 'bg-white hover:bg-[#EBF4FF] text-aa-ink',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main widget ── */
export default function SearchWidget({ values, onChange, onSubmit, compact = false }) {
  const dateRef              = useRef(null);
  const mobileDateRef        = useRef(null);
  const [active, setActive]  = useState(null);
  const [tried, setTried]    = useState(false);
  const dropUp = !compact;

  const update = (key, val) => onChange({ ...values, [key]: val });

  useEffect(() => {
    if (tried && values.fromCode && values.toCode && values.tripDate) {
      setTried(false);
    }
  }, [values.fromCode, values.toCode, values.tripDate, tried]);

  function swapAirports() {
    onChange({ ...values, fromCode: values.toCode, toCode: values.fromCode });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!values.fromCode || !values.toCode || !values.tripDate) {
      setTried(true);
      return;
    }
    setTried(false);
    onSubmit();
  }

  const h       = compact ? 'h-[52px]' : 'h-[68px]';
  const fieldPx = compact ? 'px-4' : 'px-5';

  const formattedDate = values.tripDate
    ? new Date(values.tripDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : null;

  const missing = {
    from: tried && !values.fromCode,
    to:   tried && !values.toCode,
    date: tried && !values.tripDate,
  };

  const missingLabels = [
    missing.from && 'departure',
    missing.to   && 'destination',
    missing.date && 'date',
  ].filter(Boolean);

  const shadow = { boxShadow: '0 4px 24px rgba(14,59,77,0.18), 0 1px 4px rgba(14,59,77,0.10)' };

  return (
    <div>

      {/* ── MOBILE layout (< sm) ── */}
      <form onSubmit={handleSubmit} className="sm:hidden select-none">
        <div className="bg-white border border-aa-mist rounded-2xl overflow-visible" style={shadow}>

          {/* From */}
          <div
            className="flex items-center px-4 py-3 border-b border-aa-mist rounded-t-2xl"
            style={fieldRing(active === 'from', missing.from)}
          >
            <AirportCombobox
              label="From"
              value={values.fromCode}
              onChange={v => update('fromCode', v)}
              placeholder="Departure city"
              exclude={values.toCode}
              pill
              dropUp={false}
              onOpenChange={o => setActive(o ? 'from' : null)}
            />
          </div>

          {/* Swap + To */}
          <div className="relative border-b border-aa-mist">
            <button
              type="button"
              onClick={swapAirports}
              className="absolute right-4 -top-4 z-10 w-8 h-8 rounded-full bg-white border border-aa-mist flex items-center justify-center hover:bg-aa-cream transition-colors duration-150 cursor-pointer"
              title="Swap airports"
            >
              <ArrowDownUp size={13} className="text-aa-slate" />
            </button>
            <div
              className="flex items-center px-4 py-3"
              style={fieldRing(active === 'to', missing.to)}
            >
              <AirportCombobox
                label="To"
                value={values.toCode}
                onChange={v => update('toCode', v)}
                placeholder="Arrival city"
                exclude={values.fromCode}
                pill
                dropUp={false}
                onOpenChange={o => setActive(o ? 'to' : null)}
              />
            </div>
          </div>

          {/* Date + Cabin */}
          <div className="grid grid-cols-2 border-b border-aa-mist">
            <div
              className="relative flex flex-col justify-center px-4 py-3 border-r border-aa-mist cursor-pointer hover:bg-aa-cream/70 transition-colors duration-150"
              style={fieldRing(active === 'date', missing.date)}
              onClick={() => { setActive('date'); mobileDateRef.current?.showPicker?.(); }}
            >
              <input
                ref={mobileDateRef}
                type="date"
                min={TODAY}
                value={values.tripDate}
                onChange={e => update('tripDate', e.target.value)}
                onBlur={() => setActive(null)}
                style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
                tabIndex={-1}
              />
              <span className={labelSz}>Date</span>
              <span className={`font-body text-sm select-none leading-snug ${formattedDate ? 'text-aa-ink' : 'text-aa-slate/55'}`}>
                {formattedDate ?? 'Pick a date'}
              </span>
            </div>
            <PillSelect
              label="Cabin"
              value={values.seatClass || 'economy'}
              onChange={v => update('seatClass', v)}
              options={SEAT_CLASSES}
              fullWidth
              dropUp={false}
              onOpenChange={o => setActive(o ? 'cabin' : null)}
            />
          </div>

          {/* Stops + Pax */}
          <div className="grid grid-cols-2 border-b border-aa-mist">
            <div className="border-r border-aa-mist">
              <PillSelect
                label="Stops"
                value={values.stopType ?? ''}
                onChange={v => update('stopType', v)}
                options={STOP_OPTIONS}
                fullWidth
                dropUp={false}
                onOpenChange={o => setActive(o ? 'stops' : null)}
              />
            </div>
            <PillSelect
              label="Passengers"
              value={String(values.travellers || 1)}
              onChange={v => update('travellers', Number(v))}
              options={PAX_OPTIONS}
              fullWidth
              dropUp={false}
              onOpenChange={o => setActive(o ? 'pax' : null)}
            />
          </div>

          {/* Search button */}
          <div className="px-4 py-3">
            <button
              type="submit"
              className="w-full rounded-full font-body text-[15px] font-medium text-white py-3.5 border-none cursor-pointer transition-opacity duration-200 hover:opacity-85 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#C8754E' }}
            >
              <Search size={16} strokeWidth={2.5} />
              Search flights
            </button>
          </div>

        </div>

        {missingLabels.length > 0 && (
          <p className="mt-2 px-1 font-body text-[12px]" style={{ color: '#C8562A' }}>
            Please select {missingLabels.join(' and ')} to search
          </p>
        )}
      </form>

      {/* ── DESKTOP layout (≥ sm) ── */}
      <div className="hidden sm:block">
        <form
          onSubmit={handleSubmit}
          className={`flex items-stretch bg-white border border-aa-mist rounded-full overflow-visible select-none ${h}`}
          style={shadow}
        >

          {/* FROM */}
          <div
            className={`flex items-center ${fieldPx} flex-1 min-w-0 rounded-l-full hover:bg-aa-cream/70 transition-colors duration-150 cursor-pointer`}
            style={fieldRing(active === 'from', missing.from)}
          >
            <AirportCombobox
              label="From"
              value={values.fromCode}
              onChange={v => update('fromCode', v)}
              placeholder="Departure city"
              exclude={values.toCode}
              pill
              dropUp={dropUp}
              onOpenChange={o => setActive(o ? 'from' : null)}
            />
          </div>

          {/* SWAP */}
          <div className="flex items-center shrink-0">
            <div className="w-px self-stretch bg-aa-mist my-3" />
            <button
              type="button"
              onClick={swapAirports}
              className="mx-1 p-1.5 rounded-full hover:bg-aa-cream transition-colors duration-150 border-none bg-transparent cursor-pointer shrink-0"
              title="Swap airports"
            >
              <ArrowLeftRight size={13} className="text-aa-slate" />
            </button>
            <div className="w-px self-stretch bg-aa-mist my-3" />
          </div>

          {/* TO */}
          <div
            className={`flex items-center ${fieldPx} flex-1 min-w-0 hover:bg-aa-cream/70 transition-colors duration-150 cursor-pointer`}
            style={fieldRing(active === 'to', missing.to)}
          >
            <AirportCombobox
              label="To"
              value={values.toCode}
              onChange={v => update('toCode', v)}
              placeholder="Arrival city"
              exclude={values.fromCode}
              pill
              dropUp={dropUp}
              onOpenChange={o => setActive(o ? 'to' : null)}
            />
          </div>

          <div className="w-px self-stretch bg-aa-mist my-3 shrink-0" />

          {/* DATE */}
          <div
            className={`relative flex flex-col justify-center ${fieldPx} shrink-0 hover:bg-aa-cream/70 transition-colors duration-150 cursor-pointer`}
            style={{ width: compact ? 116 : 132, ...fieldRing(active === 'date', missing.date) }}
            onClick={() => { setActive('date'); dateRef.current?.showPicker?.(); }}
          >
            <input
              ref={dateRef}
              type="date"
              min={TODAY}
              value={values.tripDate}
              onChange={e => update('tripDate', e.target.value)}
              onBlur={() => setActive(null)}
              style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
              tabIndex={-1}
            />
            <span className={labelSz}>Date</span>
            <span className={`font-body text-sm select-none leading-snug ${formattedDate ? 'text-aa-ink' : 'text-aa-slate/55'}`}>
              {formattedDate ?? 'Pick a date'}
            </span>
          </div>

          <div className="w-px self-stretch bg-aa-mist my-3 shrink-0" />

          {/* CABIN */}
          <div style={fieldRing(active === 'cabin', false)}>
            <PillSelect
              label="Cabin"
              value={values.seatClass || 'economy'}
              onChange={v => update('seatClass', v)}
              options={SEAT_CLASSES.map(o => ({ ...o, label: o.value === 'premium-economy' ? 'Prem. Economy' : o.label }))}
              width={compact ? 108 : 124}
              compact={compact}
              dropUp={dropUp}
              onOpenChange={o => setActive(o ? 'cabin' : null)}
            />
          </div>

          <div className="w-px self-stretch bg-aa-mist my-3 shrink-0" />

          {/* STOPS */}
          <div style={fieldRing(active === 'stops', false)}>
            <PillSelect
              label="Stops"
              value={values.stopType ?? ''}
              onChange={v => update('stopType', v)}
              options={[
                { value: '',          label: 'Any' },
                { value: 'DIRECT',   label: 'Direct' },
                { value: 'ONE_STOP', label: '1 stop' },
              ]}
              width={compact ? 82 : 96}
              compact={compact}
              dropUp={dropUp}
              onOpenChange={o => setActive(o ? 'stops' : null)}
            />
          </div>

          <div className="w-px self-stretch bg-aa-mist my-3 shrink-0" />

          {/* PAX */}
          <div style={fieldRing(active === 'pax', false)}>
            <PillSelect
              label="Pax"
              value={String(values.travellers || 1)}
              onChange={v => update('travellers', Number(v))}
              options={Array.from({ length: 9 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
              width={compact ? 62 : 74}
              compact={compact}
              dropUp={dropUp}
              onOpenChange={o => setActive(o ? 'pax' : null)}
            />
          </div>

          {/* SEARCH */}
          <div className="flex items-center pr-1.5 pl-1.5 shrink-0">
            <Magnet magnetStrength={3} padding={50}>
              <button
                type="submit"
                className="rounded-full flex items-center justify-center border-none cursor-pointer transition-opacity duration-200 hover:opacity-85 active:scale-95"
                style={{
                  width:           compact ? 38 : 46,
                  height:          compact ? 38 : 46,
                  backgroundColor: '#C8754E',
                }}
                aria-label="Search flights"
              >
                <Search size={compact ? 14 : 17} color="white" strokeWidth={2.5} />
              </button>
            </Magnet>
          </div>

        </form>

        {missingLabels.length > 0 && (
          <p
            className="animate-fade-in"
            style={{
              margin: '10px 0 0 20px',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '12px',
              color: '#C8562A',
              letterSpacing: '0.01em',
            }}
          >
            Please select {missingLabels.join(' and ')} to search
          </p>
        )}
      </div>

    </div>
  );
}
