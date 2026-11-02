export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getDisplayName } from '@/lib/team-normalizer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const saison = searchParams.get('saison');
    const division = searchParams.get('division');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (saison) where.saison = saison;
    if (division) where.division = division;

    const totalCount = await prisma.deletedMatch.count({ where });
    const totalPages = Math.ceil(totalCount / limit);

    const deletedMatches = await prisma.deletedMatch.findMany({
      where,
      orderBy: { deletedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const matchesWithDisplayNames = await Promise.all(
      deletedMatches.map(async (m) => ({
        ...m,
        homeDisplayName: await getDisplayName(m.equipedomicile, m.saison),
        awayDisplayName: await getDisplayName(m.equipeexterieur, m.saison),
      }))
    );

    return NextResponse.json({
      success: true,
      deletedMatches: matchesWithDisplayNames,
      pagination: { page, totalPages, totalCount, limit },
    });
  } catch (error) {
    console.error('Erreur récupération matchs supprimés:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}
