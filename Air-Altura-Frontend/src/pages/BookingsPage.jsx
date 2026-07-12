import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, ChevronDown, ChevronUp, Clock, Users, Armchair, CalendarDays, Hash } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

/* Status palette — vivid, not muted */
const STATUS_CONFIG = {
  booked:    { text: '#16A34A', bg: '#DCFCE7', border: '#86EFAC', dot: '#22C55E', label: 'Confirmed', leftBar: '#22C55E' },
  initiated: { text: '#B45309', bg: '#FEF3C7', border: '#FCD34D', dot: '#F59E0B', label: 'Pending',   leftBar: '#F59E0B' },
  cancelled: { text: '#DC2626', bg: '#FEE2E2', border: '#FCA5A5', dot: '#EF4444', label: 'Cancelled', leftBar: '#EF4444' },
};

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

function formatDate(iso, opts = {}) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', ...opts
  });
}

function formatDuration(dep, arr) {
  if (!dep || !arr) return '';
  const mins = Math.round((new Date(arr) - new Date(dep)) / 60000);
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
}

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.initiated;
  return (
    <span
      className="inline-flex items-center gap-1.5 font-body text-[11px] font-semibold tracking-[0.24em] uppercase px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ color: s.text, backgroundColor: s.bg, border: `1px solid ${s.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: s.dot }} />
      {s.label}
    </span>
  );
}

// ── Single booking card ──────────────────────────────────────────────────────
function BookingCard({ booking, onCancel }) {
  const [open, setOpen]             = useState(false);
  const [flight, setFlight]         = useState(null);
  const [flightLoading, setFLight]  = useState(false);
  const [confirmCancel, setConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const isCancelled = booking.status === 'cancelled';
  const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.initiated;

  async function handleToggle() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen && !flight && booking.flightId) {
      setFLight(true);
      try {
        const { data } = await api.get(`/flights/${booking.flightId}`);
        setFlight(data.data);
      } catch {
        // flight details unavailable — show what we have
      } finally {
        setFLight(false);
      }
    }
  }

  async function handleConfirmCancel() {
    setCancelling(true);
    try {
      await onCancel(booking.id);
    } finally {
      setCancelling(false);
      setConfirm(false);
    }
  }

  const isOneStop = flight?.stopType === 'ONE_STOP';
  const stop      = flight?.FlightStops?.[0];
  const depCity   = flight?.departureAirport?.City?.name || flight?.departureAirportId || '';
  const arrCity   = flight?.arrivalAirport?.City?.name   || flight?.arrivalAirportId   || '';
  const depCode   = flight?.departureAirportId || '';
  const arrCode   = flight?.arrivalAirportId   || '';

  return (
    <article
      className={[
        'bg-white border border-aa-mist rounded-xl overflow-hidden',
        'transition-[border-color,box-shadow] duration-300',
        isCancelled ? 'opacity-70' : open ? 'border-aa-slate shadow-sm' : 'hover:border-aa-slate',
      ].join(' ')}
      style={{ borderLeft: `4px solid ${cfg.leftBar}` }}
    >

      {/* ── Summary row ── */}
      <button
        onClick={handleToggle}
        className="w-full text-left bg-transparent border-none cursor-pointer p-0"
      >
        <div className="grid gap-4 items-center px-6 py-5" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto 28px' }}>

          {/* Flight label */}
          <div>
            {/* Booking ID chip */}
            <div className="inline-flex items-center gap-1.5 mb-2 px-2 py-0.5 rounded-[4px]"
              style={{ backgroundColor: 'rgba(79,111,238,0.09)', border: '1px solid rgba(79,111,238,0.2)' }}>
              <Hash size={9} style={{ color: '#4F6FEE' }} />
              <span className="font-body text-[10px] font-semibold tracking-[0.18em] uppercase" style={{ color: '#4F6FEE' }}>
                {booking.id}
              </span>
            </div>
            <div className={[
              'flex items-center gap-2 font-display text-xl tracking-[-0.025em] text-aa-horizon',
              isCancelled ? 'line-through decoration-aa-slate/50' : '',
            ].join(' ')}>
              <Plane size={15} className="shrink-0" style={{ color: '#4F6FEE' }} />
              Flight {booking.flightId || '—'}
            </div>
          </div>

          {/* Booked on */}
          <div>
            <div className="flex items-center gap-1 font-body text-[10px] font-medium tracking-[0.28em] uppercase mb-1.5" style={{ color: '#F59E0B' }}>
              <CalendarDays size={10} />
              Booked on
            </div>
            <div className="font-body text-sm text-aa-ink">{formatDate(booking.createdAt)}</div>
          </div>

          {/* Cabin */}
          <div>
            <div className="flex items-center gap-1 font-body text-[10px] font-medium tracking-[0.28em] uppercase mb-1.5" style={{ color: '#C8754E' }}>
              <Armchair size={10} />
              Cabin
            </div>
            <div className="font-body text-sm text-aa-ink">{CLASS_LABELS[booking.seatClass] || 'Economy'}</div>
          </div>

          {/* Seats */}
          <div>
            <div className="flex items-center gap-1 font-body text-[10px] font-medium tracking-[0.28em] uppercase mb-1.5" style={{ color: '#0E3B4D' }}>
              <Users size={10} />
              Seats
            </div>
            <div className="font-body text-sm text-aa-ink">{booking.noOfSeats}</div>
          </div>

          {/* Total */}
          <div>
            <div className="font-body text-[10px] font-medium tracking-[0.28em] uppercase mb-1.5 text-aa-slate">Total</div>
            <div className="font-display text-[20px] tracking-[-0.025em] text-aa-copper">
              ₹{Number(booking.totalCost).toLocaleString('en-IN')}
            </div>
          </div>

          {/* Status */}
          <StatusBadge status={booking.status} />

          {/* Chevron */}
          <div className="flex justify-end">
            {open
              ? <ChevronUp  size={16} style={{ color: '#4F6FEE' }} />
              : <ChevronDown size={16} className="text-aa-slate" />
            }
          </div>
        </div>
      </button>

      {/* ── Expanded detail panel ── */}
      {open && (
        <div className="border-t border-aa-mist px-6 pb-6 pt-5 animate-fade-up"
          style={{ backgroundColor: 'rgba(79,111,238,0.025)' }}>

          {flightLoading && (
            <p className="font-body text-sm text-aa-slate mb-4">Loading flight details…</p>
          )}

          {!flightLoading && flight && (
            <>
              {/* Route visualization */}
              <div className="mb-5">
                <div className="font-body text-[10px] font-semibold tracking-[0.32em] uppercase mb-3"
                  style={{ color: '#4F6FEE' }}>
                  Route
                </div>

                {isOneStop && stop ? (
                  <div className="flex items-center gap-0">
                    <JourneyNode time={flight.departureTime} code={depCode} city={depCity} align="left" />
                    <LegLine duration={formatDuration(flight.departureTime, stop.arrivalTime)} />
                    <JourneyNode time={stop.arrivalTime} code={stop.airportCode} city={stop.airportCode} align="center" isStop
                      depTime={stop.departureTime} layover={stop.layoverMins} />
                    <LegLine duration={formatDuration(stop.departureTime, flight.arrivalTime)} />
                    <JourneyNode time={flight.arrivalTime} code={arrCode} city={arrCity} align="right" />
                  </div>
                ) : (
                  <div className="flex items-center gap-0">
                    <JourneyNode time={flight.departureTime} code={depCode} city={depCity} align="left" />
                    <LegLine duration={formatDuration(flight.departureTime, flight.arrivalTime)} direct />
                    <JourneyNode time={flight.arrivalTime} code={arrCode} city={arrCity} align="right" />
                  </div>
                )}
              </div>

              {/* Flight meta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 pt-4 border-t border-aa-mist">
                <InfoCell label="Aircraft"  value={flight.airplaneDetails?.modelNumber || '—'} />
                <InfoCell label="Flight"    value={flight.flightNumber || `#${flight.id}`} />
                <InfoCell label="Date"      value={formatDate(flight.departureTime, { weekday: 'short' })} />
                <InfoCell label="Stop type" value={isOneStop ? '1 stop' : 'Direct'} accent={isOneStop ? '#F59E0B' : '#22C55E'} />
              </div>
            </>
          )}

          {!flightLoading && !flight && (
            <p className="font-body text-sm text-aa-slate mb-4">Flight details unavailable.</p>
          )}

          {/* Fare breakdown */}
          <div className="grid grid-cols-3 gap-5 pt-4 mt-4 border-t border-aa-mist">
            <InfoCell label="Per seat"   value={`₹${(Number(booking.totalCost) / booking.noOfSeats).toLocaleString('en-IN')}`} />
            <InfoCell label="Seats"      value={booking.noOfSeats} />
            <InfoCell label="Total paid" value={`₹${Number(booking.totalCost).toLocaleString('en-IN')}`} highlight />
          </div>

          {/* Cancel action */}
          {!isCancelled && (
            <div className="pt-4 mt-4 border-t border-aa-mist">
              {!confirmCancel ? (
                <button
                  onClick={() => setConfirm(true)}
                  className="font-body text-sm underline underline-offset-[3px] bg-transparent border-none cursor-pointer p-0 hover:opacity-70 transition-opacity duration-200"
                  style={{ color: '#DC2626' }}
                >
                  Cancel this booking
                </button>
              ) : (
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="font-body text-sm text-aa-ink">Are you sure? This cannot be undone.</span>
                  <button
                    onClick={handleConfirmCancel}
                    disabled={cancelling}
                    className="font-body text-sm font-semibold text-white px-4 py-1.5 rounded-full border-none cursor-pointer transition-opacity duration-200 disabled:opacity-60"
                    style={{ backgroundColor: '#EF4444' }}
                  >
                    {cancelling ? 'Cancelling…' : 'Yes, cancel'}
                  </button>
                  <button
                    onClick={() => setConfirm(false)}
                    className="font-body text-sm text-aa-slate underline bg-transparent border-none cursor-pointer p-0"
                  >
                    Keep booking
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

// ── Journey sub-components ───────────────────────────────────────────────────
function JourneyNode({ time, code, city, align, isStop, depTime, layover }) {
  const isCenter = align === 'center';
  const isRight  = align === 'right';
  return (
    <div className={`flex flex-col ${isCenter ? 'items-center' : isRight ? 'items-end' : 'items-start'} shrink-0`}>
      <div className="font-display text-[22px] tracking-[-0.025em] text-aa-ink leading-none">{formatTime(time)}</div>
      <div className="font-body text-xs font-semibold mt-0.5" style={{ color: '#4F6FEE' }}>{code}</div>
      <div className="font-body text-[10px] text-aa-slate">{city}</div>
      {isStop && layover && (
        <div className="mt-1.5 flex items-center gap-1 font-body text-[10px] px-2 py-0.5 rounded-full"
          style={{ color: '#B45309', backgroundColor: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <Clock size={9} />
          {layover}m layover
        </div>
      )}
      {isStop && depTime && (
        <div className="font-display text-[18px] tracking-[-0.025em] text-aa-slate leading-none mt-1">
          {formatTime(depTime)}
        </div>
      )}
    </div>
  );
}

function LegLine({ duration, direct }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1 px-3 min-w-[60px]">
      <span className="font-body text-[10px] tracking-wide" style={{ color: '#4F6FEE' }}>{duration}</span>
      <div className="flex items-center w-full gap-1">
        <div className="flex-1 h-px" style={{ backgroundColor: '#C7D2FE' }} />
        <Plane size={11} className="shrink-0" style={{ color: '#4F6FEE' }} />
        <div className="flex-1 h-px" style={{ backgroundColor: '#C7D2FE' }} />
      </div>
    </div>
  );
}

function InfoCell({ label, value, highlight, accent }) {
  return (
    <div>
      <div className="font-body text-[10px] font-semibold tracking-[0.28em] uppercase mb-1 text-aa-slate">{label}</div>
      {highlight ? (
        <div className="font-display text-[18px] tracking-[-0.025em] text-aa-copper">{value}</div>
      ) : accent ? (
        <span className="font-body text-sm font-semibold px-2 py-0.5 rounded-[4px]"
          style={{ color: accent === '#22C55E' ? '#16A34A' : '#B45309', backgroundColor: accent === '#22C55E' ? '#DCFCE7' : '#FEF3C7' }}>
          {value}
        </span>
      ) : (
        <div className="font-body text-sm text-aa-ink">{value}</div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const { token } = useAuth();
  const navigate  = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    async function fetchBookings() {
      try {
        const { data } = await api.get('/booking/my-bookings');
        setBookings(data.data || []);
      } catch {
        setError('Could not load bookings. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, [token]);

  async function handleCancel(bookingId) {
    await api.post('/booking/cancel', { bookingId });
    setBookings(bs => bs.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
  }

  return (
    <main className="bg-aa-cream min-h-screen pb-20">
      {/* Header */}
      <section className="max-w-[1100px] mx-auto px-5 sm:px-8 pt-14 pb-8 border-b border-aa-mist">
        <div className="flex items-center gap-2 mb-2">
          <Plane size={13} style={{ color: '#4F6FEE' }} />
          <span className="font-body text-[11px] font-semibold tracking-[0.32em] uppercase animate-fade-up"
            style={{ color: '#4F6FEE' }}>
            Your itinerary
          </span>
        </div>
        <h1 className="font-display font-normal text-[42px] tracking-[-0.025em] leading-[1.1] text-aa-horizon m-0 animate-fade-up-1">
          My Bookings
        </h1>
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <span className="font-body text-[11px] font-medium tracking-[0.2em] uppercase px-3 py-1 rounded-full"
            style={{ color: '#16A34A', backgroundColor: '#DCFCE7', border: '1px solid #86EFAC' }}>
            Confirmed
          </span>
          <span className="font-body text-[11px] font-medium tracking-[0.2em] uppercase px-3 py-1 rounded-full"
            style={{ color: '#B45309', backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}>
            Pending
          </span>
          <span className="font-body text-[11px] font-medium tracking-[0.2em] uppercase px-3 py-1 rounded-full"
            style={{ color: '#DC2626', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5' }}>
            Cancelled
          </span>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-[1100px] mx-auto px-5 sm:px-8 pt-6">
        {loading && <p className="font-body text-aa-slate text-center py-20">Loading your bookings…</p>}
        {error   && <p className="font-body text-sm text-center py-20" style={{ color: '#DC2626' }}>{error}</p>}

        {!loading && !error && bookings.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'rgba(79,111,238,0.08)', border: '1px solid rgba(79,111,238,0.18)' }}>
              <Plane size={28} style={{ color: '#4F6FEE' }} />
            </div>
            <p className="font-display text-2xl tracking-[-0.025em] text-aa-slate">No bookings yet.</p>
            <p className="font-body text-sm text-aa-slate mt-2 mb-6">Search for a flight and make your first booking.</p>
            <button
              onClick={() => navigate('/')}
              className="text-white font-body text-sm font-medium px-6 py-3 rounded-full border-none cursor-pointer transition-opacity duration-300 hover:opacity-85"
              style={{ backgroundColor: '#4F6FEE' }}
            >
              Search flights
            </button>
          </div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="flex flex-col gap-3">
            {bookings.map(booking => (
              <BookingCard key={booking.id} booking={booking} onCancel={handleCancel} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
