'use client';

import { createElement, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

/** The wordmark: two walls and the dimension line between them. */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`wm ${className}`} role="img" aria-label="murmur">
      <span aria-hidden="true">mur</span>
      <span className="wm__dim" aria-hidden="true" />
      <span aria-hidden="true">mur</span>
    </span>
  );
}

/** Adds .is-in once the element enters the viewport. Motion itself lives in CSS. */
export function Reveal({
  as = 'div',
  className = '',
  children,
  style,
  threshold = 0.25,
}: {
  as?: string;
  className?: string;
  children?: ReactNode;
  style?: CSSProperties;
  threshold?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return createElement(as, { ref, className: `${className} reveal${seen ? ' is-in' : ''}`, style }, children);
}

/** Headline set line by line; each line rises out of its own mask. */
export function Lines({ lines, as = 'h2', className = '' }: { lines: string[]; as?: string; className?: string }) {
  return (
    <Reveal as={as} className={`lines ${className}`}>
      {lines.map((l, i) => (
        <span className="lines__row" key={i}>
          <span style={{ '--i': i } as CSSProperties}>{l}</span>
        </span>
      ))}
    </Reveal>
  );
}

/**
 * A measuring tape you drag. The value under the fixed marker is the width.
 * Keyboard: arrows ±1 mm, Shift+arrows ±10, PageUp/PageDown ±100.
 */
export function Tape({
  value,
  min,
  max,
  onChange,
  label,
  ppm = 0.5,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
  ppm?: number;
}) {
  const drag = useRef<{ x: number; v: number } | null>(null);
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v)));
  const from = Math.floor(min / 100) * 100 - 300;
  const to = Math.ceil(max / 100) * 100 + 300;
  const marks: number[] = [];
  for (let m = from; m <= to; m += 100) marks.push(m);

  return (
    <div
      className="tape"
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value} mm`}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, v: value };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        onChange(clamp(drag.current.v - (e.clientX - drag.current.x) / ppm));
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 10 : 1;
        const map: Record<string, number> = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: 100, PageDown: -100 };
        if (e.key in map) {
          e.preventDefault();
          onChange(clamp(value + map[e.key]));
        } else if (e.key === 'Home') onChange(min);
        else if (e.key === 'End') onChange(max);
      }}
    >
      <div
        className="tape__strip"
        style={{ width: (to - from) * ppm, transform: `translate3d(${-(value - from) * ppm}px,0,0)`, '--u': `${ppm}px` } as CSSProperties}
      >
        {marks.map((m) => (
          <span key={m} className="tape__num" style={{ left: (m - from) * ppm }}>
            {m}
          </span>
        ))}
      </div>
      <span className="tape__marker" aria-hidden="true" />
    </div>
  );
}
