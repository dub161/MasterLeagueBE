
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { findAllTeamNames } from '@/lib/team-normalizer';

// GET - Récupérer tous les noms d'équipes uniques pour une saison
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const saison = searchParams.get('saison');

    const teamNames = await findAllTeamNames(saison || undefined);

    return NextResponse.json({
      success: true,
      teams: teamNames
    });
  } catch (error) {
    console.error('Error fetching team names:', error);
    return NextResponse.json({
      error: 'Failed to fetch team names',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
