'use client';

import Image from 'next/image';
import Link from 'next/link';
import { LanguageSelector } from './language-selector';
import { useLocale } from '@/lib/i18n/locale-context';

export function HeaderContent() {
  const { t } = useLocale();

  return (
    <header className="bg-gradient-to-r from-[#1e3a5f] via-[#2c5282] to-[#1e3a5f] shadow-lg border-b-4 border-orange-500">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-4 hover:opacity-90 transition-opacity flex-1">
            <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
              <Image
                src="/logos/masters-league.jpeg"
                alt="Masters League Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight">
                MASTERS LEAGUE
              </h1>
              <p className="text-amber-300 text-xs md:text-base font-medium mt-1">
                {t('common.subtitle')}
              </p>
            </div>
          </Link>
          
          <div className="flex-shrink-0">
            <LanguageSelector />
          </div>
        </div>
      </div>
    </header>
  );
}
