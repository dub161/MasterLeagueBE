
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getDisplayName } from '@/lib/team-normalizer';

export async function GET() {
  try {
    // Récupérer toutes les saisons uniques d'abord
    const saisons = await prisma.match.findMany({
      select: { saison: true },
      distinct: ['saison'],
      orderBy: { saison: 'desc' }
    });
    
    // Récupérer tous les matchs pour normaliser les noms
    const matches = await prisma.match.findMany({
      select: {
        equipedomicile: true,
        equipeexterieur: true,
        saison: true
      }
    });
    
    // Créer un ensemble de noms d'affichage uniques
    const equipesSet = new Set<string>();
    
    for (const match of matches) {
      const homeName = await getDisplayName(match.equipedomicile, match.saison);
      const awayName = await getDisplayName(match.equipeexterieur, match.saison);
      equipesSet.add(homeName);
      equipesSet.add(awayName);
    }
    
    const equipes = Array.from(equipesSet).sort();
    
    // Récupérer toutes les divisions uniques
    const divisions = await prisma.match.findMany({
      select: { division: true },
      distinct: ['division'],
      orderBy: { division: 'asc' }
    });
    
    return NextResponse.json({
      success: true,
      filters: {
        equipes,
        divisions: divisions.map(d => d.division).filter(Boolean).sort(),
        saisons: saisons.map(s => s.saison).filter(Boolean).sort()
      }
    });
    
  } catch (error) {
    console.error('Erreur récupération filtres:', error);
    return NextResponse.json({
      error: 'Erreur lors de la récupération des filtres',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
