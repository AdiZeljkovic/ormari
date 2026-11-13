import type { Metadata, Viewport } from 'next';
import { Archivo } from 'next/font/google';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import '../globals.css';
import { dict, isLocale, LOCALES } from '@/content/dict';

const archivo = Archivo({
  subsets: ['latin', 'latin-ext'],
  axes: ['wdth'],
  variable: '--font',
  display: 'swap',
});

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const d = dict[isLocale(locale) ? locale : 'fr'];
  return { title: d.meta.title, description: d.meta.description };
}

export const viewport: Viewport = { themeColor: '#dcd9d3', width: 'device-width', initialScale: 1 };

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale} className={archivo.variable}>
      <body>{children}</body>
    </html>
  );
}
