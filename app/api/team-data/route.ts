import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getDisplayName, getOriginalNames } from '@/lib/team-normalizer';
import { 
  initializeTeamStats, 
  updateTeamStats, 
  compareTeamsWithHeadToHead, 
  updateHeadToHead,
  type TeamStats,
  type HeadToHeadMap
} from '@/lib/points-calculator';
import { deduplicateMatches } from '@/lib/match-deduplication';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamName = searchParams.get('team');
    const saison = searchParams.get('saison') || '2025-2026';

    if (!teamName) {
      return NextResponse.json(
        { error: 'Nom d\'équipe requis' },
        { status: 400 }
      );
    }

    // Get all possible names for this team
    const originalNames = await getOriginalNames(teamName, saison);
    const searchNames = [teamName, ...originalNames];

    // Get all matches for this team
    const rawMatches = await prisma.match.findMany({
      where: {
        saison,
        OR: [
          { equipedomicile: { in: searchNames } },
          { equipeexterieur: { in: searchNames } },
        ],
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Dédupliquer les matchs - garder uniquement le DERNIER match pour chaque paire d'équipes
    const allMatches = deduplicateMatches(rawMatches);

    // Format matches
    const matches = await Promise.all(
      allMatches.map(async (match) => {
        const isHome = searchNames.includes(match.equipedomicile);
        const opponent = isHome ? match.equipeexterieur : match.equipedomicile;
        const scoreFor = isHome ? match.scoredomicile : match.scoreexterieur;
        const scoreAgainst = isHome ? match.scoreexterieur : match.scoredomicile;

        return {
          id: match.id,
          date: match.date,
          opponent: await getDisplayName(opponent, saison),
          scoreFor,
          scoreAgainst,
          isHome,
          division: match.division,
          periode: match.periode,
        };
      })
    );

    // Divisions de phases finales de coupe (à exclure du championnat et des poules BEK)
    const PLAYOFF_DIVISIONS = ['Division CUP4', 'Division CUP2', 'Division CUP1', 'Division BEK4', 'Division BEK2', 'Division BEK1'];
    
    const isPlayoffDivision = (div: string) => PLAYOFF_DIVISIONS.includes(div);
    const isBekGroupDivision = (div: string) => div.startsWith('Division BEK') && !isPlayoffDivision(div);

    // Get championship division from first championship match (excluding BEK and playoff divisions)
    const championshipMatch = allMatches.find(m => m.division && !m.division.startsWith('Division BEK') && !isPlayoffDivision(m.division));
    const championshipDivision = championshipMatch ? championshipMatch.division : null;

    // Get BEK cup group division (excluding playoff divisions)
    const bekMatch = allMatches.find(m => m.division && isBekGroupDivision(m.division));
    const bekDivision = bekMatch ? bekMatch.division : null;
    
    // Get cup playoff matches for this team
    const cupPlayoffMatches = allMatches.filter(m => m.division && isPlayoffDivision(m.division));

    // Get championship standings if team plays in championship
    let championshipStandings = null;
    if (championshipDivision) {
      const championshipMatches = await prisma.match.findMany({
        where: {
          saison,
          division: championshipDivision,
        },
      });

      // Build standings
      const teamsMap = new Map();
      // Map pour stocker les confrontations directes
      const headToHeadMap: HeadToHeadMap = new Map();

      // Initialize all teams from all matches
      for (const match of championshipMatches) {
        const homeDisplay = await getDisplayName(match.equipedomicile, saison);
        const awayDisplay = await getDisplayName(match.equipeexterieur, saison);

        if (!teamsMap.has(homeDisplay)) {
          teamsMap.set(homeDisplay, initializeTeamStats(homeDisplay, true, true, false));
        }

        if (!teamsMap.has(awayDisplay)) {
          teamsMap.set(awayDisplay, initializeTeamStats(awayDisplay, true, true, false));
        }
      }

      // Calculate stats only for matches with scores
      for (const match of championshipMatches) {
        if (
          match.scoredomicile === null ||
          match.scoreexterieur === null ||
          match.scoredomicile === undefined ||
          match.scoreexterieur === undefined
        ) {
          continue;
        }

        const homeDisplay = await getDisplayName(match.equipedomicile, saison);
        const awayDisplay = await getDisplayName(match.equipeexterieur, saison);

        const homeTeam = teamsMap.get(homeDisplay);
        const awayTeam = teamsMap.get(awayDisplay);

        // Utiliser la fonction commune pour mettre à jour les statistiques
        updateTeamStats(homeTeam, true, match.scoredomicile, match.scoreexterieur);
        updateTeamStats(awayTeam, false, match.scoredomicile, match.scoreexterieur);
        
        // Mettre à jour les confrontations directes
        updateHeadToHead(headToHeadMap, homeDisplay, awayDisplay, match.scoredomicile, match.scoreexterieur);
      }

      championshipStandings = Array.from(teamsMap.values())
        .sort((a, b) => compareTeamsWithHeadToHead(a, b, headToHeadMap))
        .map((team, index) => ({
          ...team,
          rank: index + 1,
        }));
    }

    // Get BEK cup standings if team plays in BEK cup
    let bekStandings = null;
    let bekGroupe = null;
    if (bekDivision) {
      // Extract group letter from division name (e.g., "Division BEKA" -> "A")
      bekGroupe = bekDivision.replace('Division BEK', '');
      
      const bekMatches = await prisma.match.findMany({
        where: {
          saison,
          division: bekDivision,
        },
      });

      // Build BEK standings
      const bekTeamsMap = new Map();
      // Map pour stocker les confrontations directes BEK
      const bekHeadToHeadMap: HeadToHeadMap = new Map();

      // Initialize all teams from all matches
      for (const match of bekMatches) {
        const homeDisplay = await getDisplayName(match.equipedomicile, saison);
        const awayDisplay = await getDisplayName(match.equipeexterieur, saison);

        if (!bekTeamsMap.has(homeDisplay)) {
          bekTeamsMap.set(homeDisplay, initializeTeamStats(homeDisplay, true, true, true));
        }

        if (!bekTeamsMap.has(awayDisplay)) {
          bekTeamsMap.set(awayDisplay, initializeTeamStats(awayDisplay, true, true, true));
        }
      }

      // Calculate stats only for matches with scores
      for (const match of bekMatches) {
        if (
          match.scoredomicile === null ||
          match.scoreexterieur === null ||
          match.scoredomicile === undefined ||
          match.scoreexterieur === undefined
        ) {
          continue;
        }

        const homeDisplay = await getDisplayName(match.equipedomicile, saison);
        const awayDisplay = await getDisplayName(match.equipeexterieur, saison);

        const homeTeam = bekTeamsMap.get(homeDisplay);
        const awayTeam = bekTeamsMap.get(awayDisplay);

        // Utiliser la fonction commune pour mettre à jour les statistiques
        // Avec les mêmes règles que le championnat (3-1-2 au lieu de 2-1)
        updateTeamStats(homeTeam, true, match.scoredomicile, match.scoreexterieur);
        updateTeamStats(awayTeam, false, match.scoredomicile, match.scoreexterieur);
        
        // Mettre à jour les confrontations directes BEK
        updateHeadToHead(bekHeadToHeadMap, homeDisplay, awayDisplay, match.scoredomicile, match.scoreexterieur);
      }

      bekStandings = Array.from(bekTeamsMap.values()).sort((a, b) => 
        compareTeamsWithHeadToHead(a, b, bekHeadToHeadMap)
      );
    }

    // Build cup playoff data if the team participates
    let cupPlayoffs = null;
    if (cupPlayoffMatches.length > 0) {
      cupPlayoffs = await Promise.all(
        cupPlayoffMatches.map(async (match) => {
          const isHome = searchNames.includes(match.equipedomicile);
          let round = '';
          if (match.division?.includes('CUP4') || match.division?.includes('BEK4')) round = '1/4 Finale';
          else if (match.division?.includes('CUP2') || match.division?.includes('BEK2')) round = '1/2 Finale';
          else if (match.division?.includes('CUP1') || match.division?.includes('BEK1')) round = 'Finale';
          
          return {
            id: match.id,
            round,
            division: match.division,
            date: match.date,
            equipedomicile: await getDisplayName(match.equipedomicile, saison),
            equipeexterieur: await getDisplayName(match.equipeexterieur, saison),
            scoredomicile: match.scoredomicile,
            scoreexterieur: match.scoreexterieur,
            isHome,
          };
        })
      );
    }

    return NextResponse.json({
      teamName: await getDisplayName(teamName, saison),
      saison,
      matches,
      championship: {
        division: championshipDivision,
        standings: championshipStandings,
      },
      bekCup: {
        groupe: bekGroupe,
        standings: bekStandings,
      },
      cupPlayoffs,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des données',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
