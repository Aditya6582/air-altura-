import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlaneTakeoff, ArrowRight } from 'lucide-react';
import SearchWidget from '../components/SearchWidget';
import CountUp from '../components/CountUp';
import RotatingText from '../components/RotatingText';
import MarketingCarousel from '../components/MarketingCarousel';

const HERO_CITIES = ['Mumbai.', 'Delhi.', 'Bengaluru.', 'Hyderabad.', 'Kochi.', 'Kolkata.'];

const ALTURA_REASONS = [
  'zero hidden fees.',
  'cabin comfort above all.',
  'food worth the altitude.',
  'instant confirmation.',
  'on-time, every time.',
  'free cancellation.',
  '94.2% on-time departures.',
  'seats that feel like home.',
];

const FEATURED_ROUTES = [
  { from: 'BOM', to: 'DEL', fromCity: 'Mumbai',    toCity: 'Delhi'     },
  { from: 'BOM', to: 'BLR', fromCity: 'Mumbai',    toCity: 'Bengaluru' },
  { from: 'DEL', to: 'BLR', fromCity: 'Delhi',     toCity: 'Bengaluru' },
  { from: 'BOM', to: 'HYD', fromCity: 'Mumbai',    toCity: 'Hyderabad' },
  { from: 'DEL', to: 'MAA', fromCity: 'Delhi',     toCity: 'Chennai'   },
  { from: 'BLR', to: 'CCU', fromCity: 'Bengaluru', toCity: 'Kolkata'   },
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState({
    fromCode: '', toCode: '', tripDate: '', travellers: 1, priceMax: '',
    seatClass: 'economy', stopType: '',
  });

  function handleSearch() {
    const params = new URLSearchParams();
    if (search.fromCode && search.toCode) {
      params.set('trips',    `${search.fromCode}-${search.toCode}`);
      params.set('fromCode', search.fromCode);
      params.set('toCode',   search.toCode);
    }
    if (search.tripDate)   params.set('tripDate',   search.tripDate);
    if (search.travellers) params.set('travellers', search.travellers);
    if (search.priceMax)   params.set('price',      `0-${search.priceMax}`);
    if (search.seatClass)  params.set('seatClass',  search.seatClass);
    if (search.stopType)   params.set('stopType',   search.stopType);
    navigate(`/results?${params.toString()}`);
  }

  function pickRoute(from, to) {
    setSearch(s => ({ ...s, fromCode: from, toCode: to }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <main>

      {/* ── Hero — "Choose Air Altura for..." on the plane ── */}
      <section
        className="relative"
        style={{
          marginTop: '-64px',
          backgroundImage: [
            'linear-gradient(to bottom, rgba(10,44,60,0.65) 0%, rgba(10,34,48,0.94) 100%)',
            'url(/assets/plane_hero.webp)',
          ].join(', '),
          backgroundSize:     'cover',
          backgroundPosition: 'center 38%',
          backgroundColor:    '#0E3B4D',
        }}
      >
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: 'linear-gradient(rgba(250,246,240,1) 1px, transparent 1px), linear-gradient(90deg, rgba(250,246,240,1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="max-w-[1100px] mx-auto px-5 sm:px-8 pt-28 sm:pt-36 pb-14 sm:pb-24 relative select-none">

          {/* Eyebrow */}
          <span className="block font-body text-[11px] font-medium tracking-[0.44em] uppercase text-white/30 mb-6 animate-fade-up">
            The Altura Difference
          </span>

          {/* "Choose Air Altura / for [rotating reason]" — identical to the dark section below */}
          <div style={{ minHeight: 'clamp(120px, 18vw, 220px)', marginBottom: '28px' }}>
            <h1 className="font-display font-normal text-[clamp(36px,6vw,80px)] tracking-tight leading-[1.12] text-white m-0 animate-fade-up-1">
              Choose Air Altura
            </h1>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0 mt-1 animate-fade-up-2">
              <span
                className="font-display font-normal tracking-tight leading-[1.12]"
                style={{ fontSize: 'clamp(36px, 6vw, 80px)', color: 'rgba(250,246,240,0.32)' }}
              >
                for
              </span>
              <RotatingText
                items={ALTURA_REASONS}
                interval={2800}
                style={{
                  fontFamily:    'Fraunces, Georgia, serif',
                  fontSize:      'clamp(36px, 6vw, 80px)',
                  fontWeight:    400,
                  letterSpacing: '-0.025em',
                  lineHeight:    1.12,
                  color:         '#C8754E',
                }}
              />
            </div>
          </div>

          {/* Search widget */}
          <div className="animate-fade-up-3">
            <SearchWidget values={search} onChange={setSearch} onSubmit={handleSearch} />
          </div>
        </div>
      </section>

      {/* ── Light content ─────────────────────────────────────── */}
      <div className="bg-aa-cream">

        {/* Marketing carousel */}
        <section className="max-w-[1100px] mx-auto px-5 sm:px-8 pt-10 pb-4">
          <span className="block font-body text-[11px] font-medium tracking-[0.32em] uppercase text-aa-slate mb-5">
            The Altura Experience
          </span>
          <MarketingCarousel />
        </section>

        {/* Popular routes */}
        <section className="max-w-[1100px] mx-auto px-5 sm:px-8 pt-8 pb-2">
          <span className="block font-body text-[11px] font-medium tracking-[0.32em] uppercase text-aa-slate mb-4">
            Popular routes
          </span>
          <div>
            {FEATURED_ROUTES.map((r, i) => (
              <button
                key={i}
                onClick={() => pickRoute(r.from, r.to)}
                className="w-full text-left bg-transparent border-none cursor-pointer group select-none"
              >
                <div className={[
                  'grid items-center py-3.5 transition-colors duration-150',
                  'border-t border-aa-mist group-hover:bg-aa-horizon/3',
                  i === FEATURED_ROUTES.length - 1 ? 'border-b' : '',
                ].join(' ')}
                style={{ gridTemplateColumns: '100px 1fr auto' }}>
                  <div className="flex items-center gap-2">
                    <span className="font-body text-[11px] font-medium tracking-[0.15em] text-aa-slate">{r.from}</span>
                    <PlaneTakeoff size={10} className="text-aa-mist" />
                    <span className="font-body text-[11px] font-medium tracking-[0.15em] text-aa-slate">{r.to}</span>
                  </div>
                  <div className="font-display text-[16px] sm:text-[18px] tracking-tight text-aa-ink">
                    {r.fromCity}
                    <span className="text-aa-mist mx-2 font-body text-sm">→</span>
                    {r.toCity}
                  </div>
                  <ArrowRight size={13} className="text-aa-mist group-hover:text-aa-horizon group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </button>
            ))}
          </div>
        </section>

      </div>

      {/* ── "Fly to" — same dark treatment, rotating destinations ── */}
      <section className="select-none" style={{ backgroundColor: '#0A2230' }}>
        <div className="max-w-[1100px] mx-auto px-5 sm:px-8 py-14 sm:py-20">
          <span className="block font-body text-[11px] font-medium tracking-[0.44em] uppercase mb-8"
            style={{ color: 'rgba(250,246,240,0.28)' }}>
            Air Altura · Destinations
          </span>
          <div style={{ minHeight: 'clamp(100px, 14vw, 180px)' }}>
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-0">
              <span
                className="font-display font-normal tracking-tight leading-[1.12]"
                style={{ fontSize: 'clamp(42px, 7vw, 96px)', color: 'rgba(250,246,240,0.28)' }}
              >
                Fly to
              </span>
              <RotatingText
                items={HERO_CITIES}
                interval={2600}
                style={{
                  fontFamily:    'Fraunces, Georgia, serif',
                  fontSize:      'clamp(42px, 7vw, 96px)',
                  fontWeight:    400,
                  letterSpacing: '-0.025em',
                  lineHeight:    1.12,
                  color:         '#FAF6F0',
                }}
              />
            </div>
          </div>
          <p className="font-body text-[13px] sm:text-[14px] leading-[1.8] m-0 mt-4"
            style={{ color: 'rgba(250,246,240,0.35)' }}>
            10 airports · 90 routes · across the most important connections in Indian aviation.
          </p>
        </div>
      </section>

      {/* ── Stats — sits on cream after the dark section ── */}
      <div className="bg-aa-cream">
        <section className="border-t border-aa-mist">
          <div className="max-w-[1100px] mx-auto px-5 sm:px-8 py-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x divide-aa-mist gap-8 sm:gap-0">
              <div className="sm:pr-12">
                <div className="font-body text-[11px] font-medium tracking-[0.32em] uppercase text-aa-slate mb-3">On-time departure</div>
                <div className="font-display text-[40px] sm:text-[48px] tracking-tight text-aa-horizon leading-none mb-2">
                  <CountUp to={94} from={0} duration={2} delay={0.3} /><span className="text-[28px] sm:text-[32px]">.2%</span>
                </div>
                <p className="font-body text-[13px] text-aa-slate m-0">Across all scheduled routes</p>
              </div>
              <div className="sm:px-12 border-t sm:border-t-0 border-aa-mist pt-8 sm:pt-0">
                <div className="font-body text-[11px] font-medium tracking-[0.32em] uppercase text-aa-slate mb-3">Routes served</div>
                <div className="font-display text-[40px] sm:text-[48px] tracking-tight text-aa-horizon leading-none mb-2">
                  <CountUp to={90} from={0} duration={2} delay={0.5} />
                </div>
                <p className="font-body text-[13px] text-aa-slate m-0">Across 10 major Indian cities</p>
              </div>
              <div className="sm:pl-12 border-t sm:border-t-0 border-aa-mist pt-8 sm:pt-0">
                <div className="font-body text-[11px] font-medium tracking-[0.32em] uppercase text-aa-slate mb-3">Avg. trip rating</div>
                <div className="font-display text-[40px] sm:text-[48px] tracking-tight text-aa-horizon leading-none mb-2">
                  <CountUp to={4.8} from={0} duration={2} delay={0.7} /><span className="text-[24px] sm:text-[28px] ml-1">★</span>
                </div>
                <p className="font-body text-[13px] text-aa-slate m-0">Rated by verified passengers</p>
              </div>
            </div>
          </div>
        </section>
      </div>

    </main>
  );
}
