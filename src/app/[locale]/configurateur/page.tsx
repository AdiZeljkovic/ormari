import { notFound } from 'next/navigation';
import { isLocale } from '@/content/dict';
import { Configurator } from '@/components/Configurator';
import { fromQuery } from '@/lib/wardrobe';

export default async function ConfiguratorPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const initial = fromQuery(await searchParams);
  return <Configurator locale={locale} initial={initial} />;
}
