
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { invalidateCache } from '@/lib/team-normalizer';

// GET - Récupérer tous les alias pour une saison
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const saison = searchParams.get('saison');

    if (!saison) {
      return NextResponse.json({
        error: 'Saison parameter is required'
      }, { status: 400 });
    }

    const aliases = await prisma.teamAlias.findMany({
      where: { saison },
      orderBy: { displayName: 'asc' }
    });

    return NextResponse.json({
      success: true,
      aliases
    });
  } catch (error) {
    console.error('Error fetching aliases:', error);
    return NextResponse.json({
      error: 'Failed to fetch aliases',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Créer un nouvel alias
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { displayName, originalNames, saison } = body;

    if (!displayName || !originalNames || !saison) {
      return NextResponse.json({
        error: 'displayName, originalNames, and saison are required'
      }, { status: 400 });
    }

    // Vérifier si un alias existe déjà pour ce displayName et cette saison
    const existing = await prisma.teamAlias.findUnique({
      where: {
        displayName_saison: {
          displayName,
          saison
        }
      }
    });

    if (existing) {
      return NextResponse.json({
        error: 'An alias with this display name already exists for this season'
      }, { status: 409 });
    }

    const alias = await prisma.teamAlias.create({
      data: {
        displayName,
        originalNames,
        saison
      }
    });

    invalidateCache(saison);

    return NextResponse.json({
      success: true,
      alias
    });
  } catch (error) {
    console.error('Error creating alias:', error);
    return NextResponse.json({
      error: 'Failed to create alias',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Mettre à jour un alias
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, displayName, originalNames, saison } = body;

    if (!id || !displayName || !originalNames || !saison) {
      return NextResponse.json({
        error: 'id, displayName, originalNames, and saison are required'
      }, { status: 400 });
    }

    const alias = await prisma.teamAlias.update({
      where: { id },
      data: {
        displayName,
        originalNames,
        saison
      }
    });

    invalidateCache(saison);

    return NextResponse.json({
      success: true,
      alias
    });
  } catch (error) {
    console.error('Error updating alias:', error);
    return NextResponse.json({
      error: 'Failed to update alias',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Supprimer un alias
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        error: 'id parameter is required'
      }, { status: 400 });
    }

    const alias = await prisma.teamAlias.findUnique({
      where: { id }
    });

    if (!alias) {
      return NextResponse.json({
        error: 'Alias not found'
      }, { status: 404 });
    }

    await prisma.teamAlias.delete({
      where: { id }
    });

    invalidateCache(alias.saison);

    return NextResponse.json({
      success: true,
      message: 'Alias deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting alias:', error);
    return NextResponse.json({
      error: 'Failed to delete alias',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
