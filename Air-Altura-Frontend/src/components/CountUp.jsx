import { useInView, useMotionValue, useSpring } from 'motion/react';
import { useCallback, useEffect, useRef } from 'react';

export default function CountUp({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 2,
  className = '',
  startWhen = true,
  separator = '',
  onStart,
  onEnd,
}) {
  const ref         = useRef(null);
  const motionValue = useMotionValue(direction === 'down' ? to : from);

  const damping   = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);
  const spring    = useSpring(motionValue, { damping, stiffness });
  const isInView  = useInView(ref, { once: true, margin: '0px' });

  const getDecimals = num => {
    const str = num.toString();
    if (str.includes('.')) {
      const d = str.split('.')[1];
      if (parseInt(d) !== 0) return d.length;
    }
    return 0;
  };

  const maxDecimals = Math.max(getDecimals(from), getDecimals(to));

  const format = useCallback(
    latest => {
      const opts = {
        useGrouping: !!separator,
        minimumFractionDigits: maxDecimals,
        maximumFractionDigits: maxDecimals,
      };
      const n = Intl.NumberFormat('en-US', opts).format(latest);
      return separator ? n.replace(/,/g, separator) : n;
    },
    [maxDecimals, separator]
  );

  useEffect(() => {
    if (ref.current) ref.current.textContent = format(direction === 'down' ? to : from);
  }, [from, to, direction, format]);

  useEffect(() => {
    if (!isInView || !startWhen) return;
    onStart?.();
    const t1 = setTimeout(() => motionValue.set(direction === 'down' ? from : to), delay * 1000);
    const t2 = setTimeout(() => onEnd?.(), delay * 1000 + duration * 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isInView, startWhen, motionValue, direction, from, to, delay, onStart, onEnd, duration]);

  useEffect(() => {
    return spring.on('change', latest => {
      if (ref.current) ref.current.textContent = format(latest);
    });
  }, [spring, format]);

  return <span className={className} ref={ref} />;
}
