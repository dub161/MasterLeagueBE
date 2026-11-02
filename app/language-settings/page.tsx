'use client';

import { useLocale } from '@/lib/i18n/locale-context';
import { translations, Locale } from '@/lib/i18n/translations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageSelector } from '@/components/language-selector';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

type TranslationEntry = {
  key: string;
  section: string;
  fr: string;
  en: string;
  nl: string;
};

export default function LanguageSettingsPage() {
  const { t } = useLocale();

  // Flatten translations for table display
  const translationEntries: TranslationEntry[] = [];

  const sections = [
    { key: 'common', label: t('languageSettings.commonTerms') },
    { key: 'nav', label: t('languageSettings.navigation') },
    { key: 'dashboard', label: t('nav.dashboard') },
    { key: 'results', label: t('languageSettings.resultsPage') },
    { key: 'standings', label: t('languageSettings.standingsPage') },
    { key: 'cup', label: t('languageSettings.cupPage') },
    { key: 'teamLogos', label: t('common.teamLogos') },
    { key: 'teamManagement', label: t('languageSettings.teamManagementPage') },
    { key: 'upload', label: t('common.upload') },
    { key: 'languageSettings', label: t('common.languageSettings') },
  ];

  sections.forEach((section) => {
    const frSection = translations.fr[section.key as keyof typeof translations.fr];
    const enSection = translations.en[section.key as keyof typeof translations.en];
    const nlSection = translations.nl[section.key as keyof typeof translations.nl];

    if (frSection && typeof frSection === 'object') {
      Object.keys(frSection).forEach((subKey) => {
        translationEntries.push({
          key: `${section.key}.${subKey}`,
          section: section.label,
          fr: frSection[subKey as keyof typeof frSection] as string,
          en: enSection[subKey as keyof typeof enSection] as string,
          nl: nlSection[subKey as keyof typeof nlSection] as string,
        });
      });
    }
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('common.languageSettings')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('languageSettings.selectYourLanguage')}
          </p>
        </div>
        <LanguageSelector />
      </div>

      {/* Current Language Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('common.language')}</CardTitle>
          <CardDescription>
            {t('languageSettings.selectYourLanguage')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{t('common.selectLanguage')}:</span>
            <LanguageSelector />
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('languageSettings.comparisonTable')}</CardTitle>
          <CardDescription>
            {t('languageSettings.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] w-full rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-[250px]">{t('languageSettings.translationKey')}</TableHead>
                  <TableHead className="w-[150px]">{t('languageSettings.description')}</TableHead>
                  <TableHead className="w-[200px]">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">FR</Badge>
                      {t('languageSettings.french')}
                    </div>
                  </TableHead>
                  <TableHead className="w-[200px]">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">EN</Badge>
                      {t('languageSettings.english')}
                    </div>
                  </TableHead>
                  <TableHead className="w-[200px]">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">NL</Badge>
                      {t('languageSettings.dutch')}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {translationEntries.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-xs">{entry.key}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.section}</Badge>
                    </TableCell>
                    <TableCell>{entry.fr}</TableCell>
                    <TableCell>{entry.en}</TableCell>
                    <TableCell>{entry.nl}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('common.success')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('common.language')} : <span className="font-semibold">{t('common.french')} / {t('common.english')} / {t('common.dutch')}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
