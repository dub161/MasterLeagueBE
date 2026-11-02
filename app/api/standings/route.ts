

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

interface MatchResult {
  date: Date;
  opponent: string;
  scoreFor: number;
  scoreAgainst: number;
  result: 'W' | 'D' | 'L' | 'F';
  isHome: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const division = searchParams.get('division');
    const saison = searchParams.get('saison') || '2025-2026';
    const nbResults = parseInt(searchParams.get('nbResults') || '10');
    const beforeDate = searchParams.get('beforeDate'); // Exclude matches on or after this date
    
    if (!division) {
      return NextResponse.json({
        error: 'Division parameter is required'
      }, { status: 400 });
    }

    // Filtrer uniquement les divisions de championnat (1, 2, 3, 2A, 2B)
    // Exclure les divisions avec BEK ou CUP
    // Si la division contient déjà "Division", ne pas la doubler
    const divisionPattern = division.toLowerCase().includes('division') 
      ? division 
      : `Division ${division}`;
    
    // Pour "Division 2" exactement, on veut un match exact (pas 2A, 2B)
    // Pour les autres, "contains" fonctionne bien
    const needsExactMatch = /^(Division )?2$/i.test(division);
    
    // Récupérer TOUS les matchs de la division (avec ou sans scores) pour avoir toutes les équipes
    const allMatches = await prisma.match.findMany({
      where: {
        division: needsExactMatch
          ? { equals: divisionPattern, mode: 'insensitive' }
          : { contains: divisionPattern, mode: 'insensitive' },
        saison: saison,
        // Optionally exclude matches on or after a given date (used to exclude playoff-phase matches)
        ...(beforeDate ? { date: { lt: new Date(beforeDate) } } : {}),
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Filtrer pour exclure les matchs de coupe (BEK/CUP)
    const filteredMatches = allMatches.filter(match => {
      const div = match.division.toUpperCase();
      return !div.includes('BEK') && !div.includes('CUP');
    });

    // Dédupliquer les matchs - garder uniquement le DERNIER match pour chaque paire d'équipes
    const allChampionshipMatches = deduplicateMatches(filteredMatches);

    // Séparer les matchs avec scores (pour les stats) et tous les matchs (pour les équipes)
    const championshipMatches = allChampionshipMatches.filter(match => 
      match.scoredomicile !== null && match.scoreexterieur !== null
    );

    // Calculer les statistiques par équipe avec noms normalisés
    const teamsMap = new Map<string, TeamStats>();
    const teamMatches = new Map<string, MatchResult[]>();
    // Map pour stocker les confrontations directes
    const headToHeadMap: HeadToHeadMap = new Map();

    // D'abord, initialiser TOUTES les équipes de la division (même celles qui n'ont pas encore joué)
    for (const match of allChampionshipMatches) {
      const homeTeam = await getDisplayName(match.equipedomicile, saison);
      const awayTeam = await getDisplayName(match.equipeexterieur, saison);

      if (!teamsMap.has(homeTeam)) {
        teamsMap.set(homeTeam, initializeTeamStats(homeTeam, true, true, false));
        teamMatches.set(homeTeam, []);
      }
      if (!teamsMap.has(awayTeam)) {
        teamsMap.set(awayTeam, initializeTeamStats(awayTeam, true, true, false));
        teamMatches.set(awayTeam, []);
      }
    }

    // Ensuite, calculer les stats uniquement pour les matchs avec scores
    for (const match of championshipMatches) {
      // Utiliser les noms d'affichage normalisés
      const homeTeam = await getDisplayName(match.equipedomicile, saison);
      const awayTeam = await getDisplayName(match.equipeexterieur, saison);
      const homeScore = match.scoredomicile!;
      const awayScore = match.scoreexterieur!;

      // Les équipes sont déjà initialisées, on récupère leurs stats
      const homeStats = teamsMap.get(homeTeam)!;
      const awayStats = teamsMap.get(awayTeam)!;

      // Utiliser la fonction commune pour mettre à jour les statistiques
      updateTeamStats(homeStats, true, homeScore, awayScore);
      updateTeamStats(awayStats, false, homeScore, awayScore);
      
      // Mettre à jour les confrontations directes
      updateHeadToHead(headToHeadMap, homeTeam, awayTeam, homeScore, awayScore);

      // Déterminer le résultat pour l'affichage (W/D/L/F)
      let homeResult: 'W' | 'D' | 'L' | 'F' = 'L';
      let awayResult: 'W' | 'D' | 'L' | 'F' = 'L';

      const isHomeForfeit = (homeScore === 0 && awayScore === 20);
      const isAwayForfeit = (homeScore === 20 && awayScore === 0);
      const isBothForfeit = (homeScore === 0 && awayScore === 0);

      if (isBothForfeit) {
        homeResult = 'F';
        awayResult = 'F';
      } else if (isHomeForfeit) {
        homeResult = 'F';
        awayResult = 'W';
      } else if (isAwayForfeit) {
        homeResult = 'W';
        awayResult = 'F';
      } else if (homeScore > awayScore) {
        homeResult = 'W';
        awayResult = 'L';
      } else if (homeScore < awayScore) {
        homeResult = 'L';
        awayResult = 'W';
      } else {
        homeResult = 'D';
        awayResult = 'D';
      }

      // Enregistrer le résultat du match pour les N derniers matchs
      teamMatches.get(homeTeam)!.push({
        date: match.date,
        opponent: awayTeam,
        scoreFor: homeScore,
        scoreAgainst: awayScore,
        result: homeResult,
        isHome: true
      });

      teamMatches.get(awayTeam)!.push({
        date: match.date,
        opponent: homeTeam,
        scoreFor: awayScore,
        scoreAgainst: homeScore,
        result: awayResult,
        isHome: false
      });
    }

    // Convertir en tableau et trier en utilisant les confrontations directes
    const standings = Array.from(teamsMap.values()).sort((a, b) => 
      compareTeamsWithHeadToHead(a, b, headToHeadMap)
    );

    // Ajouter le rang
    const standingsWithRank = standings.map((team, index) => ({
      rank: index + 1,
      ...team
    }));

    // Récupérer les derniers matchs pour chaque équipe
    const recentMatches: Record<string, MatchResult[]> = {};
    teamMatches.forEach((matches, teamName) => {
      // Trier par date décroissante et prendre les N derniers
      const sortedMatches = matches.sort((a, b) => b.date.getTime() - a.date.getTime());
      recentMatches[teamName] = sortedMatches.slice(0, nbResults);
    });

    return NextResponse.json({
      success: true,
      standings: standingsWithRank,
      recentMatches,
      division,
      saison,
      totalMatches: championshipMatches.length
    });
    
  } catch (error) {
    console.error('Erreur récupération classement:', error);
    return NextResponse.json({
      error: 'Erreur lors de la récupération du classement',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
