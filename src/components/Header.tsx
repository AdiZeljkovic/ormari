'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { dict, LOCALES } from '@/content/dict';
import type { Locale } from '@/lib/wardrobe';
import { Wordmark } from './ui';

export function LangSwitch({ locale, path = '', query = '' }: { locale: Locale; path?: string; query?: string }) {
  return (
    <div className="lang" role="group" aria-label="Langue / Jezik">
      {LOCALES.map((l) => (
        <Link key={l} href={`/${l}${path}${query}`} aria-current={l === locale ? 'true' : undefined} hrefLang={l}>
          {l.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}

export function Header({ locale }: { locale: Locale }) {
  const d = dict[locale];
  const [solid, setSolid] = useState(false);
  const [dark, setDark] = useState(false);
  const [away, setAway] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const read = () => {
      raf = 0;
      const y = window.scrollY;
      setSolid(y > window.innerHeight * 0.6);
      // Take the colours of whatever section sits under the bar.
      let over = false;
      document.querySelectorAll('main > .dark, footer.dark').forEach((s) => {
        const r = s.getBoundingClientRect();
        if (r.top <= 36 && r.bottom >= 36) over = true;
      });
      setDark(over);
      // Step aside while reading down, come back on the way up.
      if (Math.abs(y - last) > 6) {
        setAway(y > last && y > window.innerHeight * 1.2);
        last = y;
      }
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', on, { passive: true });
    return () => {
      window.removeEventListener('scroll', on);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <header className={`head${solid ? ' head--solid' : ''}${dark ? ' head--dark' : ''}${away ? ' head--away' : ''}`}>
      <Link href={`/${locale}`} className="head__brand" aria-label="murmur">
        <Wordmark />
      </Link>
      <nav className="head__nav" aria-label="Navigation">
        <a href="#modeles">{d.nav.models}</a>
        <a href="#matieres">{d.nav.materials}</a>
        <a href="#mesure">{d.nav.measure}</a>
        <a href="#pros">{d.nav.pros}</a>
      </nav>
      <div className="head__end">
        <LangSwitch locale={locale} />
        <Link href={`/${locale}/configurateur`} className="btn btn--tape btn--sm">
          {d.nav.configure}
        </Link>
      </div>
    </header>
  );
}
