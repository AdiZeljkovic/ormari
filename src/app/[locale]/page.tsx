import { notFound } from 'next/navigation';
import '../home.css';
import { isLocale } from '@/content/dict';
import { Header } from '@/components/Header';
import { SmoothScroll } from '@/components/SmoothScroll';
import { Hero } from '@/components/home/Hero';
import { Motion, Opening } from '@/components/home/Motion';
import { Anatomy, Closing, Compare, Footer, Intro, Materials, Measure, Models, Price, Process } from '@/components/home/Below';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <>
      <Opening />
      <SmoothScroll />
      <Motion />
      <Header locale={locale} />
      <main>
        <Hero locale={locale} />
        <Intro locale={locale} />
        <Compare locale={locale} />
        <Models locale={locale} />
        <Price locale={locale} />
        <Anatomy locale={locale} />
        <Materials locale={locale} />
        <Measure locale={locale} />
        <Process locale={locale} />
        <Closing locale={locale} />
      </main>
      <Footer locale={locale} />
    </>
  );
}
