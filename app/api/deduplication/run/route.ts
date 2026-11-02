export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { deduplicateMatchesInDB } from '@/lib/deduplication-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { saison, division } = body;

    const result = await deduplicateMatchesInDB(saison, division);

    return NextResponse.json({
      success: true,
      message: result.duplicatesRemoved > 0
        ? `${result.duplicatesRemoved} doublon(s) supprimé(s) et archivé(s)`
        : 'Aucun doublon trouvé',
      ...result,
    });
  } catch (error) {
    console.error('Erreur déduplication:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la déduplication', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
