'use client';

import { Suspense } from "react";
import { ResultsContent } from "@/components/results-content";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Trophy } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";

export default function ResultsPage() {
  const { t } = useLocale();
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center mb-2">
              <Calendar className="h-8 w-8 mr-3 text-orange-600" />
              {t('results.title')}
            </h1>
            <p className="text-gray-600">
              {t('results.allResults')}
            </p>
          </div>
          <Link 
            href="/"
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center"
          >
            <Trophy className="h-4 w-4 mr-2" />
            {t('common.home')}
          </Link>
        </div>
      </div>

      {/* Contenu principal */}
      <Card>
        <CardHeader>
          <CardTitle>{t('results.title')}</CardTitle>
          <CardDescription>
            {t('results.filterBySaison')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          }>
            <ResultsContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
