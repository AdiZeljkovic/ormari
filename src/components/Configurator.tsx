'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { dict } from '@/content/dict';
import {
  CARCASS_DECORS,
  chf,
  computeLayout,
  computePrice,
  decor,
  DECORS,
  DIM,
  RATES,
  STANDARD_WIDTHS,
  toQuery,
  type Bay,
  type Config,
  type Finish,
  type Locale,
} from '@/lib/wardrobe';
import type { Mood } from './three/Scene';
import { LangSwitch } from './Header';
import { Tape, Wordmark } from './ui';

const Scene = dynamic(() => import('./three/Scene'), { ssr: false });
const FINISHES: Finish[] = ['mel', 'hpl', 'mdf'];

function Swatches({ list, value, onPick, locale }: { list: typeof DECORS; value: string; onPick: (id: string) => void; locale: Locale }) {
  return (
    <div className="swatches" role="radiogroup">
      {list.map((x) => (
        <button
          key={x.id}
          type="button"
          role="radio"
          aria-checked={x.id === value}
          aria-label={`${x.code} ${x.name[locale]}`}
          title={`${x.code} · ${x.name[locale]}`}
          className={`swatch${x.wood ? ' swatch--wood' : ''}`}
          style={{ '--c': x.hex } as CSSProperties}
          onClick={() => onPick(x.id)}
        />
      ))}
    </div>
  );
}

export function Configurator({ locale, initial }: { locale: Locale; initial: Config }) {
  const d = dict[locale];
  const c = d.cfg;
  const [cfg, setCfg] = useState<Config>(initial);
  const [open, setOpen] = useState<boolean[]>([false, false, false, false]);
  const [dims, setDims] = useState(false);
  const [mood, setMood] = useState<Mood>('day');
  const [frontTick, setFrontTick] = useState(0);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  const layout = useMemo(() => computeLayout(cfg), [cfg]);
  const price = computePrice(cfg);
  const front = decor(cfg.front);
  const inside = decor(cfg.carcass);
  const query = toQuery(cfg);
  const anyOpen = open.slice(0, layout.n).some(Boolean);
  const set = (patch: Partial<Config>) => setCfg((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    window.history.replaceState(null, '', `?${query}`);
  }, [query]);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable: the address bar already holds the link */
    }
  };

  const setBay = (i: number, b: Bay) => {
    const next = [...layout.bays];
    next[i] = b;
    set({ bays: next });
  };

  const rows: [string, string][] = [
    [c.rows.niche, `${layout.width} × ${DIM.H} × ${DIM.D} mm`],
    [c.rows.carcass, `${layout.carcassW} × ${DIM.carcassD} mm`],
    [c.rows.doors, `${layout.n} × ${layout.doorW} × ${DIM.doorH} mm`],
    [layout.visible ? c.rows.visible : c.rows.fillers, layout.visible ? `${layout.visible === 'left' ? c.left : c.right} · ${c.rows.fillers.toLowerCase()} ${layout.fillerL || layout.fillerR} mm` : `${layout.fillerL} + ${layout.fillerR} mm`],
    [c.rows.fronts, `${d.finish[front.group]} · ${front.code} ${front.name[locale]}`],
    [c.rows.inside, `${inside.code} ${inside.name[locale]}`],
    [c.rows.handle, cfg.handle === 'knob' ? `${c.knob}, ${c.knobT.toLowerCase()}` : `${c.bar}, ${c.barT.toLowerCase()}`],
    [c.rows.hinges, `Blum CLIP top BLUMOTION · ${layout.n * 5}`],
    [c.rows.interior, layout.bays.map((b) => (b === 'hang' ? c.hang : c.shelves)).join(' · ')],
  ];
  if (cfg.kind === 'tech') rows.push([c.rows.hatch, c.hatchYes]);

  return (
    <div className="cfg">
      <div className="cfg__stage" data-mood={mood}>
        <Scene
          config={cfg}
          layout={layout}
          open={open}
          onToggleDoor={(i) => setOpen((o) => o.map((v, k) => (k === i ? !v : v)))}
          dims={dims ? 'all' : 'none'}
          mood={mood}
          interactive
          clear={0.85}
          frontTick={frontTick}
          fallback={c.no3d}
        />
        <div className="cfg__tools">
          <button type="button" onClick={() => setOpen(Array(4).fill(!anyOpen))} aria-pressed={anyOpen}>
            {anyOpen ? c.close : c.open}
          </button>
          <button type="button" onClick={() => setDims((v) => !v)} aria-pressed={dims}>
            {c.dims}
          </button>
          <button type="button" onClick={() => setFrontTick((v) => v + 1)}>
            {c.front}
          </button>
          <button type="button" onClick={() => setMood((m) => (m === 'day' ? 'evening' : 'day'))} aria-pressed={mood === 'evening'}>
            {mood === 'day' ? c.evening : c.day}
          </button>
        </div>
        <p className="cfg__hint">{c.hintDrag}</p>
      </div>

      <aside className="cfg__panel" data-lenis-prevent>
        <header className="cfg__top">
          <Link href={`/${locale}`} aria-label={c.back}>
            <Wordmark />
          </Link>
          <LangSwitch locale={locale} path="/configurateur" query={`?${query}`} />
        </header>

        <h1 className="h2 cfg__title">{c.title}</h1>

        <section className="opt">
          <h2>{c.niche}</h2>
          <div className="opt__width">
            <label htmlFor="cfg-width" className="label">
              {c.width}
            </label>
            <span className="opt__input num">
              <input
                id="cfg-width"
                inputMode="numeric"
                value={cfg.width}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/\D/g, '').slice(0, 4));
                  set({ width: n, doors: 0 });
                }}
                onBlur={() => set({ width: layout.width })}
              />
              mm
            </span>
          </div>
          <Tape value={layout.width} min={DIM.minW} max={DIM.maxW} onChange={(v) => set({ width: v, doors: 0 })} label={c.width} />
          <div className="chips" aria-label={c.standard}>
            <span className="label">{c.standard}</span>
            {STANDARD_WIDTHS[cfg.fit].map((w) => (
              <button key={w} type="button" className="chipbtn num" aria-pressed={layout.width === w} onClick={() => set({ width: w, doors: 0 })}>
                {w}
              </button>
            ))}
          </div>
          <p className="note">
            {c.fixed}. {c.fixedNote}
          </p>
        </section>

        <section className="opt">
          <h2>{c.fit}</h2>
          <div className="cards" role="radiogroup" aria-label={c.fit}>
            <button type="button" role="radio" aria-checked={cfg.fit === 'fillers'} onClick={() => set({ fit: 'fillers', doors: 0 })}>
              <svg viewBox="0 0 64 40" aria-hidden="true"><path d="M2 4h6v32H2zM56 4h6v32h-6z" className="ico-wall" /><path d="M8 6h48v30H8zM12 6v30M52 6v30M32 6v30" className="ico-line" /></svg>
              <b>{c.fitFillers}</b>
              <small>{c.fitFillersT}</small>
            </button>
            <button type="button" role="radio" aria-checked={cfg.fit === 'visible'} onClick={() => set({ fit: 'visible', doors: 0 })}>
              <svg viewBox="0 0 64 40" aria-hidden="true"><path d="M2 4h6v32H2z" className="ico-wall" /><path d="M8 6h44v30H8zM12 6v30M31 6v30" className="ico-line" /><path d="M50 6h2v30h-2z" className="ico-solid" /></svg>
              <b>{c.fitVisible}</b>
              <small>{c.fitVisibleT}</small>
            </button>
          </div>
          {cfg.fit === 'visible' && (
            <div className="inline">
              <span className="label">{c.side}</span>
              <div className="seg seg--sm" role="radiogroup" aria-label={c.side}>
                <button type="button" role="radio" aria-checked={cfg.side === 'left'} onClick={() => set({ side: 'left' })}>{c.left}</button>
                <button type="button" role="radio" aria-checked={cfg.side === 'right'} onClick={() => set({ side: 'right' })}>{c.right}</button>
              </div>
            </div>
          )}
        </section>

        <section className="opt">
          <h2>{c.kind}</h2>
          <div className="cards" role="radiogroup" aria-label={c.kind}>
            <button type="button" role="radio" aria-checked={cfg.kind === 'simple'} onClick={() => set({ kind: 'simple', doors: 0 })}>
              <b>{c.simple}</b>
              <small>{c.simpleT}</small>
            </button>
            <button type="button" role="radio" aria-checked={cfg.kind === 'tech'} onClick={() => set({ kind: 'tech', doors: 0 })}>
              <b>{c.tech}</b>
              <small>
                {c.techT} · + {chf(120, false)} / m
              </small>
            </button>
          </div>
        </section>

        <section className="opt">
          <h2>{c.doors}</h2>
          <div className="seg" role="radiogroup" aria-label={c.doors}>
            {layout.validDoors.map((n) => {
              const l = computeLayout({ ...cfg, doors: n });
              return (
                <button key={n} type="button" role="radio" aria-checked={layout.n === n} onClick={() => set({ doors: n, bays: [] })}>
                  {n}
                  <small className="num">{l.doorW} mm</small>
                </button>
              );
            })}
          </div>
        </section>

        <section className="opt">
          <h2>{c.fronts}</h2>
          <div className="seg" role="radiogroup" aria-label={c.fronts}>
            {FINISHES.map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={front.group === f}
                onClick={() => front.group !== f && set({ front: DECORS.find((x) => x.group === f)!.id })}
              >
                {d.finish[f]}
                <small className="num">{chf(RATES[cfg.fit][f], false)} / m</small>
              </button>
            ))}
          </div>
          <Swatches list={DECORS.filter((x) => x.group === front.group)} value={cfg.front} onPick={(id) => set({ front: id })} locale={locale} />
          <p className="opt__picked">
            <b>{front.code}</b> {front.name[locale]}
          </p>
        </section>

        <section className="opt">
          <h2>{c.carcass}</h2>
          <Swatches list={CARCASS_DECORS} value={cfg.carcass} onPick={(id) => set({ carcass: id })} locale={locale} />
          <p className="opt__picked">
            <b>{inside.code}</b> {inside.name[locale]}
          </p>
        </section>

        <section className="opt">
          <h2>{c.handle}</h2>
          <div className="cards" role="radiogroup" aria-label={c.handle}>
            <button type="button" role="radio" aria-checked={cfg.handle === 'knob'} onClick={() => set({ handle: 'knob' })}>
              <svg viewBox="0 0 64 40" aria-hidden="true"><circle cx="32" cy="20" r="7" className="ico-line" /><circle cx="32" cy="20" r="2.5" className="ico-solid" /></svg>
              <b>{c.knob}</b>
              <small>{c.knobT}</small>
            </button>
            <button type="button" role="radio" aria-checked={cfg.handle === 'bar'} onClick={() => set({ handle: 'bar' })}>
              <svg viewBox="0 0 64 40" aria-hidden="true"><rect x="29.5" y="5" width="5" height="30" rx="2.5" className="ico-line" /></svg>
              <b>{c.bar}</b>
              <small>{c.barT}</small>
            </button>
          </div>
        </section>

        <section className="opt">
          <h2>{c.interior}</h2>
          <div className="bays" style={{ '--n': layout.n } as CSSProperties}>
            {layout.bays.map((b, i) => (
              <button key={i} type="button" className="bay" data-kind={b} onClick={() => setBay(i, b === 'hang' ? 'shelves' : 'hang')} aria-label={`${c.bay(i + 1)}: ${b === 'hang' ? c.hang : c.shelves}`}>
                <span className="bay__draw" aria-hidden="true" />
                <span>{b === 'hang' ? c.hang : c.shelves}</span>
              </button>
            ))}
          </div>
        </section>

        <footer className="cfg__bar">
          <div>
            <span className="label">{c.total}</span>
            <p className="cfg__calc num">
              {c.breakdown(price.metres.toFixed(3), chf(price.rate, false))}
              {price.tech > 0 && ` + ${c.techLine} ${chf(price.tech, false)}`}
            </p>
          </div>
          <p className="cfg__total num" aria-live="polite">
            <small>CHF</small>
            {chf(price.total, false)}
          </p>
          <button
            type="button"
            className="btn btn--tape cfg__book"
            onClick={() => {
              setSent(false);
              dialog.current?.showModal();
            }}
          >
            {c.book}
          </button>
        </footer>
      </aside>

      <dialog ref={dialog} className="sheetdlg" data-lenis-prevent aria-labelledby="dlg-title">
        <div className="sheetdlg__in">
          <div className="sheetdlg__head">
            <h2 id="dlg-title" className="h2">
              {c.summary}
            </h2>
            <button type="button" className="link" onClick={() => dialog.current?.close()}>
              {c.closeDialog}
            </button>
          </div>
          <table className="spec__table">
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k}>
                  <th scope="row">{k}</th>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="sheetdlg__price">
            <div>
              <span className="label">{c.total}</span>
              <p className="note">{c.indicative}</p>
            </div>
            <p className="cfg__total num">
              <small>CHF</small>
              {chf(price.total, false)}
            </p>
          </div>

          <h3 className="h3">{c.formTitle}</h3>
          <p className="note">{c.formLead}</p>
          {sent ? (
            <p className="sheetdlg__demo" role="status">
              {c.demo}
            </p>
          ) : (
            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <label>
                {c.name}
                <input name="name" autoComplete="name" required />
              </label>
              <label>
                {c.place}
                <input name="place" autoComplete="postal-code" required />
              </label>
              <label>
                {c.email}
                <input name="email" type="email" autoComplete="email" required />
              </label>
              <label>
                {c.phone}
                <input name="phone" type="tel" autoComplete="tel" />
              </label>
              <button type="submit" className="btn btn--tape">
                {c.send}
              </button>
            </form>
          )}
          <button type="button" className="link" onClick={share}>
            {copied ? c.copied : c.share}
          </button>
        </div>
      </dialog>
    </div>
  );
}
