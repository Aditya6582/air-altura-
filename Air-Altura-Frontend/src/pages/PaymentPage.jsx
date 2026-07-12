import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useBlocker, useBeforeUnload, Navigate } from 'react-router-dom';
import { Plane, Clock, Users, Armchair, CalendarDays } from 'lucide-react';
import api from '../api';

const CLASS_LABELS = {
  'economy':         'Economy',
  'premium-economy': 'Premium Economy',
  'business':        'Business',
  'first-class':     'First Class',
};

const CLASS_ACCENTS = {
  'economy':         { color: '#7A8B94', bg: 'rgba(122,139,148,0.1)'  },
  'premium-economy': { color: '#C8754E', bg: 'rgba(200,117,78,0.1)'   },
  'business':        { color: '#0E3B4D', bg: 'rgba(14,59,77,0.1)'     },
  'first-class':     { color: '#C4994A', bg: 'rgba(196,153,74,0.1)'   },
};

const PAYMENT_WINDOW_MS = 10 * 60 * 1000;

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDuration(dep, arr) {
  if (!dep || !arr) return '';
  const mins = Math.round((new Date(arr) - new Date(dep)) / 60000);
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
}

function getRemainingSeconds(createdAt) {
  const elapsed = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, Math.floor((PAYMENT_WINDOW_MS - elapsed) / 1000));
}

export default function PaymentPage() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  const booking    = state?.booking;
  const flight     = state?.flight;
  const totalCost  = state?.totalCost;
  const travellers = state?.travellers;
  const seatClass  = state?.seatClass || 'economy';

  const [idempotencyKey]            = useState(() => crypto.randomUUID());
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [confirmed, setConfirmed]   = useState(false);
  const [expired, setExpired]       = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    booking?.createdAt ? getRemainingSeconds(booking.createdAt) : 600
  );

  useEffect(() => {
    if (!booking?.createdAt || confirmed || expired) return;
    const id = setInterval(() => {
      const remaining = getRemainingSeconds(booking.createdAt);
      setSecondsLeft(remaining);
      if (remaining === 0) setExpired(true);
    }, 1000);
    return () => clearInterval(id);
  }, [booking?.createdAt, confirmed, expired]);

  const blocker = useBlocker(!confirmed && !expired);
  useBeforeUnload(useCallback(() => !confirmed && !expired, [confirmed, expired]));

  async function handleCancelAndLeave() {
    setCancelling(true);
    try { await api.post('/booking/cancel', { bookingId: booking.id }); } catch {}
    finally { setCancelling(false); blocker.proceed?.(); }
  }

  async function handlePayment() {
    setError(null);
    setLoading(true);
    try {
      await api.post('/booking/payment', { bookingId: booking.id, totalCost },
        { headers: { 'Idempotency-Key': idempotencyKey } }
      );
      setConfirmed(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!booking) return <Navigate to="/" replace />;

  /* ── Confirmed ────────────────────────────────────────────────── */
  if (confirmed) {
    const depCode = flight?.departureAirportId || '';
    const arrCode = flight?.arrivalAirportId   || '';
    const depCity = flight?.departureAirport?.City?.name || depCode;
    const arrCity = flight?.arrivalAirport?.City?.name   || arrCode;
    const cabin   = CLASS_ACCENTS[seatClass] || CLASS_ACCENTS.economy;

    return (
      <main className="min-h-screen flex flex-col" style={{ backgroundColor: '#0A2230' }}>

        {/* Dark celebratory header */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-12 text-center select-none">
          {/* Animated plane icon */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: 'rgba(79,111,238,0.18)', border: '2px solid rgba(79,111,238,0.4)' }}>
            <Plane size={26} style={{ color: '#4F6FEE' }} />
          </div>

          <span className="block font-body text-[11px] font-semibold tracking-[0.44em] uppercase mb-4 animate-fade-up"
            style={{ color: 'rgba(250,246,240,0.4)' }}>
            Booking confirmed · #{booking.id}
          </span>

          <h2 className="font-display font-normal text-[clamp(40px,7vw,80px)] tracking-tight leading-[1.05] text-white m-0 mb-3 animate-fade-up-1">
            You're on your way.
          </h2>

          <div className="flex items-center gap-4 mt-2 animate-fade-up-2">
            <span className="font-display text-[clamp(22px,4vw,36px)] tracking-tight" style={{ color: '#4F6FEE' }}>
              {depCode}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-px" style={{ backgroundColor: 'rgba(199,210,254,0.35)' }} />
              <Plane size={14} style={{ color: 'rgba(199,210,254,0.6)' }} />
              <div className="w-8 h-px" style={{ backgroundColor: 'rgba(199,210,254,0.35)' }} />
            </div>
            <span className="font-display text-[clamp(22px,4vw,36px)] tracking-tight" style={{ color: '#4F6FEE' }}>
              {arrCode}
            </span>
          </div>
          <p className="font-body text-[13px] mt-1.5 animate-fade-up-2" style={{ color: 'rgba(250,246,240,0.38)' }}>
            {depCity} to {arrCity}
          </p>
        </div>

        {/* Cream bottom panel */}
        <div className="bg-aa-cream">
          <div className="max-w-[640px] mx-auto px-5 sm:px-8 py-8">

            {/* Booking detail strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 bg-white border border-aa-mist rounded-xl p-5"
              style={{ borderTop: '3px solid #4F6FEE' }}>
              <div>
                <div className="font-body text-[10px] font-semibold tracking-[0.24em] uppercase mb-1" style={{ color: '#4F6FEE' }}>
                  Booking
                </div>
                <div className="font-body text-sm font-semibold text-aa-ink">#{booking.id}</div>
              </div>
              <div>
                <div className="flex items-center gap-1 font-body text-[10px] font-semibold tracking-[0.24em] uppercase mb-1" style={{ color: '#C8754E' }}>
                  <Armchair size={10} /> Cabin
                </div>
                <div className="font-body text-sm font-semibold px-2 py-0.5 rounded-[4px] inline-block"
                  style={{ color: cabin.color, backgroundColor: cabin.bg }}>
                  {CLASS_LABELS[seatClass] || seatClass}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1 font-body text-[10px] font-semibold tracking-[0.24em] uppercase mb-1" style={{ color: '#0E3B4D' }}>
                  <Users size={10} /> Seats
                </div>
                <div className="font-body text-sm text-aa-ink">{travellers}</div>
              </div>
              <div>
                <div className="font-body text-[10px] font-semibold tracking-[0.24em] uppercase mb-1 text-aa-slate">
                  Total paid
                </div>
                <div className="font-display text-[20px] tracking-tight leading-none" style={{ color: '#C8754E' }}>
                  ₹{Number(totalCost).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl mb-5"
              style={{ backgroundColor: '#DCFCE7', border: '1px solid #86EFAC' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#22C55E' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="white"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="font-body text-[11px] font-semibold tracking-[0.16em] uppercase" style={{ color: '#16A34A' }}>
                  Confirmation email sent
                </div>
                <div className="font-body text-[11px]" style={{ color: '#15803D' }}>
                  Check your inbox — booking details &amp; e-ticket attached.
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex-1 font-body text-sm font-medium text-aa-slate bg-transparent border border-aa-mist rounded-full px-4 py-3 cursor-pointer hover:border-aa-slate transition-colors duration-200"
              >
                Search more flights
              </button>
              <button
                onClick={() => navigate('/bookings')}
                className="flex-1 text-white font-body text-sm font-semibold py-3 rounded-full border-none cursor-pointer hover:opacity-85 transition-opacity duration-300"
                style={{ backgroundColor: '#4F6FEE' }}
              >
                View my bookings →
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ── Expired ──────────────────────────────────────────────────── */
  if (expired) {
    return (
      <main className="bg-aa-cream min-h-screen flex items-center justify-center px-5">
        <div className="max-w-[480px] w-full text-center animate-fade-up">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#FEE2E2', border: '2px solid #FCA5A5' }}>
            <Clock size={22} style={{ color: '#DC2626' }} />
          </div>
          <span className="block font-body text-[11px] font-semibold tracking-[0.36em] uppercase mb-3"
            style={{ color: '#DC2626' }}>
            Booking expired
          </span>
          <h2 className="font-display font-normal text-[36px] tracking-tight text-aa-horizon m-0 mb-3">
            Your time ran out.
          </h2>
          <p className="font-body text-sm text-aa-slate mb-2">
            Booking #{booking.id} has been cancelled and your seats have been released.
          </p>
          <p className="font-body text-sm text-aa-slate mb-8">
            You can search again and start a new booking.
          </p>
          <button
            onClick={() => navigate('/')}
            className="text-white font-body text-sm font-semibold px-8 py-3 rounded-full border-none cursor-pointer hover:opacity-85 transition-opacity duration-300"
            style={{ backgroundColor: '#4F6FEE' }}
          >
            Search flights
          </button>
        </div>
      </main>
    );
  }

  /* ── Payment screen ───────────────────────────────────────────── */
  const depCode  = flight?.departureAirportId || '';
  const arrCode  = flight?.arrivalAirportId   || '';
  const depCity  = flight?.departureAirport?.City?.name || depCode;
  const arrCity  = flight?.arrivalAirport?.City?.name   || arrCode;
  const duration = formatDuration(flight?.departureTime, flight?.arrivalTime);
  const cabin    = CLASS_ACCENTS[seatClass] || CLASS_ACCENTS.economy;
  const isOneStop = flight?.stopType === 'ONE_STOP';

  const timerUrgent  = secondsLeft < 60;
  const timerWarning = secondsLeft < 120;
  const timerColor   = timerUrgent ? '#DC2626' : timerWarning ? '#B45309' : '#16A34A';
  const timerBg      = timerUrgent ? '#FEE2E2' : timerWarning ? '#FEF3C7' : '#DCFCE7';
  const timerBorder  = timerUrgent ? '#FCA5A5' : timerWarning ? '#FCD34D' : '#86EFAC';

  return (
    <>
      {/* Leave confirmation modal */}
      {blocker.state === 'blocked' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(10,34,48,0.6)' }}>
          <div className="bg-white rounded-2xl px-8 py-8 max-w-[420px] w-full mx-6 animate-fade-up"
            style={{ boxShadow: '0 24px 64px rgba(14,59,77,0.25)', borderTop: '3px solid #EF4444' }}>
            <span className="block font-body text-[11px] font-semibold tracking-[0.32em] uppercase mb-3"
              style={{ color: '#DC2626' }}>
              Cancel booking?
            </span>
            <h3 className="font-display font-normal text-[26px] tracking-tight text-aa-horizon m-0 mb-3">
              Leave this page?
            </h3>
            <p className="font-body text-sm text-aa-slate mb-6 leading-relaxed">
              Booking #{booking.id} will be cancelled and your reserved seats released.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => blocker.reset?.()}
                className="flex-1 font-body text-sm font-semibold text-aa-ink bg-transparent border border-aa-mist rounded-full px-4 py-3 cursor-pointer hover:border-aa-slate transition-colors duration-200"
              >
                Stay &amp; pay
              </button>
              <button
                onClick={handleCancelAndLeave}
                disabled={cancelling}
                className="flex-1 text-white font-body text-sm font-semibold px-4 py-3 rounded-full border-none cursor-pointer hover:opacity-85 transition-opacity duration-200 disabled:opacity-60"
                style={{ backgroundColor: '#EF4444' }}
              >
                {cancelling ? 'Cancelling…' : 'Cancel booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="bg-aa-cream min-h-screen">
        <div className="max-w-[960px] mx-auto px-5 sm:px-8 pt-8 pb-8">

          {/* Page header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <span className="block font-body text-[11px] font-semibold tracking-[0.36em] uppercase mb-1.5 animate-fade-up"
                style={{ color: '#4F6FEE' }}>
                Payment
              </span>
              <h1 className="font-display font-normal text-[clamp(28px,4vw,40px)] tracking-tight leading-[1.1] text-aa-horizon m-0 animate-fade-up-1">
                Complete your booking.
              </h1>
            </div>
            {/* Booking ref chip */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0 mt-1"
              style={{ backgroundColor: 'rgba(79,111,238,0.09)', border: '1px solid rgba(79,111,238,0.22)' }}>
              <span className="font-body text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: '#4F6FEE' }}>
                Booking #{booking.id}
              </span>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_260px] gap-4">

            {/* Left: flight summary */}
            <div className="bg-white border border-aa-mist rounded-xl overflow-hidden animate-fade-up-2"
              style={{ borderTop: '3px solid #4F6FEE' }}>

              {/* Airport codes */}
              <div className="px-6 pt-5 pb-4 border-b border-aa-mist">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-body text-[10px] font-semibold tracking-[0.28em] uppercase" style={{ color: '#4F6FEE' }}>
                    Route
                  </span>
                  <span className="font-body text-[10px] font-semibold tracking-[0.12em] uppercase px-2 py-0.5 rounded-full"
                    style={isOneStop
                      ? { color: '#B45309', backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }
                      : { color: '#16A34A', backgroundColor: '#DCFCE7', border: '1px solid #86EFAC' }}>
                    {isOneStop ? '1 stop' : 'Direct'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-display text-[40px] tracking-tight leading-none" style={{ color: '#4F6FEE' }}>{depCode}</div>
                    <div className="font-body text-[12px] text-aa-ink font-medium mt-0.5">{depCity}</div>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1 pb-4">
                    <span className="font-body text-[10px] font-semibold tracking-wide" style={{ color: '#4F6FEE' }}>{duration}</span>
                    <div className="flex items-center w-full gap-1">
                      <div className="flex-1 h-px" style={{ backgroundColor: '#C7D2FE' }} />
                      <Plane size={12} style={{ color: '#4F6FEE' }} />
                      <div className="flex-1 h-px" style={{ backgroundColor: '#C7D2FE' }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-[40px] tracking-tight leading-none" style={{ color: '#4F6FEE' }}>{arrCode}</div>
                    <div className="font-body text-[12px] text-aa-ink font-medium mt-0.5">{arrCity}</div>
                  </div>
                </div>
              </div>

              {/* Times */}
              <div className="px-6 py-4 border-b border-aa-mist">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="font-display text-[30px] tracking-tight text-aa-ink leading-none">
                    {formatTime(flight?.departureTime)}
                  </span>
                  <span className="font-body text-base text-aa-mist">→</span>
                  <span className="font-display text-[30px] tracking-tight text-aa-ink leading-none">
                    {formatTime(flight?.arrivalTime)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-body text-[11px] text-aa-slate">
                  <CalendarDays size={11} style={{ color: '#F59E0B' }} />
                  {flight?.departureTime && new Date(flight.departureTime).toLocaleDateString('en-IN', {
                    weekday: 'long', day: 'numeric', month: 'long'
                  })}
                </div>
              </div>

              {/* Meta */}
              <div className="px-6 py-4 grid grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center gap-1 font-body text-[10px] font-semibold tracking-[0.22em] uppercase mb-1"
                    style={{ color: '#C8754E' }}>
                    <Armchair size={10} /> Cabin
                  </div>
                  <div className="font-body text-sm font-semibold px-2 py-0.5 rounded-[4px] inline-block"
                    style={{ color: cabin.color, backgroundColor: cabin.bg }}>
                    {CLASS_LABELS[seatClass] || seatClass}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 font-body text-[10px] font-semibold tracking-[0.22em] uppercase mb-1"
                    style={{ color: '#0E3B4D' }}>
                    <Users size={10} /> Seats
                  </div>
                  <div className="font-body text-sm text-aa-ink">{travellers}</div>
                </div>
                <div>
                  <div className="font-body text-[10px] font-semibold tracking-[0.22em] uppercase mb-1 text-aa-slate">
                    Aircraft
                  </div>
                  <div className="font-body text-sm text-aa-ink">
                    {flight?.airplaneDetails?.modelNumber || '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: payment action */}
            <div className="bg-white border border-aa-mist rounded-xl overflow-hidden flex flex-col animate-fade-up-2"
              style={{ borderTop: '3px solid #C8754E' }}>

              {/* Amount */}
              <div className="px-5 pt-5 pb-4 border-b border-aa-mist">
                <div className="font-body text-[10px] font-semibold tracking-[0.28em] uppercase mb-3"
                  style={{ color: '#C8754E' }}>
                  Amount due
                </div>
                <div className="font-display text-[36px] tracking-tight leading-none mb-1" style={{ color: '#C8754E' }}>
                  ₹{Number(totalCost).toLocaleString('en-IN')}
                </div>
                <div className="font-body text-[11px] text-aa-slate">
                  {travellers} seat{travellers > 1 ? 's' : ''} · {CLASS_LABELS[seatClass] || seatClass}
                </div>
              </div>

              {/* Timer */}
              <div className="px-5 py-4 border-b border-aa-mist">
                <div className="flex items-center gap-1.5 font-body text-[10px] font-semibold tracking-[0.22em] uppercase mb-2 text-aa-slate">
                  <Clock size={10} />
                  Time remaining
                </div>
                <div
                  className="font-display text-[38px] tracking-tight leading-none tabular-nums text-center py-2 rounded-xl transition-colors duration-500"
                  style={{ color: timerColor, backgroundColor: timerBg, border: `1px solid ${timerBorder}` }}
                >
                  {formatCountdown(secondsLeft)}
                </div>
                {timerUrgent && (
                  <p className="font-body text-[11px] text-center mt-2" style={{ color: '#DC2626' }}>
                    Complete payment now!
                  </p>
                )}
              </div>

              {/* CTA */}
              <div className="px-5 py-4 flex flex-col gap-3 mt-auto">
                {error && (
                  <p className="font-body text-[12px] rounded-lg px-3 py-2 m-0"
                    style={{ color: '#DC2626', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5' }}>
                    {error}
                  </p>
                )}
                <button
                  onClick={handlePayment}
                  disabled={loading || expired}
                  className="w-full text-white font-body text-[15px] font-semibold py-3.5 rounded-full border-none cursor-pointer transition-opacity duration-300 hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#4F6FEE' }}
                >
                  {loading ? 'Processing…' : `Pay ₹${Number(totalCost).toLocaleString('en-IN')} →`}
                </button>
                <p className="font-body text-[11px] text-center m-0" style={{ color: 'rgba(92,102,112,0.65)' }}>
                  Seats are held for you until the timer expires.
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
