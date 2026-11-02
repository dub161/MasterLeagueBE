export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - List all playoff groups for a season
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const saison = searchParams.get('saison') || '2025-2026';

    const groups = await prisma.playoffGroup.findMany({
      where: { saison },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ success: true, groups });
  } catch (error) {
    console.error('Error fetching playoff groups:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des groupes de play-offs' },
      { status: 500 }
    );
  }
}

// POST - Create or update a playoff group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      saison,
      name,
      displayOrder,
      rankStart,
      rankEnd,
      sourceDivisions,
      sourcePositionStart,
      sourcePositionEnd,
      startDate,
      teams,
    } = body;

    if (!saison || !name || rankStart === undefined || rankEnd === undefined) {
      return NextResponse.json(
        { success: false, error: 'Champs obligatoires manquants (saison, name, rankStart, rankEnd)' },
        { status: 400 }
      );
    }

    const data = {
      saison,
      name,
      displayOrder: displayOrder || 0,
      rankStart,
      rankEnd,
      sourceDivisions: sourceDivisions || [],
      sourcePositionStart: sourcePositionStart ?? null,
      sourcePositionEnd: sourcePositionEnd ?? null,
      startDate: startDate ? new Date(startDate) : null,
      teams: teams || [],
    };

    let group;
    if (id) {
      // Update existing
      group = await prisma.playoffGroup.update({
        where: { id },
        data,
      });
    } else {
      // Create new - upsert by unique constraint
      group = await prisma.playoffGroup.upsert({
        where: { saison_name: { saison, name } },
        create: data,
        update: data,
      });
    }

    return NextResponse.json({ success: true, group });
  } catch (error) {
    console.error('Error saving playoff group:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la sauvegarde du groupe de play-offs' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a playoff group
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requis' },
        { status: 400 }
      );
    }

    await prisma.playoffGroup.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting playoff group:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression du groupe de play-offs' },
      { status: 500 }
    );
  }
}
