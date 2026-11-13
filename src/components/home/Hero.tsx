'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { dict } from '@/content/dict';
import { computeLayout, DEFAULT_CONFIG, toQuery, type Config, type Locale } from '@/lib/wardrobe';

const Scene = dynamic(() => import('../three/Scene'), { ssr: false });

const HERO: Config = { ...DEFAULT_CONFIG, width: 1442, front: 'h3303', carcass: 'w960' };
const NO_DOORS: boolean[] = [];
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function Hero({ locale }: { locale: Locale }) {
  const d = dict[locale].hero;
  const root = useRef<HTMLElement>(null);
  const assembly = useRef(0);
  const [step, setStep] = useState(-1);
  const [paused, setPaused] = useState(false);
  const layout = useMemo(() => computeLayout(HERO), []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const proxy = { v: 0 };
    const apply = () => {
      const v = proxy.v;
      assembly.current = clamp01((v - 0.16) / 0.72);
      const a = assembly.current;
      setStep(v < 0.07 ? -1 : a <= 0.01 ? 0 : a < 0.38 ? 1 : a < 0.66 ? 2 : 3);
    };
    const tween = gsap.to(proxy, {
      v: 1,
      ease: 'none',
      onUpdate: apply,
      scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: reduce ? true : 0.7 },
    });
    const io = new IntersectionObserver(([e]) => setPaused(!e.isIntersecting), { rootMargin: '10% 0px' });
    io.observe(el);
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      io.disconnect();
    };
  }, []);

  return (
    <section className="hero" ref={root}>
      <div className="hero__sticky">
        <div className="hero__canvas">
          <Scene config={HERO} layout={layout} open={NO_DOORS} assembly={assembly} dims="width" paused={paused} />
        </div>

        <div className="hero__copy" data-off={step >= 0 ? '' : undefined}>
          <h1 className="display hero__title">
            {d.title.map((l, i) => (
              <span className="hero__line" key={i}>
                <span style={{ animationDelay: `${0.15 + i * 0.09}s` }}>{l}</span>
              </span>
            ))}
          </h1>
          <p className="lead hero__lead">{d.lead}</p>
          <div className="hero__actions">
            <Link href={`/${locale}/configurateur?${toQuery(HERO)}`} className="btn btn--tape">
              {d.cta}
            </Link>
            <a href="#mesure" className="link">
              {d.more}
            </a>
          </div>
        </div>

        <ol className="hero__steps" data-on={step >= 0 ? '' : undefined}>
          {d.steps.map((s, i) => (
            <li key={s.k} data-active={i === step ? '' : undefined} data-past={i < step ? '' : undefined}>
              <h2>{s.k}</h2>
              <p>{s.t}</p>
            </li>
          ))}
        </ol>

        <p className="hero__scroll" data-off={step >= 0 ? '' : undefined} aria-hidden="true">
          <span />
          {d.scroll}
        </p>
      </div>
    </section>
  );
}
