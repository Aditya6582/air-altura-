import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Plane, Clock, Users, Armchair, CircleDot, Circle } from 'lucide-react';
import { AIRPORT_MAP } from '../constants/airports';
import api from '../api';

const CLASS_LABELS = {
  'economy':         'Economy',
  'premium-economy': 'Premium Economy',
  'business':        'Business',
  'first-class':     'First Class',
};

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDuration(dep, arr) {
  if (!dep || !arr) return '—';
  const mins = Math.round((new Date(arr) - new Date(dep)) / 60000);
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
}

// ── Journey visualizer ──────────────────────────────────────────────────────
// DIRECT: two nodes connected by a line + duration in the middle
// ONE_STOP: three nodes — origin, stop (with layover badge), destination
function JourneyLine({ flight, stop, isOneStop }) {
  const dep  = { code: flight.departureAirportId, city: flight.departureAirport?.City?.name || flight.departureAirportId, airport: flight.departureAirport?.name || '', time: flight.departureTime };
  const arr  = { code: flight.arrivalAirportId,   city: flight.arrivalAirport?.City?.name   || flight.arrivalAirportId,   airport: flight.arrivalAirport?.name   || '', time: flight.arrivalTime };

  if (!isOneStop || !stop) {
    return <DirectJourney dep={dep} arr={arr} flight={flight} />;
  }

  const stopInfo = AIRPORT_MAP[stop.airportCode] || {};
  const via = { code: stop.airportCode, city: stopInfo.city || stop.airportCode, airport: stopInfo.name || '', arrTime: stop.arrivalTime, depTime: stop.departureTime, layover: stop.layoverMins };
  return <StopJourney dep={dep} via={via} arr={arr} flight={flight} />;
}

function NodeDot({ filled }) {
  return filled
    ? <CircleDot size={14} className="shrink-0" style={{ color: '#4F6FEE' }} />
    : <Circle    size={14} className="text-aa-slate shrink-0" />;
}

function DirectJourney({ dep, arr, flight }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-center">
      <AirportNode side="left" code={dep.code} city={dep.city} airport={dep.airport} time={dep.time} label="Departure" />

      <div className="flex flex-col items-center gap-2 px-4">
        <span className="font-body text-[11px] font-semibold tracking-[0.24em] uppercase" style={{ color: '#4F6FEE' }}>
          {formatDuration(dep.time, arr.time)}
        </span>
        <div className="flex items-center gap-1.5">
          <NodeDot filled />
          <div className="h-px w-20" style={{ backgroundColor: '#C7D2FE' }} />
          <Plane size={14} style={{ color: '#4F6FEE' }} />
          <div className="h-px w-20" style={{ backgroundColor: '#C7D2FE' }} />
          <NodeDot />
        </div>
        <span
          className="font-body text-[10px] font-medium tracking-[0.12em] uppercase px-2 py-0.5 rounded-[3px]"
          style={{ color: '#2E6E46', backgroundColor: 'rgba(46,110,70,0.10)' }}
        >
          Direct
        </span>
      </div>

      <AirportNode side="right" code={arr.code} city={arr.city} airport={arr.airport} time={arr.time} label="Arrival" />
    </div>
  );
}

function StopJourney({ dep, via, arr, flight }) {
  const leg1Duration = formatDuration(dep.time, via.arrTime);
  const leg2Duration = formatDuration(via.depTime, arr.time);

  return (
    <div className="flex flex-col gap-0">
      {/* Leg 1: origin → stop */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
        <AirportNode side="left" code={dep.code} city={dep.city} airport={dep.airport} time={dep.time} label="Departure" />
        <div className="flex flex-col items-center gap-1.5 px-3">
          <span className="font-body text-[11px] tracking-[0.2em] uppercase text-aa-slate">{leg1Duration}</span>
          <div className="flex items-center gap-1">
            <NodeDot filled />
            <div className="h-px w-14" style={{ backgroundColor: '#C7D2FE' }} />
            <Plane size={12} style={{ color: '#4F6FEE' }} />
            <div className="h-px w-14" style={{ backgroundColor: '#C7D2FE' }} />
            <NodeDot filled />
          </div>
        </div>
        <AirportNode side="right" code={via.code} city={via.city} airport={via.airport} time={via.arrTime} label="Arrives at stop" small />
      </div>

      {/* Layover band */}
      <div className="flex justify-center my-3">
        <div
          className="flex items-center gap-2 px-4 py-1.5 rounded-full font-body text-[11px] font-semibold"
          style={{ color: '#B45309', backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}
        >
          <Clock size={11} />
          {via.layover ? `${via.layover} min layover at ${via.city || via.code}` : `Layover at ${via.city || via.code}`}
        </div>
      </div>

      {/* Leg 2: stop → destination */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
        <AirportNode side="left" code={via.code} city={via.city} airport={via.airport} time={via.depTime} label="Departs stop" small />
        <div className="flex flex-col items-center gap-1.5 px-3">
          <span className="font-body text-[11px] tracking-[0.2em] uppercase" style={{ color: '#4F6FEE' }}>{leg2Duration}</span>
          <div className="flex items-center gap-1">
            <NodeDot filled />
            <div className="h-px w-14" style={{ backgroundColor: '#C7D2FE' }} />
            <Plane size={12} style={{ color: '#4F6FEE' }} />
            <div className="h-px w-14" style={{ backgroundColor: '#C7D2FE' }} />
            <NodeDot />
          </div>
        </div>
        <AirportNode side="right" code={arr.code} city={arr.city} airport={arr.airport} time={arr.time} label="Arrival" />
      </div>
    </div>
  );
}

function AirportNode({ side, code, city, airport, time, label, small }) {
  const isRight = side === 'right';
  return (
    <div className={isRight ? 'text-right' : ''}>
      <div className="font-body text-[11px] font-medium tracking-[0.32em] uppercase text-aa-slate mb-1.5">{label}</div>
      <div className={`font-display leading-none mb-1.5 ${small ? 'text-[22px]' : 'text-[32px]'} tracking-tight text-aa-ink`}>
        {formatTime(time)}
      </div>
      <div className="font-body text-base font-medium text-aa-ink">{city} ({code})</div>
      {airport && <div className="font-body text-[11px] text-aa-slate mt-0.5 leading-snug">{airport}</div>}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function FlightDetailPage() {
  const { id }             = useParams();
  const [searchParams]     = useSearchParams();
  const navigate           = useNavigate();

  const travellers = Number(searchParams.get('travellers')) || 1;
  const initClass  = searchParams.get('seatClass') || 'economy';

  const [flight, setFlight]          = useState(null);
  const [loading, setLoading]        = useState(true);
  const [error, setError]            = useState(null);
  const [selectedClass, setSelected] = useState(initClass);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/flights/${id}`);
        setFlight(data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load flight details.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <main className="bg-aa-cream min-h-screen pb-20">
        <div className="max-w-[900px] mx-auto px-8 pt-20 text-center">
          <p className="font-body text-sm text-aa-slate">Loading flight details…</p>
        </div>
      </main>
    );
  }

  if (error || !flight) {
    return (
      <main className="bg-aa-cream min-h-screen pb-20">
        <div className="max-w-[900px] mx-auto px-8 pt-20 text-center">
          <p className="font-body text-sm text-aa-caution">{error || 'Flight not found.'}</p>
          <button onClick={() => navigate(-1)} className="mt-4 font-body text-sm text-aa-slate underline bg-transparent border-none cursor-pointer">
            Go back
          </button>
        </div>
      </main>
    );
  }

  const hasDeparted   = new Date(flight.departureTime) < new Date();
  const flightClasses = flight.FlightClasses || [];
  const activeClass   = flightClasses.find(fc => fc.seatClass === selectedClass) || flightClasses[0];
  const isOneStop     = flight.stopType === 'ONE_STOP';
  const stop          = flight.FlightStops?.[0];
  const depCode       = flight.departureAirportId;
  const arrCode       = flight.arrivalAirportId;
  const depCity       = flight.departureAirport?.City?.name || depCode;
  const arrCity       = flight.arrivalAirport?.City?.name   || arrCode;
  const aircraft      = flight.airplaneDetails?.modelNumber || '—';
  const flightNumber  = flight.flightNumber || `#${flight.id}`;
  const totalCost     = activeClass ? activeClass.price * travellers : 0;
  const soldOut       = activeClass?.totalSeats === 0 || hasDeparted;

  function handleBook() {
    navigate('/booking', {
      state: { flight, travellers, seatClass: activeClass?.seatClass || selectedClass, selectedClass: activeClass, totalCost },
    });
  }

  return (
    <main className="bg-aa-cream min-h-screen pb-8">
      <div className="max-w-[900px] mx-auto px-4 sm:px-8 pt-5">

        {/* Back + status */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="font-body text-sm text-aa-slate bg-transparent border-none cursor-pointer p-0 hover:text-aa-ink transition-colors duration-200"
          >
            ← Back to results
          </button>
          {hasDeparted ? (
            <span className="inline-flex items-center gap-1.5 font-body text-[11px] font-medium tracking-[0.2em] uppercase px-3 py-1 rounded-full"
              style={{ color: '#5C6670', backgroundColor: 'rgba(92,102,112,0.1)', border: '1px solid rgba(92,102,112,0.2)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-aa-slate inline-block" />
              Departed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 font-body text-[11px] font-semibold tracking-[0.18em] uppercase px-3 py-1 rounded-full"
              style={{ color: '#16A34A', backgroundColor: '#DCFCE7', border: '1px solid #86EFAC' }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ backgroundColor: '#22C55E' }} />
              Live · prices &amp; seats updated
            </span>
          )}
        </div>

        {/* Flight info card */}
        <div className="bg-white border border-aa-mist rounded-xl p-6 mb-4 overflow-hidden" style={{ borderTop: '3px solid #4F6FEE' }}>
          <JourneyLine flight={flight} stop={stop} isOneStop={isOneStop} />

          {/* Meta row */}
          <div className="pt-4 mt-5 border-t border-aa-mist flex flex-wrap gap-6 sm:gap-8">
            <MetaItem icon={<Plane size={13} style={{ color: '#4F6FEE' }} />} label="Aircraft" value={aircraft} />
            <MetaItem icon={<Plane size={13} style={{ color: '#C8754E' }} />} label="Flight" value={flightNumber} />
            <MetaItem icon={<Users size={13} style={{ color: '#0E3B4D' }} />} label="Travellers" value={travellers} />
            <MetaItem icon={<Clock size={13} style={{ color: '#F59E0B' }} />} label="Date" value={formatDate(flight.departureTime)} />
          </div>
        </div>

        {/* Cabin selector */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Armchair size={13} style={{ color: '#4F6FEE' }} />
            <span className="font-body text-[11px] font-semibold tracking-[0.32em] uppercase" style={{ color: '#4F6FEE' }}>Select cabin</span>
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            {flightClasses.map(fc => (
              <CabinCard
                key={fc.seatClass}
                fc={fc}
                isSelected={fc.seatClass === selectedClass}
                hasDeparted={hasDeparted}
                onSelect={setSelected}
              />
            ))}
          </div>
        </div>

        {/* Book bar */}
        <div className="bg-white border border-aa-mist rounded-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ borderTop: '3px solid #C8754E' }}>
          <div>
            {activeClass && !soldOut ? (
              <>
                <div className="font-body text-[11px] font-medium tracking-[0.24em] uppercase text-aa-slate mb-0.5">
                  {CLASS_LABELS[activeClass.seatClass]} · {travellers} traveller{travellers > 1 ? 's' : ''}
                </div>
                <div className="font-display text-[26px] tracking-tight text-aa-copper leading-none">
                  ₹{totalCost.toLocaleString('en-IN')}
                  <span className="font-body text-sm text-aa-slate ml-2 tracking-normal">total</span>
                </div>
                <div className="font-body text-[11px] text-aa-slate mt-0.5">
                  ₹{activeClass.price.toLocaleString('en-IN')} per seat · live price
                </div>
              </>
            ) : (
              <div className="font-body text-sm text-aa-caution">
                {hasDeparted ? 'This flight has already departed' : 'This cabin is sold out'}
              </div>
            )}
          </div>

          <button
            onClick={handleBook}
            disabled={soldOut || !activeClass}
            className="text-white font-body text-[15px] font-medium px-8 py-3 rounded-full border-none cursor-pointer transition-opacity duration-300 hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            style={{ backgroundColor: '#4F6FEE' }}
          >
            {hasDeparted ? 'Departed' : soldOut ? 'Sold out' : `Book · ${travellers} seat${travellers > 1 ? 's' : ''}`}
          </button>
        </div>

      </div>
    </main>
  );
}

function MetaItem({ icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 font-body text-[11px] font-medium tracking-[0.32em] uppercase text-aa-slate mb-1">
        {icon}
        {label}
      </div>
      <div className="font-body text-sm text-aa-ink">{value}</div>
    </div>
  );
}

// ── Cabin card visual config per tier ────────────────────────────────────────
const CABIN_TIERS = {
  'economy': {
    label: 'Economy',
    accent: '#7A8B94',
    activeBorder: '#0E3B4D',
    activeBg: 'rgba(14,59,77,0.04)',
    activeText: '#0E3B4D',
    activeMuted: 'rgba(14,59,77,0.45)',
    descriptor: '32" pitch · Standard',
  },
  'premium-economy': {
    label: 'Premium Economy',
    accent: '#C8754E',
    activeBorder: '#C8754E',
    activeBg: 'rgba(200,117,78,0.06)',
    activeText: '#0E3B4D',
    activeMuted: 'rgba(14,59,77,0.45)',
    descriptor: '36" pitch · Meal included',
    badge: 'Best value',
  },
  'business': {
    label: 'Business',
    accent: '#0E3B4D',
    activeBorder: '#0E3B4D',
    activeBg: '#0E3B4D',
    activeText: '#FAF6F0',
    activeMuted: 'rgba(250,246,240,0.5)',
    descriptor: 'Lay-flat · Lounge access',
  },
  'first-class': {
    label: 'First Class',
    accent: '#C4994A',
    activeBorder: '#C4994A',
    activeBg: '#13100C',
    activeText: '#C4994A',
    activeMuted: 'rgba(196,153,74,0.55)',
    descriptor: 'Private suite · Concierge',
    badge: 'Pinnacle',
  },
};

function CabinCard({ fc, isSelected, hasDeparted, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const cfg      = CABIN_TIERS[fc.seatClass] || CABIN_TIERS['economy'];
  const isSoldOut = fc.totalSeats === 0 || hasDeparted;
  const lowSeats  = !isSoldOut && fc.totalSeats > 0 && fc.totalSeats <= 10;

  const cardBg     = isSelected ? cfg.activeBg : '#ffffff';
  const cardBorder = isSelected
    ? cfg.activeBorder
    : hovered && !isSoldOut ? '#B8B0A4' : '#E8E2D6';
  const textColor  = isSelected ? cfg.activeText : '#1A2731';
  const mutedColor = isSelected ? cfg.activeMuted : '#8A9299';
  const sepColor   = isSelected ? (cfg.activeText === '#FAF6F0' || cfg.activeText === '#C4994A'
    ? 'rgba(255,255,255,0.12)' : 'rgba(14,59,77,0.12)') : '#E8E2D6';

  const lift = (isSelected || hovered) && !isSoldOut;

  return (
    <button
      type="button"
      onClick={() => !isSoldOut && onSelect(fc.seatClass)}
      disabled={isSoldOut}
      onMouseEnter={() => !isSoldOut && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
        padding: '20px 18px 16px',
        borderRadius: '14px',
        border: `1.5px solid ${cardBorder}`,
        background: cardBg,
        cursor: isSoldOut ? 'not-allowed' : 'pointer',
        opacity: isSoldOut ? 0.42 : 1,
        transform: lift ? 'translateY(-5px)' : 'none',
        boxShadow: isSelected
          ? `0 14px 44px ${cfg.accent}26, 0 4px 12px rgba(0,0,0,0.09)`
          : hovered && !isSoldOut
            ? '0 8px 28px rgba(14,59,77,0.11), 0 2px 6px rgba(0,0,0,0.05)'
            : '0 1px 4px rgba(14,59,77,0.05)',
        transition: 'transform 230ms cubic-bezier(0.25,0,0.1,1), box-shadow 230ms cubic-bezier(0.25,0,0.1,1), border-color 180ms ease, background-color 200ms ease',
        overflow: 'hidden',
        minHeight: '168px',
      }}
    >
      {/* Accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: cfg.accent,
        opacity: isSelected ? 1 : 0.28,
        transition: 'opacity 200ms ease',
      }} />

      {/* Badge */}
      {cfg.badge && !isSelected && !isSoldOut && (
        <div style={{
          position: 'absolute', top: '13px', right: '12px',
          fontSize: '9px', fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: cfg.accent,
          background: `${cfg.accent}18`,
          padding: '2px 7px', borderRadius: '20px',
        }}>
          {cfg.badge}
        </div>
      )}

      {/* Checkmark */}
      {isSelected && (
        <div style={{
          position: 'absolute', top: '13px', right: '12px',
          width: '18px', height: '18px', borderRadius: '50%',
          background: cfg.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1.5 4L3.8 6.5L8.5 1.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* Label */}
      <div style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '10px', fontWeight: 600, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: isSelected ? cfg.activeText : cfg.accent,
        marginBottom: '10px', marginTop: '4px',
      }}>
        {cfg.label}
      </div>

      {/* Price */}
      <div style={{
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: isSoldOut ? '16px' : '24px',
        letterSpacing: '-0.02em', lineHeight: 1,
        color: isSoldOut ? mutedColor : textColor,
        textDecoration: isSoldOut ? 'line-through' : 'none',
        marginBottom: isSoldOut ? 0 : '3px',
      }}>
        {isSoldOut ? 'Sold out' : `₹${fc.price?.toLocaleString('en-IN')}`}
      </div>

      {!isSoldOut && (
        <div style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '11px', color: mutedColor, marginBottom: '12px',
        }}>
          per seat
        </div>
      )}

      {/* Descriptor + seats */}
      <div style={{
        marginTop: 'auto',
        borderTop: `1px solid ${sepColor}`,
        paddingTop: '10px',
      }}>
        <div style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '11px', color: mutedColor, lineHeight: 1.5,
          marginBottom: !isSoldOut ? '5px' : 0,
        }}>
          {cfg.descriptor}
        </div>
        {!isSoldOut && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '11px',
            color: lowSeats ? '#B45309' : mutedColor,
            fontWeight: lowSeats ? 600 : 400,
          }}>
            {lowSeats && (
              <span className="animate-pulse" style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: '#F59E0B', display: 'inline-block', flexShrink: 0,
              }} />
            )}
            {lowSeats ? `Only ${fc.totalSeats} left` : `${fc.totalSeats} seats`}
          </div>
        )}
      </div>
    </button>
  );
}
