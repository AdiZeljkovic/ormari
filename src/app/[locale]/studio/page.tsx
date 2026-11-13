import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/content/dict';
import { Studio } from '@/components/Studio';
import { fromQuery } from '@/lib/wardrobe';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Camera set-up for still renders: ?cam=az,el,zoom,tx,ty,tz,fov plus the usual configuration query. */
export default async function StudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const q = await searchParams;
  const one = (k: string) => (Array.isArray(q[k]) ? q[k]?.[0] : q[k]) as string | undefined;
  const n = (one('cam') ?? '').split(',').map(Number);
  const v = (i: number, d: number) => (Number.isFinite(n[i]) ? n[i] : d);
  const shot = { az: v(0, 0.3), el: v(1, 0.04), zoom: v(2, 1.1), target: [v(3, 0), v(4, 1.2), v(5, 0.3)] as [number, number, number], fov: v(6, 30) };
  return (
    <Studio
      config={fromQuery(q)}
      shot={shot}
      mood={one('mood') === 'soir' ? 'evening' : 'day'}
      open={one('open') === '1'}
      furnished={one('furn') !== '0'}
      clear={Number(one('clear') ?? 0) || 0}
      styled={one('style') === '1'}
    />
  );
}
