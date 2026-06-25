'use client';

import { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
}

export default function AnimatedCounter({
  value,
  duration = 800,
  decimals = 0,
  suffix = '',
  prefix = ''
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const startValue = 0;
    const endValue = value;

    if (endValue === 0) {
      setCount(0);
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      const currentValue = startValue + progress * (endValue - startValue);
      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {count.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })}
      {suffix}
    </span>
  );
}
