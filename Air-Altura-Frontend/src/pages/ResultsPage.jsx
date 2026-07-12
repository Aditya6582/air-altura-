import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SearchWidget from '../components/SearchWidget';
import { AIRPORT_MAP } from '../constants/airports';
import api from '../api';

const SORT_OPTIONS = [
  { label: 'Price: Low → High',  value: 'price_ASC' },
  { label: 'Price: High → Low',  value: 'price_DESC' },
  { label: 'Earliest departure', value: 'departureTime_ASC' },
  { label: 'Latest departure',   value: 'departureTime_DESC' },
];

const CLASS_LABELS = {
  'economy':         'Economy',
  'premium-economy': 'Premium Economy',
  'business':        'Business',
  'first-class':     'First Class',
};

/* Chip color map — each filter type gets its own hue */
const CHIP_COLORS = {
  cabin: { bg: 'rgba(79,111,238,0.09)',  text: '#3A5CC5', border: 'rgba(79,111,238,0.22)'  },
  date:  { bg: 'rgba(14,59,77,0.07)',    text: '#0E3B4D', border: 'rgba(14,59,77,0.18)'    },
  stop:  { bg: 'rgba(46,110,70,0.09)',   text: '#2E6E46', border: 'rgba(46,110,70,0.22)'   },
  pax:   { bg: 'rgba(200,117,78,0.09)', text: '#A85832', border: 'rgba(200,117,78,0.22)'  },
  price: { bg: 'rgba(124,58,147,0.09)', text: '#7C3A93', border: 'rgba(124,58,147,0.22)'  },
};

function FilterChip({ label, type = 'date' }) {
  const c = CHIP_COLORS[type] || CHIP_COLORS.date;
  return (
    <span
      className="inline-block font-body text-[11px] font-medium tracking-[0.12em] uppercase rounded-full px-3 py-1"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {label}
    </span>
  );
}

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDuration(dep, arr) {
  if (!dep || !arr) return '—';
  const mins = Math.round((new Date(arr) - new Date(dep)) / 60000);
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
}

function resolveClass(flightClasses, seatClass) {
  if (!flightClasses?.length) return null;
  return (
    flightClasses.find(fc => fc.seatClass === seatClass) ||
    flightClasses.find(fc => fc.seatClass === 'economy') ||
    flightClasses[0]
  );
}

export default function ResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const tripsParam = searchParams.get('trips')     || '';
  const fromCode   = searchParams.get('fromCode')  || tripsParam.split('-')[0] || '';
  const toCode     = searchParams.get('toCode')    || tripsParam.split('-')[1] || '';
  const tripDate   = searchParams.get('tripDate')  || '';
  const travellers = Number(searchParams.get('travellers')) || 1;
  const priceParam = searchParams.get('price')     || '';
  const seatClass  = searchParams.get('seatClass') || 'economy';
  const stopType   = searchParams.get('stopType')  || '';
  const priceMax   = priceParam ? Number(priceParam.split('-')[1]) || '' : '';

  const [search, setSearch] = useState({
    fromCode, toCode, tripDate, travellers, priceMax, seatClass, stopType,
  });

  const [sort, setSort]       = useState('price_ASC');
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchFlights = useCallback(async (params, sortVal) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/flights', { params: { ...params, sort: sortVal } });
      setFlights(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load flights. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  function buildApiParams(overrideSort) {
    const p = {};
    if (tripsParam)  p.trips      = tripsParam;
    if (tripDate)    p.tripDate   = tripDate;
    if (travellers)  p.travellers = travellers;
    if (priceParam)  p.price      = priceParam;
    if (seatClass)   p.seatClass  = seatClass;
    if (stopType)    p.stopType   = stopType;
    p.sort = overrideSort || sort;
    return p;
  }

  useEffect(() => {
    fetchFlights(buildApiParams(sort), sort);
  }, [searchParams, sort]);

  function handleReSearch() {
    const params = new URLSearchParams();
    if (search.fromCode && search.toCode) {
      params.set('trips',     `${search.fromCode}-${search.toCode}`);
      params.set('fromCode',  search.fromCode);
      params.set('toCode',    search.toCode);
    }
    if (search.tripDate)   params.set('tripDate',   search.tripDate);
    if (search.travellers) params.set('travellers', search.travellers);
    if (search.priceMax)   params.set('price',      `0-${search.priceMax}`);
    if (search.seatClass)  params.set('seatClass',  search.seatClass);
    if (search.stopType)   params.set('stopType',   search.stopType);
    setSearchParams(params);
  }

  /* Filter chips to display */
  const chips = [
    seatClass                  && { label: CLASS_LABELS[seatClass] || seatClass,       type: 'cabin' },
    tripDate                   && { label: new Date(tripDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), type: 'date' },
    stopType === 'DIRECT'      && { label: 'Direct only',                               type: 'stop'  },
    stopType === 'ONE_STOP'    && { label: '1 stop',                                    type: 'stop'  },
    travellers > 1             && { label: `${travellers} travellers`,                  type: 'pax'   },
    priceMax                   && { label: `Max ₹${Number(priceMax).toLocaleString('en-IN')}`, type: 'price' },
  ].filter(Boolean);

  return (
    <main className="bg-aa-cream min-h-screen pb-8">

      {/* ── Compact search header ── */}
      <section className="border-b border-aa-mist bg-aa-cream">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 pt-4 pb-4">
          <SearchWidget
            values={search}
            onChange={setSearch}
            onSubmit={handleReSearch}
            compact
          />
        </div>
      </section>

      {/* ── Controls bar ── */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-8 pt-3 pb-1">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-body text-[11px] font-medium tracking-[0.32em] uppercase text-aa-slate">
              {loading ? 'Searching…' : `${flights.length} flight${flights.length !== 1 ? 's' : ''} found`}
            </span>
            {chips.map((c, i) => <FilterChip key={i} label={c.label} type={c.type} />)}
          </div>

          <select
            className="aa-input py-1.5 px-3 text-sm w-auto self-start sm:self-auto"
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{ minWidth: 180 }}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </section>

      {/* ── Flight list ── */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-8 pt-3">
        {loading && (
          <div className="text-center py-16 text-aa-slate font-body text-sm">Searching flights…</div>
        )}
        {error && (
          <div className="text-center py-16 text-aa-caution font-body text-sm">{error}</div>
        )}
        {!loading && !error && flights.length === 0 && (
          <div className="text-center py-16">
            <p className="font-display text-2xl tracking-tight text-aa-slate m-0">No flights found.</p>
            <p className="font-body text-sm text-aa-slate mt-2">
              Try a different date, cabin class, or removing the max price filter.
            </p>
          </div>
        )}

        {!loading && !error && flights.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {flights.map((flight) => {
              const flightClasses = flight.FlightClasses || [];
              const selectedClass = resolveClass(flightClasses, seatClass);
              const classPrice    = selectedClass?.price ?? flight.price;
              const isOneStop     = flight.stopType === 'ONE_STOP';
              const depCode       = flight.departureAirportId;
              const arrCode       = flight.arrivalAirportId;
              const aircraft      = flight.airplaneDetails?.modelNumber || '—';
              const flightNumber  = flight.flightNumber || `#${flight.id}`;

              return (
                <article
                  key={flight.id}
                  className="bg-white border border-aa-mist rounded-xl px-6 py-4 hover:-translate-y-0.5 hover:border-aa-slate transition-[border-color,transform] duration-300 ease-[cubic-bezier(0.25,0,0.1,1)]"
                >
                  {/* Desktop grid */}
                  <div className="hidden sm:grid gap-5 items-center" style={{ gridTemplateColumns: '1.6fr 0.75fr 0.75fr 0.75fr auto' }}>

                    {/* Route + times */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-body text-[10px] font-medium tracking-[0.28em] uppercase text-aa-slate">
                          {depCode} → {arrCode}
                        </span>
                        <span
                          className="font-body text-[10px] font-medium tracking-widest uppercase px-1.5 py-0.5 rounded-[3px]"
                          style={isOneStop
                            ? { color: '#7D5A00', backgroundColor: 'rgba(180,130,0,0.10)' }
                            : { color: '#2E6E46', backgroundColor: 'rgba(46,110,70,0.10)' }}
                        >
                          {isOneStop ? '1 stop' : 'Direct'}
                        </span>
                        <span className="font-body text-[10px] text-aa-slate/50">{flightNumber}</span>
                      </div>
                      <div className="font-display text-[22px] tracking-tight text-aa-ink leading-none">
                        {formatTime(flight.departureTime)}
                        <span className="font-body text-sm text-aa-slate mx-2">→</span>
                        {formatTime(flight.arrivalTime)}
                      </div>
                    </div>

                    {/* Duration */}
                    <div>
                      <div className="font-body text-[10px] font-medium tracking-[0.28em] uppercase text-aa-slate mb-1">Duration</div>
                      <div className="font-display text-[16px] tracking-tight text-aa-horizon leading-none">
                        {formatDuration(flight.departureTime, flight.arrivalTime)}
                      </div>
                      {isOneStop && <div className="font-body text-[10px] text-aa-slate/60 mt-0.5">layover</div>}
                    </div>

                    {/* Class */}
                    <div>
                      <div className="font-body text-[10px] font-medium tracking-[0.28em] uppercase text-aa-slate mb-1">Class</div>
                      <div className="font-body text-sm text-aa-ink">{CLASS_LABELS[selectedClass?.seatClass] || 'Economy'}</div>
                    </div>

                    {/* Aircraft */}
                    <div>
                      <div className="font-body text-[10px] font-medium tracking-[0.28em] uppercase text-aa-slate mb-1">Aircraft</div>
                      <div className="font-body text-sm text-aa-ink">{aircraft}</div>
                    </div>

                    {/* Price + Select */}
                    <div className="flex flex-col items-end gap-2 min-w-[120px]">
                      <div className="text-right">
                        <div className="font-body text-[10px] font-medium tracking-[0.28em] uppercase text-aa-slate mb-0.5">from</div>
                        <div className="font-display text-[22px] tracking-tight text-aa-copper leading-none">
                          ₹{classPrice?.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/flight/${flight.id}?seatClass=${selectedClass?.seatClass || seatClass}&travellers=${travellers}`)}
                        className="w-full text-white font-body text-sm font-medium px-4 py-1.5 rounded-full border-none cursor-pointer transition-opacity duration-200 hover:opacity-85"
                        style={{ backgroundColor: '#4F6FEE' }}
                      >
                        Select
                      </button>
                    </div>
                  </div>

                  {/* Mobile layout */}
                  <div className="sm:hidden">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-body text-[10px] font-medium tracking-[0.28em] uppercase text-aa-slate">
                            {depCode} → {arrCode}
                          </span>
                          <span
                            className="font-body text-[10px] font-medium tracking-widest uppercase px-1.5 py-0.5 rounded-[3px]"
                            style={isOneStop
                              ? { color: '#7D5A00', backgroundColor: 'rgba(180,130,0,0.10)' }
                              : { color: '#2E6E46', backgroundColor: 'rgba(46,110,70,0.10)' }}
                          >
                            {isOneStop ? '1 stop' : 'Direct'}
                          </span>
                        </div>
                        <div className="font-display text-[20px] tracking-tight text-aa-ink leading-none">
                          {formatTime(flight.departureTime)}
                          <span className="font-body text-sm text-aa-slate mx-2">→</span>
                          {formatTime(flight.arrivalTime)}
                        </div>
                        <div className="font-body text-[11px] text-aa-slate mt-1">
                          {formatDuration(flight.departureTime, flight.arrivalTime)} · {CLASS_LABELS[selectedClass?.seatClass] || 'Economy'}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <div className="font-body text-[10px] font-medium tracking-[0.28em] uppercase text-aa-slate mb-0.5">from</div>
                        <div className="font-display text-[20px] tracking-tight text-aa-copper leading-none">
                          ₹{classPrice?.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/flight/${flight.id}?seatClass=${selectedClass?.seatClass || seatClass}&travellers=${travellers}`)}
                      className="w-full text-white font-body text-sm font-medium px-4 py-2.5 rounded-full border-none cursor-pointer transition-opacity duration-200 hover:opacity-85"
                      style={{ backgroundColor: '#4F6FEE' }}
                    >
                      Select flight
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
