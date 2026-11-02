
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Récupérer toutes les équipes distinctes
export async function GET(request: NextRequest) {
  try {
    // Récupérer toutes les équipes uniques (domicile et extérieur)
    const homeTeams = await prisma.match.findMany({
      select: { equipedomicile: true },
      distinct: ['equipedomicile'],
    });
    
    const awayTeams = await prisma.match.findMany({
      select: { equipeexterieur: true },
      distinct: ['equipeexterieur'],
    });

    // Combiner et dédupliquer
    const teamsSet = new Set<string>();
    homeTeams.forEach((t: { equipedomicile: string | null }) => t.equipedomicile && teamsSet.add(t.equipedomicile));
    awayTeams.forEach((t: { equipeexterieur: string | null }) => t.equipeexterieur && teamsSet.add(t.equipeexterieur));

    const teams = Array.from(teamsSet).sort();

    return NextResponse.json({ teams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}
