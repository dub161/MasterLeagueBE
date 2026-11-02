export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getDisplayName } from '@/lib/team-normalizer';
import { deduplicateMatches } from '@/lib/match-deduplication';

// Bracket structure (season-aware):
// Tree layout: QF[0]+QF[1] → SF[0], QF[2]+QF[3] → SF[1], SF[0] vs SF[1] → Final
//
// 2025-2026 and earlier: QF = BE, AD, CF, HG
// 2026-2027 onwards:     QF = HA, GB, FC, ED
function getQFBracket(saison: string): Array<{ groups: [string, string]; label: string }> {
  // Season strings are directly comparable (e.g. '2025-2026' < '2026-2027')
  if (saison <= '2025-2026') {
    return [
      { groups: ['B', 'E'], label: 'BE' },   // QF slot 0  → feeds SF[0]
      { groups: ['A', 'D'], label: 'AD' },   // QF slot 1  → feeds SF[0]
      { groups: ['C', 'F'], label: 'CF' },   // QF slot 2  → feeds SF[1]
      { groups: ['H', 'G'], label: 'HG' },   // QF slot 3  → feeds SF[1]
    ];
  }
  return [
    { groups: ['H', 'A'], label: 'HA' },     // QF slot 0  → feeds SF[0]
    { groups: ['G', 'B'], label: 'GB' },     // QF slot 1  → feeds SF[0]
    { groups: ['F', 'C'], label: 'FC' },     // QF slot 2  → feeds SF[1]
    { groups: ['E', 'D'], label: 'ED' },     // QF slot 3  → feeds SF[1]
  ];
}

/**
 * Build a map: normalizedTeamName → BEK group letter (e.g., "BERCHEM" → "F")
 * by scanning all BEK group matches for the season.
 */
async function buildTeamToGroupMap(saison: string): Promise<Map<string, string>> {
  const teamToGroup = new Map<string, string>();
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  for (const grp of groups) {
    const rawMatches = await prisma.match.findMany({
      where: { division: `Division BEK${grp}`, saison },
      select: { equipedomicile: true, equipeexterieur: true }
    });

    for (const m of rawMatches) {
      const home = await getDisplayName(m.equipedomicile, saison);
      const away = await getDisplayName(m.equipeexterieur, saison);
      // Map normalized team name to its group
      if (!teamToGroup.has(home)) teamToGroup.set(home, grp);
      if (!teamToGroup.has(away)) teamToGroup.set(away, grp);
    }
  }

  return teamToGroup;
}

/**
 * Given a CUP4 match and the team→group map, find which bracket slot it belongs to.
 */
function findQFSlot(
  match: { equipedomicile: string; equipeexterieur: string },
  teamToGroup: Map<string, string>,
  bracket: Array<{ groups: [string, string]; label: string }>
): number {
  const homeGroup = teamToGroup.get(match.equipedomicile);
  const awayGroup = teamToGroup.get(match.equipeexterieur);

  if (!homeGroup || !awayGroup) return -1;

  // Check which bracket pair this group combination matches
  const groupPair = new Set([homeGroup, awayGroup]);

  for (let i = 0; i < bracket.length; i++) {
    const bracketGroups = new Set(bracket[i].groups);
    if (groupPair.size === bracketGroups.size &&
        [...groupPair].every(g => bracketGroups.has(g))) {
      return i;
    }
  }

  return -1;
}

/**
 * Given an SF match, find which SF slot it belongs to by checking if
 * its teams come from QF[0]+QF[1] (slot 0) or QF[2]+QF[3] (slot 1).
 */
function findSFSlot(
  match: { equipedomicile: string; equipeexterieur: string },
  teamToGroup: Map<string, string>,
  bracket: Array<{ groups: [string, string]; label: string }>
): number {
  const homeGroup = teamToGroup.get(match.equipedomicile);
  const awayGroup = teamToGroup.get(match.equipeexterieur);

  if (!homeGroup || !awayGroup) return -1;

  // SF[0] → teams from QF[0] + QF[1] groups
  const sf0Groups = new Set([...bracket[0].groups, ...bracket[1].groups]);
  // SF[1] → teams from QF[2] + QF[3] groups
  const sf1Groups = new Set([...bracket[2].groups, ...bracket[3].groups]);

  if (sf0Groups.has(homeGroup) && sf0Groups.has(awayGroup)) return 0;
  if (sf1Groups.has(homeGroup) && sf1Groups.has(awayGroup)) return 1;

  return -1;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const saison = searchParams.get('saison') || '2025-2026';

    // Determine the bracket pairing for this season
    const bracket = getQFBracket(saison);

    // Step 1: Build team → BEK group map
    const teamToGroup = await buildTeamToGroupMap(saison);

    // Step 2: Fetch all playoff matches
    const rawQuarterFinals = await prisma.match.findMany({
      where: {
        OR: [
          { division: 'Division BEK4' },
          { division: 'Division CUP4' }
        ],
        saison
      },
      orderBy: { date: 'asc' }
    });
    const quarterFinals = deduplicateMatches(rawQuarterFinals);

    const rawSemiFinals = await prisma.match.findMany({
      where: {
        OR: [
          { division: 'Division BEK2' },
          { division: 'Division CUP2' }
        ],
        saison
      },
      orderBy: { date: 'asc' }
    });
    const semiFinals = deduplicateMatches(rawSemiFinals);

    const rawFinals = await prisma.match.findMany({
      where: {
        OR: [
          { division: 'Division BEK1' },
          { division: 'Division CUP1' }
        ],
        saison
      },
      orderBy: { date: 'asc' },
      take: 1
    });
    const finals = deduplicateMatches(rawFinals);

    // Step 3: Normalize match names
    const normalizeMatch = async (m: any) => ({
      equipedomicile: await getDisplayName(m.equipedomicile, saison),
      equipeexterieur: await getDisplayName(m.equipeexterieur, saison),
      scoredomicile: m.scoredomicile,
      scoreexterieur: m.scoreexterieur,
      date: m.date
    });

    const normalizedQFs = await Promise.all(quarterFinals.map(normalizeMatch));
    const normalizedSFs = await Promise.all(semiFinals.map(normalizeMatch));
    const normalizedFinals = await Promise.all(finals.map(normalizeMatch));

    // Step 4: Order QF matches according to the bracket structure
    const orderedQFs: Array<typeof normalizedQFs[0] | null> = [null, null, null, null];
    const usedQFs = new Set<number>();

    for (let qi = 0; qi < normalizedQFs.length; qi++) {
      const slot = findQFSlot(normalizedQFs[qi], teamToGroup, bracket);
      if (slot >= 0 && !orderedQFs[slot]) {
        orderedQFs[slot] = normalizedQFs[qi];
        usedQFs.add(qi);
      }
    }

    // Place any unmatched QFs in remaining empty slots
    let nextEmpty = 0;
    for (let qi = 0; qi < normalizedQFs.length; qi++) {
      if (!usedQFs.has(qi)) {
        while (nextEmpty < 4 && orderedQFs[nextEmpty] !== null) nextEmpty++;
        if (nextEmpty < 4) orderedQFs[nextEmpty] = normalizedQFs[qi];
      }
    }

    // Step 5: Order SF matches according to bracket
    const orderedSFs: Array<typeof normalizedSFs[0] | null> = [null, null];
    const usedSFs = new Set<number>();

    for (let si = 0; si < normalizedSFs.length; si++) {
      const slot = findSFSlot(normalizedSFs[si], teamToGroup, bracket);
      if (slot >= 0 && !orderedSFs[slot]) {
        orderedSFs[slot] = normalizedSFs[si];
        usedSFs.add(si);
      }
    }

    // Place any unmatched SFs in remaining empty slots
    let nextSFEmpty = 0;
    for (let si = 0; si < normalizedSFs.length; si++) {
      if (!usedSFs.has(si)) {
        while (nextSFEmpty < 2 && orderedSFs[nextSFEmpty] !== null) nextSFEmpty++;
        if (nextSFEmpty < 2) orderedSFs[nextSFEmpty] = normalizedSFs[si];
      }
    }

    // Keep nulls as placeholders so the tree knows each slot's position
    // null = "à déterminer" placeholder
    return NextResponse.json({
      success: true,
      saison,
      quarterFinals: orderedQFs,
      semiFinals: orderedSFs,
      finals: normalizedFinals.length > 0 ? normalizedFinals : [null]
    });

  } catch (error) {
    console.error('Error fetching cup playoffs:', error);
    return NextResponse.json({
      error: 'Failed to fetch cup playoffs'
    }, { status: 500 });
  }
}