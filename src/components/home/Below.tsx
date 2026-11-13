'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { dict } from '@/content/dict';
import { home, type AnatomyKey } from '@/content/home';
import {
  chf,
  computeLayout,
  computePrice,
  decor,
  DECORS,
  DEFAULT_CONFIG,
  DIM,
  RATES,
  TECH_RATE,
  toQuery,
  type Config,
  type Finish,
  type Locale,
} from '@/lib/wardrobe';
import { Elevation } from '../Elevation';
import { Lines, Reveal, Tape, Wordmark } from '../ui';

const FINISHES: Finish[] = ['mel', 'hpl', 'mdf'];
const FIRST: Record<Finish, string> = { mel: 'w980', hpl: 'hpl-w', mdf: 'r9016' };
const cfgHref = (locale: Locale, cfg: Config) => `/${locale}/configurateur?${toQuery(cfg)}`;

/** Eases a displayed number toward its target, so a price settles instead of jumping. */
function useTween(target: number) {
  const [v, setV] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    let raf = 0;
    const step = () => {
      const d = target - cur.current;
      if (Math.abs(d) < 0.006) {
        cur.current = target;
        setV(target);
        return;
      }
      cur.current += d * 0.2;
      setV(cur.current);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="eyebrow">
      <span aria-hidden="true" />
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ intro */

export function Intro({ locale }: { locale: Locale }) {
  const h = home[locale];
  return (
    <section className="intro wrap">
      <Lines lines={h.intro.text} as="p" className="intro__text" />
      <Reveal as="dl" className="intro__facts rise" threshold={0.3}>
        {h.intro.facts.map(([n, t], i) => (
          <div key={n} style={{ '--i': i } as CSSProperties}>
            <dt className="num" data-count={n}>
              {n}
            </dt>
            <dd>{t}</dd>
          </div>
        ))}
      </Reveal>
    </section>
  );
}

/* --------------------------------------------------- closed / open slider */

const COMPARE: Config = { ...DEFAULT_CONFIG, width: 1896, front: 'h3303' };

export function Compare({ locale }: { locale: Locale }) {
  const h = home[locale];
  const [pos, setPos] = useState(58);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const touched = useRef(false);
  const move = (clientX: number) => {
    touched.current = true;
    const r = box.current?.getBoundingClientRect();
    if (r) setPos(Math.min(96, Math.max(4, ((clientX - r.left) / r.width) * 100)));
  };
  // The first time the picture is in view, the handle sweeps once on its own: closed, open, rest.
  useEffect(() => {
    const el = box.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const keys: [number, number][] = [[0, 58], [0.3, 92], [0.78, 30], [1, 58]];
    const ease = (t: number) => t * t * (3 - 2 * t);
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now() + 900;
        const tick = (now: number) => {
          if (touched.current) return;
          const t = Math.min(1, Math.max(0, (now - t0) / 3200));
          const k = keys.findIndex(([at]) => at >= t);
          const [a, b] = [keys[Math.max(0, k - 1)], keys[Math.max(0, k)]];
          const f = b[0] === a[0] ? 1 : ease((t - a[0]) / (b[0] - a[0]));
          setPos(a[1] + (b[1] - a[1]) * f);
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.55 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <section className="cmp">
      <Reveal className="cmp__frame" threshold={0.2}>
        <div
          ref={box}
          className="cmp__box"
          style={{ '--pos': `${pos}%` } as CSSProperties}
          onPointerDown={(e) => {
            drag.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            move(e.clientX);
          }}
          onPointerMove={(e) => drag.current && move(e.clientX)}
          onPointerUp={() => (drag.current = false)}
          onPointerCancel={() => (drag.current = false)}
        >
          <Image src="/renders/cmp-open.jpg" alt={`${h.compare.open} — ${h.compare.caption}`} width={2400} height={1100} sizes="100vw" className="cmp__img" draggable={false} />
          <div className="cmp__top">
            <Image src="/renders/cmp-closed.jpg" alt={`${h.compare.closed} — ${h.compare.caption}`} width={2400} height={1100} sizes="100vw" className="cmp__img" draggable={false} />
          </div>
          <span className="cmp__label cmp__label--a">{h.compare.closed}</span>
          <span className="cmp__label cmp__label--b">{h.compare.open}</span>
          <div
            className="cmp__handle"
            role="slider"
            tabIndex={0}
            aria-label={h.compare.hint}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pos)}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
              touched.current = true;
              setPos((p) => Math.min(96, Math.max(4, p + (e.key === 'ArrowLeft' ? -4 : 4))));
            }}
          >
            <span>{h.compare.hint}</span>
          </div>
        </div>
      </Reveal>
      <div className="wrap cmp__cap">
        <p>{h.compare.caption}</p>
        <Link href={cfgHref(locale, COMPARE)} className="link link--arrow">
          {dict[locale].price.cta}
        </Link>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- models */

const MODELS: Record<string, { cfg: Config; img: string }> = {
  'simple-f': { cfg: { ...DEFAULT_CONFIG, width: 1442, front: 'h3303' }, img: 'm-simple-f' },
  'simple-v': { cfg: { ...DEFAULT_CONFIG, width: 989, front: 'u960', handle: 'bar', fit: 'visible', side: 'right' }, img: 'm-simple-v' },
  'tech-f': { cfg: { ...DEFAULT_CONFIG, width: 989, kind: 'tech', front: 'u702' }, img: 'm-tech-f' },
  'tech-v': { cfg: { ...DEFAULT_CONFIG, width: 989, kind: 'tech', front: 'h3176', fit: 'visible', side: 'left' }, img: 'm-tech-v' },
};

export function Models({ locale }: { locale: Locale }) {
  const d = dict[locale];
  const h = home[locale];
  return (
    <section className="models wrap" id="modeles">
      <header className="shead">
        <div>
          <Eyebrow>{h.models.eyebrow}</Eyebrow>
          <Lines lines={d.families.title} className="h1" />
        </div>
        <Reveal as="p" className="lead fade">
          {d.families.lead}
        </Reveal>
      </header>
      <div className="models__grid">
        {d.families.items.map((it, i) => {
          const m = MODELS[it.k];
          const layout = computeLayout(m.cfg);
          const x = decor(m.cfg.front);
          const rate = RATES[m.cfg.fit][x.group] + (m.cfg.kind === 'tech' ? TECH_RATE : 0);
          return (
            <Reveal key={it.k} as="article" className="model" style={{ '--i': i } as CSSProperties} threshold={0.15}>
              <Link href={cfgHref(locale, m.cfg)}>
                <div className="model__img">
                  <Image src={`/renders/${m.img}.jpg`} alt={`${it.name} — ${x.code} ${x.name[locale]}`} width={1200} height={1500} sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 25vw" data-parallax="" />
                  <div className="model__plan" aria-hidden="true">
                    <Elevation layout={layout} kind={m.cfg.kind} hatchLabel="" className="is-live" />
                  </div>
                </div>
                <div className="model__body">
                  <h3>{it.name}</h3>
                  <p>{it.t}</p>
                  <p className="model__foot">
                    <span className="num">
                      {d.families.from} CHF {chf(rate, false)} / m
                    </span>
                    <span className="model__go">{h.models.cta}</span>
                  </p>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ price */

export function Price({ locale }: { locale: Locale }) {
  const d = dict[locale];
  const h = home[locale];
  const [width, setWidth] = useState(1442);
  const [finish, setFinish] = useState<Finish>('mel');
  const cfg: Config = useMemo(() => ({ ...DEFAULT_CONFIG, width, front: FIRST[finish] }), [width, finish]);
  const layout = useMemo(() => computeLayout(cfg), [cfg]);
  const price = computePrice(cfg);
  const shown = useTween(price.total);
  return (
    <section className="pr dark" id="prix">
      <div className="wrap pr__grid">
        <div className="pr__copy">
          <Eyebrow>{h.price.eyebrow}</Eyebrow>
          <Lines lines={d.price.title} className="h1" />
          <Reveal as="p" className="lead fade">
            {d.price.lead}
          </Reveal>
          <div className="pr__finish">
            <span className="label">{d.price.finish}</span>
            <div className="seg" role="radiogroup" aria-label={d.price.finish}>
              {FINISHES.map((f) => (
                <button key={f} type="button" role="radio" aria-checked={finish === f} onClick={() => setFinish(f)}>
                  {d.finish[f]}
                  <small>{chf(RATES.fillers[f], false)} / m</small>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="pr__draw" aria-hidden="true">
          <Elevation layout={layout} kind="simple" className="is-live" />
        </div>
        <div className="pr__sum">
          <span className="label">{d.price.result}</span>
          <p className="pr__total num" aria-label={`CHF ${chf(price.total, false)}`}>
            <small>CHF</small>
            {chf(shown, false)}
          </p>
          <p className="pr__doors">{d.price.doors(layout.n, layout.doorW)}</p>
          <p className="pr__calc num">
            {price.metres.toFixed(3)} m × {chf(price.rate, false)}
          </p>
          <Link href={cfgHref(locale, cfg)} className="btn btn--tape">
            {d.price.cta}
          </Link>
        </div>
      </div>
      <div className="pr__tape">
        <output className="pr__width num">
          {width}
          <small>mm</small>
        </output>
        <Tape value={width} min={DIM.minW} max={DIM.maxW} onChange={setWidth} label={d.price.width} ppm={0.9} />
      </div>
      <p className="wrap note pr__note">{d.price.note}</p>
    </section>
  );
}

/* ---------------------------------------------------------------- anatomy */

const POINTS: [AnatomyKey, number, number][] = [
  ['band', 57.5, 9.2],
  ['rod', 35, 27.6],
  ['hinge', 29.7, 32.4],
  ['shelf', 54, 36.2],
  ['knob', 46.2, 57],
  ['filler', 69.9, 50],
  ['plinth', 55, 91.6],
];

export function Anatomy({ locale }: { locale: Locale }) {
  const h = home[locale];
  const [on, setOn] = useState<AnatomyKey | null>(null);
  return (
    <section className="ana wrap">
      <header className="shead">
        <div>
          <Eyebrow>{h.anatomy.eyebrow}</Eyebrow>
          <Lines lines={h.anatomy.title} className="h1" />
        </div>
        <Reveal as="p" className="lead fade">
          {h.anatomy.lead}
        </Reveal>
      </header>
      <div className="ana__grid">
        <Reveal as="figure" className="ana__fig blind" threshold={0.2}>
          <div className="blind__in">
            <Image src="/renders/ouvert-blanc.jpg" alt="" width={2000} height={1250} sizes="(max-width: 1000px) 100vw, 66vw" />
          </div>
          {POINTS.map(([k, x, y]) => (
            <button
              key={k}
              type="button"
              className="ana__dot"
              data-on={on === k ? '' : undefined}
              style={{ left: `${x}%`, top: `${y}%` }}
              aria-label={h.anatomy.points[k][0]}
              onMouseEnter={() => setOn(k)}
              onMouseLeave={() => setOn(null)}
              onFocus={() => setOn(k)}
              onBlur={() => setOn(null)}
            />
          ))}
        </Reveal>
        <Reveal as="ul" className="ana__list rise" threshold={0.2}>
          {POINTS.map(([k], i) => (
            <li key={k} data-on={on === k ? '' : undefined} style={{ '--i': i } as CSSProperties} onMouseEnter={() => setOn(k)} onMouseLeave={() => setOn(null)}>
              <b>{h.anatomy.points[k][0]}</b>
              <span>{h.anatomy.points[k][1]}</span>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- materials */

function isDark(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255) < 140;
}

export function Materials({ locale }: { locale: Locale }) {
  const d = dict[locale];
  const h = home[locale];
  const [id, setId] = useState('h3303');
  const cur = decor(id);
  return (
    <section className="mat dark" id="matieres">
      <div className="wrap">
        <header className="shead">
          <div>
            <Eyebrow>{h.materials.eyebrow}</Eyebrow>
            <Lines lines={d.materials.title} className="h1" />
          </div>
          <Reveal as="p" className="lead fade">
            {d.materials.lead}
          </Reveal>
        </header>

        <div className="mat__read" aria-live="polite">
          <p className="mat__name">
            <span className="num">{cur.code}</span>
            {cur.name[locale]}
          </p>
          <div className="mat__info">
            <p>
              <b>{d.materials.groups[cur.group]}</b> · <span className="num">CHF {chf(RATES.fillers[cur.group], false)} / m</span>
            </p>
            <p>{h.materials.desc[cur.group]}</p>
          </div>
        </div>

        <Reveal className="slats" threshold={0.15}>
          {FINISHES.map((g) => (
            <div className="slats__group" key={g} style={{ '--n': DECORS.filter((x) => x.group === g).length } as CSSProperties}>
              <p className="slats__label">{d.materials.groups[g]}</p>
              <div className="slats__row">
                {DECORS.filter((x) => x.group === g).map((x, i) => (
                  <Link
                    key={x.id}
                    href={cfgHref(locale, { ...DEFAULT_CONFIG, front: x.id })}
                    className={`slat${x.wood ? ' slat--wood' : ''}`}
                    style={{ '--c': x.hex, '--i': i } as CSSProperties}
                    data-dark={isDark(x.hex) ? '' : undefined}
                    data-on={x.id === id ? '' : undefined}
                    aria-label={`${x.code} ${x.name[locale]}`}
                    onMouseEnter={() => setId(x.id)}
                    onFocus={() => setId(x.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </Reveal>
        <p className="note note--inv">{d.materials.note}</p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- measure */

const U = 'M24 22H176V118H152V46H48V118H24Z';

function Glyph({ k }: { k: 'L' | 'P' | 'H' }) {
  return (
    <svg viewBox="0 0 200 140" className="glyph" aria-hidden="true">
      {k === 'H' ? (
        <>
          <path d="M24 14H176V26H24ZM24 26H48V122H24ZM152 26H176V122H152Z" className="glyph__wall" />
          <path d="M12 122H188" className="glyph__line" />
          <path d="M100 26V122M90 26H110M90 122H110" className="glyph__dim" />
        </>
      ) : (
        <>
          <path d={U} className="glyph__wall" />
          <path d="M48 118H152" className="glyph__dash" />
          {k === 'L' ? <path d="M48 84H152M48 74V94M152 74V94" className="glyph__dim" /> : <path d="M100 46V118M90 46H110M90 118H110" className="glyph__dim" />}
        </>
      )}
      <g transform={k === 'L' ? 'translate(100 84)' : k === 'P' ? 'translate(100 82)' : 'translate(100 74)'}>
        <rect x="-13" y="-13" width="26" height="26" className="glyph__chip" />
        <text y="5.5" textAnchor="middle" className="glyph__k">
          {k}
        </text>
      </g>
    </svg>
  );
}

/** Plan pictograms for the five measuring cases (the client's sheets T1–T5). */
function CaseGlyph({ k }: { k: string }) {
  const trap = k === 'T2' || k === 'T4';
  const shaft = k === 'T3' || k === 'T4';
  return (
    <svg viewBox="0 0 200 140" className="glyph" aria-hidden="true">
      {k === 'T5' ? <path d="M24 22H176V118H152V60L120 46H48V118H24Z" className="glyph__wall" /> : <path d={U} className="glyph__wall" />}
      <path d="M48 118H152" className="glyph__dash" />
      {shaft && <path d="M112 46H146V66H112Z" className="glyph__solid" />}
      {trap && <path d="M60 78H98V106H60Z" className="glyph__dash" />}
    </svg>
  );
}

export function Measure({ locale }: { locale: Locale }) {
  const d = dict[locale].measure;
  const h = home[locale];
  return (
    <section className="mes wrap" id="mesure">
      <header className="shead">
        <div>
          <Eyebrow>{h.measure.eyebrow}</Eyebrow>
          <Lines lines={d.title} className="h1" />
        </div>
        <Reveal as="p" className="lead fade">
          {d.lead}
        </Reveal>
      </header>
      <Reveal className="mes__dims rise" threshold={0.2}>
        {d.dims.map((x, i) => (
          <div key={x.k} className="mes__card" style={{ '--i': i } as CSSProperties}>
            <Glyph k={x.k as 'L' | 'P' | 'H'} />
            <h3>{x.name}</h3>
            <p>{x.t}</p>
          </div>
        ))}
      </Reveal>
      <div className="mes__cases">
        <Reveal as="p" className="h3 fade">
          {d.casesTitle}
        </Reveal>
        <Reveal as="ul" className="rise" threshold={0.2}>
          {d.cases.map((c, i) => (
            <li key={c.k} style={{ '--i': i } as CSSProperties}>
              <CaseGlyph k={c.k} />
              <span className="num">{c.k}</span>
              {c.t}
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- process */

export function Process({ locale }: { locale: Locale }) {
  const d = dict[locale];
  const h = home[locale];
  return (
    <section className="proc wrap">
      <header className="shead">
        <div>
          <Eyebrow>{h.process.eyebrow}</Eyebrow>
          <Reveal as="h2" className="h1 fade">
            {d.process.title}
          </Reveal>
        </div>
      </header>
      <Reveal as="ol" className="proc__steps" threshold={0.3}>
        {d.process.steps.map((s, i) => (
          <li key={s.k} style={{ '--i': i } as CSSProperties}>
            <h3>{s.k}</h3>
            <p>{s.t}</p>
          </li>
        ))}
      </Reveal>
      <Reveal className="proc__pros fade">
        <div id="pros">
          <h3>{d.pros.title}</h3>
          <p>{d.pros.t}</p>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------- closing + footer */

export function Closing({ locale }: { locale: Locale }) {
  const d = dict[locale];
  const h = home[locale];
  const [v, setV] = useState('');
  const n = Number(v);
  const ok = Number.isFinite(n) && n >= DIM.minW && n <= DIM.maxW;
  const href = cfgHref(locale, { ...DEFAULT_CONFIG, width: ok ? Math.round(n) : DEFAULT_CONFIG.width });
  return (
    <section className="end dark">
      <div className="wrap">
        <Eyebrow>{h.closing.eyebrow}</Eyebrow>
        <Reveal as="h2" className="h1 fade">
          <label htmlFor="niche-width">{d.closing.title}</label>
        </Reveal>
        <form
          className="end__form"
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = href;
          }}
        >
          <div className="end__mark">
            <span aria-hidden="true">mur</span>
            <span className="end__dim">
              <input
                id="niche-width"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="989"
                value={v}
                onChange={(e) => setV(e.target.value.replace(/\D/g, '').slice(0, 4))}
                aria-describedby="niche-hint"
              />
              <small>{d.closing.unit}</small>
            </span>
            <span aria-hidden="true">mur</span>
          </div>
          <div className="end__row">
            <p id="niche-hint" className="note">
              {d.closing.hint(DIM.minW, DIM.maxW)}
            </p>
            <button type="submit" className="btn btn--tape" disabled={v !== '' && !ok}>
              {d.closing.cta}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export function Footer({ locale }: { locale: Locale }) {
  const d = dict[locale];
  return (
    <footer className="foot2 dark">
      <div className="wrap foot2__in">
        <Wordmark />
        <p>{d.footer.line}</p>
        <p className="note">{d.footer.draft}</p>
      </div>
    </footer>
  );
}
