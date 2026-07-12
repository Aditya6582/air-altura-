import { useState, useEffect } from 'react';

/*
 * RotatingText — cycles through `items` with a slide-up/fade transition.
 * Inspired by React Bits style. Unhurried: 400ms ease per brand brief.
 */
export default function RotatingText({ items, interval = 3800, className = '', style = {} }) {
  const [index, setIndex]   = useState(0);
  const [phase, setPhase]   = useState('visible'); // 'visible' | 'exit' | 'enter'

  useEffect(() => {
    const id = setInterval(() => {
      setPhase('exit');
      setTimeout(() => {
        setIndex(i => (i + 1) % items.length);
        setPhase('enter');
        setTimeout(() => setPhase('visible'), 30);
      }, 380);
    }, interval);
    return () => clearInterval(id);
  }, [items.length, interval]);

  const motion = {
    visible: { opacity: 1,   transform: 'translateY(0px)'   },
    exit:    { opacity: 0,   transform: 'translateY(-12px)'  },
    enter:   { opacity: 0,   transform: 'translateY(12px)'   },
  };

  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        transition: 'opacity 380ms cubic-bezier(0.25,0,0.1,1), transform 380ms cubic-bezier(0.25,0,0.1,1)',
        ...motion[phase],
        ...style,
      }}
    >
      {items[index]}
    </span>
  );
}
