import { useState, useEffect, useRef } from 'react';

/*
 * MarketingCarousel — full-width image carousel with cross-fade transitions.
 * Drop AI-generated images into /public/assets/ and update SLIDES below.
 * Auto-advances every 5 seconds. Pauses on hover.
 */

/*
 * SLIDES — swap image paths when AI-generated WebP images are ready.
 * Drop replacements into /public/assets/ with the same filenames.
 * Recommended: convert all to WebP via squoosh.app for ~30% smaller files.
 */
const SLIDES = [
  {
    image:    '/assets/carousel_service.webp',
    position: 'center 72%',
    tag:      'Cuisine at altitude',
    headline: 'The best meals shouldn\'t stay on the ground.',
    body:     'Regional menus curated fresh, served with the care the sky deserves.',
  },
  {
    image:    '/assets/plane_cabin.webp',
    position: 'center 30%',
    tag:      'The Altura Experience',
    headline: 'Every detail, considered.',
    body:     'From the first boarding call to the final landing — Air Altura lives in the details.',
  },
  {
    image:    '/assets/carousel_ahmedabad.webp',
    position: 'center 55%',
    tag:      'Ahmedabad · Atal Bridge',
    headline: 'India from above.',
    body:     'Ten cities. Ninety routes. The most important connections in Indian aviation.',
  },
  {
    image:    '/assets/carousel_delhi.webp',
    position: 'center 45%',
    tag:      'Delhi · Humayun\'s Tomb',
    headline: 'Built by emperors. Reached by Altura.',
    body:     'Sixteen centuries of Mughal grandeur sit quiet in the capital\'s dust. Fly direct — history is closer than you think.',
  },
  {
    image:    '/assets/carousel_chennai.webp',
    position: 'center 50%',
    tag:      'Chennai · Kapaleeshwara Temple',
    headline: 'Ancient gopurams, new horizons.',
    body:     'Dravidian stone, Carnatic rhythms, Marina mornings. Chennai runs deep — and Altura puts you right at its heart.',
  },
];

export default function MarketingCarousel() {
  const [current, setCurrent]   = useState(0);
  const [paused, setPaused]     = useState(false);
  const [fading, setFading]     = useState(false);
  const timeoutRef              = useRef(null);

  function goTo(next) {
    if (next === current) return;
    setFading(true);
    setTimeout(() => {
      setCurrent(next);
      setFading(false);
    }, 420);
  }

  useEffect(() => {
    if (paused) return;
    timeoutRef.current = setTimeout(() => {
      goTo((current + 1) % SLIDES.length);
    }, 5000);
    return () => clearTimeout(timeoutRef.current);
  }, [current, paused]);

  const slide = SLIDES[current];

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ height: 'clamp(280px, 45vw, 460px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background images — all pre-rendered, cross-fade via opacity */}
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 bg-cover transition-opacity duration-500"
          style={{
            backgroundImage:    `url(${s.image})`,
            backgroundPosition: s.position,
            opacity: i === current ? 1 : 0,
          }}
        />
      ))}

      {/* Gradient overlay — bottom-heavy so text is always readable */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, rgba(10,34,48,0.12) 0%, rgba(10,34,48,0.78) 100%)' }}
      />

      {/* Text content */}
      <div
        className="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 select-none"
        style={{
          transition: 'opacity 420ms cubic-bezier(0.25,0,0.1,1)',
          opacity: fading ? 0 : 1,
        }}
      >
        <span className="block font-body text-[11px] font-medium tracking-[0.36em] uppercase text-white/55 mb-3">
          {slide.tag}
        </span>
        <h2 className="font-display font-normal text-[clamp(22px,4vw,32px)] tracking-tight leading-[1.15] text-white m-0 mb-3 max-w-[520px]">
          {slide.headline}
        </h2>
        <p className="font-body text-[14px] leading-[1.7] text-white/65 m-0 max-w-[420px]">
          {slide.body}
        </p>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-6 right-10 flex items-center gap-2.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            style={{
              width:           i === current ? 20 : 6,
              height:          6,
              borderRadius:    3,
              background:      i === current ? '#FAF6F0' : 'rgba(250,246,240,0.35)',
              border:          'none',
              cursor:          'pointer',
              padding:         0,
              transition:      'width 300ms cubic-bezier(0.25,0,0.1,1), background 300ms',
            }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
