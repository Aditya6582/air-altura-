import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Plane, Users, Armchair, CalendarDays } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDuration(dep, arr) {
  if (!dep || !arr) return '';
  const mins = Math.round((new Date(arr) - new Date(dep)) / 60000);
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
}

export default function BookingPage() {
  const { state }       = useLocation();
  const navigate        = useNavigate();
  const { isLoggedIn }  = useAuth();

  const flight        = state?.flight;
  const travellers    = state?.travellers    || 1;
  const seatClass     = state?.seatClass     || 'economy';
  const selectedClass = state?.selectedClass;
  const pricePerSeat  = selectedClass?.price ?? flight?.price ?? 0;
  const totalCost     = state?.totalCost     ?? pricePerSeat * travellers;

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  if (!flight) return <Navigate to="/" replace />;

  if (!isLoggedIn) return (
    <Navigate to="/auth" replace state={{ returnTo: '/booking', returnState: state }} />
  );

  async function handleBook() {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/booking', {
        flightId:  flight.id,
        noofSeats: travellers,
        seatClass,
      });
      const booking = data.data;
      navigate('/payment', { state: { booking, flight, travellers, seatClass, totalCost } });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const depCity   = flight.departureAirport?.City?.name || flight.departureAirportId;
  const arrCity   = flight.arrivalAirport?.City?.name   || flight.arrivalAirportId;
  const depCode   = flight.departureAirportId;
  const arrCode   = flight.arrivalAirportId;
  const isOneStop = flight.stopType === 'ONE_STOP';
  const stop      = flight.FlightStops?.[0];
  const aircraft  = flight.airplaneDetails?.modelNumber || '—';
  const flightNum = flight.flightNumber || `#${flight.id}`;
  const duration  = formatDuration(flight.departureTime, flight.arrivalTime);
  const cabin     = CLASS_ACCENTS[seatClass] || CLASS_ACCENTS.economy;

  return (
    <main className="bg-aa-cream min-h-screen">
      <div className="max-w-[960px] mx-auto px-5 sm:px-8 pt-8 pb-8">

        {/* ── Compact page header ── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <span className="block font-body text-[11px] font-semibold tracking-[0.36em] uppercase mb-1.5 animate-fade-up"
              style={{ color: '#4F6FEE' }}>
              Confirm booking
            </span>
            <h1 className="font-display font-normal text-[clamp(28px,4vw,40px)] tracking-tight leading-[1.1] text-aa-horizon m-0 animate-fade-up-1">
              Review your flight.
            </h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="font-body text-sm text-aa-slate bg-transparent border border-aa-mist rounded-full px-4 py-2 cursor-pointer hover:border-aa-slate transition-colors duration-200 shrink-0 mt-1"
          >
            ← Back
          </button>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_280px] gap-4">

          {/* ── Left: Flight info card ── */}
          <div className="bg-white border border-aa-mist rounded-xl overflow-hidden"
            style={{ borderTop: '3px solid #4F6FEE' }}>

            {/* Route header strip */}
            <div className="px-6 pt-5 pb-4 border-b border-aa-mist">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-body text-[10px] font-semibold tracking-[0.28em] uppercase"
                  style={{ color: '#4F6FEE' }}>Route</span>
                <span
                  className="font-body text-[10px] font-semibold tracking-[0.12em] uppercase px-2 py-0.5 rounded-full"
                  style={isOneStop
                    ? { color: '#B45309', backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }
                    : { color: '#16A34A', backgroundColor: '#DCFCE7', border: '1px solid #86EFAC' }}
                >
                  {isOneStop ? '1 stop' : 'Direct'}
                </span>
                <span className="font-body text-[10px] text-aa-slate/60 ml-auto">{flightNum}</span>
              </div>

              {/* Airport codes — large visual */}
              <div className="flex items-center gap-4">
                <div>
                  <div className="font-display text-[42px] tracking-tight leading-none" style={{ color: '#4F6FEE' }}>
                    {depCode}
                  </div>
                  <div className="font-body text-[12px] text-aa-ink font-medium mt-0.5">{depCity}</div>
                </div>

                <div className="flex-1 flex flex-col items-center gap-1 pb-4">
                  <span className="font-body text-[10px] font-semibold tracking-wide" style={{ color: '#4F6FEE' }}>
                    {duration}
                  </span>
                  <div className="flex items-center w-full gap-1">
                    <div className="flex-1 h-px" style={{ backgroundColor: '#C7D2FE' }} />
                    <Plane size={13} style={{ color: '#4F6FEE' }} />
                    <div className="flex-1 h-px" style={{ backgroundColor: '#C7D2FE' }} />
                  </div>
                  {isOneStop && stop && (
                    <span className="font-body text-[9px] font-semibold tracking-wide px-2 py-0.5 rounded-full"
                      style={{ color: '#B45309', backgroundColor: '#FEF3C7' }}>
                      via {stop.airportCode}
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <div className="font-display text-[42px] tracking-tight leading-none" style={{ color: '#4F6FEE' }}>
                    {arrCode}
                  </div>
                  <div className="font-body text-[12px] text-aa-ink font-medium mt-0.5">{arrCity}</div>
                </div>
              </div>
            </div>

            {/* Times + date */}
            <div className="px-6 py-4 border-b border-aa-mist">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="font-display text-[32px] tracking-tight text-aa-ink leading-none">
                  {formatTime(flight.departureTime)}
                </span>
                <span className="font-body text-base text-aa-mist">→</span>
                <span className="font-display text-[32px] tracking-tight text-aa-ink leading-none">
                  {formatTime(flight.arrivalTime)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-body text-[11px] text-aa-slate">
                <CalendarDays size={11} style={{ color: '#F59E0B' }} />
                {new Date(flight.departureTime).toLocaleDateString('en-IN', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                })}
              </div>
            </div>

            {/* Meta row */}
            <div className="px-6 py-4 grid grid-cols-3 gap-4">
              <div>
                <div className="flex items-center gap-1 font-body text-[10px] font-semibold tracking-[0.22em] uppercase mb-1"
                  style={{ color: '#4F6FEE' }}>
                  <Plane size={10} />
                  Aircraft
                </div>
                <div className="font-body text-sm text-aa-ink">{aircraft}</div>
              </div>
              <div>
                <div className="flex items-center gap-1 font-body text-[10px] font-semibold tracking-[0.22em] uppercase mb-1"
                  style={{ color: '#C8754E' }}>
                  <Armchair size={10} />
                  Cabin
                </div>
                <div className="font-body text-sm font-semibold px-2 py-0.5 rounded-[4px] inline-block"
                  style={{ color: cabin.color, backgroundColor: cabin.bg }}>
                  {CLASS_LABELS[seatClass] || seatClass}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1 font-body text-[10px] font-semibold tracking-[0.22em] uppercase mb-1"
                  style={{ color: '#0E3B4D' }}>
                  <Users size={10} />
                  Passengers
                </div>
                <div className="font-body text-sm text-aa-ink">{travellers}</div>
              </div>
            </div>
          </div>

          {/* ── Right: Fare summary + CTA ── */}
          <div className="bg-white border border-aa-mist rounded-xl overflow-hidden flex flex-col"
            style={{ borderTop: '3px solid #C8754E' }}>

            <div className="px-5 pt-5 pb-4 border-b border-aa-mist">
              <div className="font-body text-[10px] font-semibold tracking-[0.28em] uppercase mb-4"
                style={{ color: '#C8754E' }}>
                Fare summary
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="font-body text-[12px] text-aa-slate">Per seat</span>
                  <span className="font-body text-sm text-aa-ink font-medium">
                    ₹{pricePerSeat?.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-body text-[12px] text-aa-slate">
                    × {travellers} passenger{travellers > 1 ? 's' : ''}
                  </span>
                  <span className="font-body text-sm text-aa-ink font-medium">
                    {travellers}
                  </span>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="px-5 py-4 border-b border-aa-mist">
              <div className="flex justify-between items-end">
                <div>
                  <div className="font-body text-[10px] font-semibold tracking-[0.22em] uppercase text-aa-slate mb-0.5">
                    Total
                  </div>
                  <div className="font-body text-[11px] text-aa-slate/60">incl. all taxes</div>
                </div>
                <div className="font-display text-[30px] tracking-tight leading-none" style={{ color: '#C8754E' }}>
                  ₹{totalCost?.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="px-5 py-4 flex flex-col gap-3 mt-auto">
              {error && (
                <p className="font-body text-[12px] rounded-lg px-3 py-2"
                  style={{ color: '#DC2626', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5' }}>
                  {error}
                </p>
              )}
              <button
                onClick={handleBook}
                disabled={loading}
                className="w-full text-white font-body text-[15px] font-semibold py-3.5 rounded-full border-none cursor-pointer transition-opacity duration-300 hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#4F6FEE' }}
              >
                {loading ? 'Creating booking…' : 'Confirm booking →'}
              </button>
              <p className="font-body text-[11px] text-center m-0" style={{ color: 'rgba(92,102,112,0.7)' }}>
                Payment is collected on the next screen.
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
