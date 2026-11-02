

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { invalidateCache } from '@/lib/team-normalizer';

/**
 * POST - Invalider le cache des alias pour forcer la réapplication
 * Cela force tous les APIs à réappliquer les alias lors de la prochaine requête
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { saison } = body;

    // Invalider le cache pour la saison spécifiée (ou tout si non spécifié)
    invalidateCache(saison);

    return NextResponse.json({
      success: true,
      message: saison 
        ? `Cache invalidé pour la saison ${saison}. Les alias seront réappliqués lors de la prochaine requête.`
        : 'Cache global invalidé. Tous les alias seront réappliqués lors de la prochaine requête.'
    });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return NextResponse.json({
      error: 'Failed to invalidate cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
