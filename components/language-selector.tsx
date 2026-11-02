'use client';

import { useLocale } from '@/lib/i18n/locale-context';
import { Locale } from '@/lib/i18n/translations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Languages } from 'lucide-react';

export function LanguageSelector() {
  const { locale, setLocale, t } = useLocale();

  const languages: { value: Locale; label: string }[] = [
    { value: 'fr', label: t('common.french') },
    { value: 'en', label: t('common.english') },
    { value: 'nl', label: t('common.dutch') },
  ];

  return (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4 text-muted-foreground" />
      <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.value} value={lang.value}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
