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
  type HeadToHeadMap,
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
    const saison = searchParams.get('saison') || '2025-2026';
    const groupId = searchParams.get('groupId');
    const nbResults = parseInt(searchParams.get('nbResults') || '3');

    // If groupId is specified, return standings for that group
    // Otherwise return all playoff group standings for the season
    const groups = groupId
      ? await prisma.playoffGroup.findMany({ where: { id: groupId } })
      : await prisma.playoffGroup.findMany({
          where: { saison },
          orderBy: { displayOrder: 'asc' },
        });

    if (groups.length === 0) {
      return NextResponse.json({
        success: true,
        playoffStandings: [],
        message: 'Aucun groupe de play-offs configuré pour cette saison',
      });
    }

    const playoffStandings = [];

    for (const group of groups) {
      if (!group.teams || group.teams.length === 0) {
        playoffStandings.push({
          group: {
            id: group.id,
            name: group.name,
            displayOrder: group.displayOrder,
            rankStart: group.rankStart,
            rankEnd: group.rankEnd,
            startDate: group.startDate,
            teams: group.teams,
          },
          standings: [],
          recentMatches: {},
          totalMatches: 0,
        });
        continue;
      }

      // Get all matches involving these teams for this season
      // We need to find matches where BOTH teams are in the playoff group
      const teamNames = group.teams;

      // Build OR conditions for each team name (they might appear as home or away)
      const allMatches = await prisma.match.findMany({
        where: {
          saison,
          OR: teamNames.flatMap((team: string) => [
            { equipedomicile: { contains: team, mode: 'insensitive' as const } },
            { equipeexterieur: { contains: team, mode: 'insensitive' as const } },
          ]),
          // Only matches after start date if specified
          ...(group.startDate ? { date: { gte: group.startDate } } : {}),
        },
        orderBy: { date: 'desc' },
      });

      // Filter: both teams must be in the playoff group (using display names)
      const playoffMatches = [];
      for (const match of allMatches) {
        const homeDisplay = await getDisplayName(match.equipedomicile, saison);
        const awayDisplay = await getDisplayName(match.equipeexterieur, saison);

        // Exclude BEK/CUP matches
        const div = match.division.toUpperCase();
        if (div.includes('BEK') || div.includes('CUP')) continue;

        // Exclude subdivision matches (e.g., "Division 2A", "Division 2B")
        // Playoff matches use the base division name (e.g., "Division 2")
        // Regular season subdivisions have a letter suffix
        if (/DIVISION\s+\d+[A-Z]/i.test(match.division)) continue;

        // Both teams must be in the group
        const homeInGroup = teamNames.some(
          (t: string) => t.toLowerCase() === homeDisplay.toLowerCase()
        );
        const awayInGroup = teamNames.some(
          (t: string) => t.toLowerCase() === awayDisplay.toLowerCase()
        );

        if (homeInGroup && awayInGroup) {
          playoffMatches.push({ ...match, homeDisplay, awayDisplay });
        }
      }

      // Deduplicate
      const deduplicated = deduplicateMatches(playoffMatches);

      // Separate scored and all matches
      const scoredMatches = deduplicated.filter(
        (m) => m.scoredomicile !== null && m.scoreexterieur !== null
      );

      // Calculate standings
      const teamsMap = new Map<string, TeamStats>();
      const teamMatchesMap = new Map<string, MatchResult[]>();
      const headToHeadMap: HeadToHeadMap = new Map();

      // Initialize all teams from the group
      for (const teamName of teamNames) {
        teamsMap.set(teamName, initializeTeamStats(teamName, true, true, false));
        teamMatchesMap.set(teamName, []);
      }

      // Calculate stats from scored matches
      for (const match of scoredMatches) {
        const homeTeam = match.homeDisplay;
        const awayTeam = match.awayDisplay;
        const homeScore = match.scoredomicile!;
        const awayScore = match.scoreexterieur!;

        const homeStats = teamsMap.get(homeTeam);
        const awayStats = teamsMap.get(awayTeam);
        if (!homeStats || !awayStats) continue;

        updateTeamStats(homeStats, true, homeScore, awayScore);
        updateTeamStats(awayStats, false, homeScore, awayScore);
        updateHeadToHead(headToHeadMap, homeTeam, awayTeam, homeScore, awayScore);

        // Determine results
        let homeResult: 'W' | 'D' | 'L' | 'F' = 'L';
        let awayResult: 'W' | 'D' | 'L' | 'F' = 'L';

        const isHomeForfeit = homeScore === 0 && awayScore === 20;
        const isAwayForfeit = homeScore === 20 && awayScore === 0;
        const isBothForfeit = homeScore === 0 && awayScore === 0;

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

        teamMatchesMap.get(homeTeam)?.push({
          date: match.date,
          opponent: awayTeam,
          scoreFor: homeScore,
          scoreAgainst: awayScore,
          result: homeResult,
          isHome: true,
        });

        teamMatchesMap.get(awayTeam)?.push({
          date: match.date,
          opponent: homeTeam,
          scoreFor: awayScore,
          scoreAgainst: homeScore,
          result: awayResult,
          isHome: false,
        });
      }

      // Sort by standings
      const standings = Array.from(teamsMap.values()).sort((a, b) =>
        compareTeamsWithHeadToHead(a, b, headToHeadMap)
      );

      const standingsWithRank = standings.map((team, index) => ({
        rank: group.rankStart + index,
        relativeRank: index + 1,
        ...team,
      }));

      // Recent matches
      const recentMatches: Record<string, MatchResult[]> = {};
      teamMatchesMap.forEach((matches, teamName) => {
        const sortedMatches = matches.sort(
          (a, b) => b.date.getTime() - a.date.getTime()
        );
        recentMatches[teamName] = sortedMatches.slice(0, nbResults);
      });

      playoffStandings.push({
        group: {
          id: group.id,
          name: group.name,
          displayOrder: group.displayOrder,
          rankStart: group.rankStart,
          rankEnd: group.rankEnd,
          startDate: group.startDate,
          teams: group.teams,
        },
        standings: standingsWithRank,
        recentMatches,
        totalMatches: scoredMatches.length,
      });
    }

    return NextResponse.json({
      success: true,
      playoffStandings,
      saison,
    });
  } catch (error) {
    console.error('Error fetching playoff standings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des classements play-offs',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
