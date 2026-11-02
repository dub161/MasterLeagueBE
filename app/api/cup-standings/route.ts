
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getDisplayName } from '@/lib/team-normalizer';
import { 
  initializeTeamStats, 
  updateTeamStats, 
  compareTeamsWithHeadToHead, 
  updateHeadToHead,
  type TeamStats,
  type HeadToHeadMap
} from '@/lib/points-calculator';
import { deduplicateMatches } from '@/lib/match-deduplication';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupe = searchParams.get('groupe');
    const saison = searchParams.get('saison') || '2025-2026';
    
    if (!groupe) {
      return NextResponse.json({
        error: 'Groupe parameter is required'
      }, { status: 400 });
    }

    // Construire le nom de la division
    const divisionName = `Division BEK${groupe.toUpperCase()}`;

    // Récupérer TOUS les matchs du groupe (avec ou sans scores) pour avoir toutes les équipes
    const rawMatches = await prisma.match.findMany({
      where: {
        division: divisionName,
        saison: saison
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Dédupliquer les matchs - garder uniquement le DERNIER match pour chaque paire d'équipes
    const allMatches = deduplicateMatches(rawMatches);

    // Séparer les matchs avec scores (pour les stats)
    const matches = allMatches.filter(match => 
      match.scoredomicile !== null && match.scoreexterieur !== null
    );

    // Calculer les statistiques pour chaque équipe avec noms normalisés
    const teamStatsMap = new Map<string, TeamStats>();
    // Map pour stocker les confrontations directes
    const headToHeadMap: HeadToHeadMap = new Map();

    // D'abord, initialiser TOUTES les équipes du groupe (même celles qui n'ont pas encore joué)
    for (const match of allMatches) {
      const homeTeam = await getDisplayName(match.equipedomicile, saison);
      const awayTeam = await getDisplayName(match.equipeexterieur, saison);

      if (!teamStatsMap.has(homeTeam)) {
        teamStatsMap.set(homeTeam, initializeTeamStats(homeTeam, true, true, true));
      }
      if (!teamStatsMap.has(awayTeam)) {
        teamStatsMap.set(awayTeam, initializeTeamStats(awayTeam, true, true, true));
      }
    }

    // Ensuite, calculer les stats uniquement pour les matchs avec scores
    for (const match of matches) {
      // Utiliser les noms d'affichage normalisés
      const homeTeam = await getDisplayName(match.equipedomicile, saison);
      const awayTeam = await getDisplayName(match.equipeexterieur, saison);
      const homeScore = match.scoredomicile!;
      const awayScore = match.scoreexterieur!;

      // Les équipes sont déjà initialisées, on récupère leurs stats
      const homeStats = teamStatsMap.get(homeTeam)!;
      const awayStats = teamStatsMap.get(awayTeam)!;

      // Utiliser la fonction commune pour mettre à jour les statistiques
      // Avec les mêmes règles que le championnat (3-1-2 au lieu de 2-1)
      updateTeamStats(homeStats, true, homeScore, awayScore);
      updateTeamStats(awayStats, false, homeScore, awayScore);
      
      // Mettre à jour les confrontations directes
      updateHeadToHead(headToHeadMap, homeTeam, awayTeam, homeScore, awayScore);
    }

    // Convertir en tableau et trier avec les confrontations directes
    const standings = Array.from(teamStatsMap.values()).sort((a, b) => 
      compareTeamsWithHeadToHead(a, b, headToHeadMap)
    );

    // Normaliser les noms dans TOUS les matchs retournés (avec ou sans scores)
    const normalizedMatches = await Promise.all(
      allMatches.map(async (m) => ({
        equipedomicile: await getDisplayName(m.equipedomicile, saison),
        equipeexterieur: await getDisplayName(m.equipeexterieur, saison),
        scoredomicile: m.scoredomicile,
        scoreexterieur: m.scoreexterieur,
        date: m.date
      }))
    );

    return NextResponse.json({
      success: true,
      groupe: groupe.toUpperCase(),
      saison,
      standings,
      matches: normalizedMatches
    });

  } catch (error) {
    console.error('Error fetching cup standings:', error);
    return NextResponse.json({
      error: 'Failed to fetch cup standings'
    }, { status: 500 });
  }
}
