'use client';

import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Wordmark } from '../ui';

/**
 * Scroll choreography for the home page, wired by attributes so the sections stay plain markup:
 *   [data-parallax]  image drifts inside its frame
 *   [data-count]     number counts up once, when first seen
 *   .dark            panel widens to full bleed as it enters
 *   .end__mark       the two "walls" move apart
 */
export function Motion() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
        gsap.fromTo(el, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
      });

      gsap.utils.toArray<HTMLElement>('main > .dark').forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: 'inset(0% 4.5% 0% 4.5%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 30%', scrub: true } },
        );
      });

      gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
        const end = Number(el.dataset.count);
        const o = { v: 0 };
        el.textContent = '0';
        gsap.to(o, {
          v: end,
          duration: 1.6,
          ease: 'power3.out',
          onUpdate: () => (el.textContent = String(Math.round(o.v))),
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });

      const mark = document.querySelector<HTMLElement>('.end__mark');
      if (mark) {
        gsap.fromTo(mark, { '--open': '14%' }, { '--open': '100%', ease: 'power2.out', scrollTrigger: { trigger: mark, start: 'top 92%', end: 'top 42%', scrub: 0.6 } });
      }

      const steps = document.querySelector<HTMLElement>('.proc__steps');
      if (steps) {
        gsap.fromTo(steps, { '--line': 0 }, { '--line': 1, ease: 'none', scrollTrigger: { trigger: steps, start: 'top 85%', end: 'top 40%', scrub: 0.5 } });
      }
    });
    return () => ctx.revert();
  }, []);
  return null;
}

let firstVisit: boolean | null = null;

/**
 * Opening: the wordmark's dimension line stretches, then the two halves part like doors.
 * Shown once per session; skipped for reduced motion.
 */
export function Opening() {
  const [state, setState] = useState<'hold' | 'open' | 'gone'>('hold');
  useEffect(() => {
    const root = document.documentElement;
    const done = () => {
      root.classList.add('is-ready');
      setState('gone');
    };
    // Decided once per page load, so a re-run of this effect cannot flip it.
    if (firstVisit === null) {
      try {
        firstVisit = sessionStorage.getItem('mm-opened') !== '1';
        sessionStorage.setItem('mm-opened', '1');
      } catch {
        firstVisit = true;
      }
    }
    const seen = !firstVisit;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      done();
      return;
    }
    if (seen) {
      // Already seen this session: just part the doors.
      const o = window.setTimeout(() => {
        setState('open');
        root.classList.add('is-ready');
      }, 60);
      const g = window.setTimeout(done, 1300);
      return () => {
        window.clearTimeout(o);
        window.clearTimeout(g);
      };
    }
    const a = window.setTimeout(() => {
      setState('open');
      root.classList.add('is-ready');
    }, 1750);
    const b = window.setTimeout(done, 3000);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);
  if (state === 'gone') return null;
  return (
    <div className="opening" data-state={state} aria-hidden="true">
      <span className="opening__half opening__half--l" />
      <span className="opening__half opening__half--r" />
      <Wordmark className="opening__mark" />
    </div>
  );
}
