export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deletedMatch = await prisma.deletedMatch.findUnique({
      where: { id: params.id },
    });

    if (!deletedMatch) {
      return NextResponse.json({ error: 'Match supprimé non trouvé' }, { status: 404 });
    }

    // Recréer le match dans la table Match
    const restoredMatch = await prisma.match.create({
      data: {
        semaine: deletedMatch.semaine,
        jour: deletedMatch.jour,
        periode: deletedMatch.periode,
        date: deletedMatch.date,
        division: deletedMatch.division,
        heure: deletedMatch.heure,
        equipedomicile: deletedMatch.equipedomicile,
        equipeexterieur: deletedMatch.equipeexterieur,
        handicapeInitialDomicile: deletedMatch.handicapeInitialDomicile,
        handicapeInitialExterieur: deletedMatch.handicapeInitialExterieur,
        scoredomicile: deletedMatch.scoredomicile,
        scoreexterieur: deletedMatch.scoreexterieur,
        lieu: deletedMatch.lieu,
        adresse: deletedMatch.adresse,
        ville: deletedMatch.ville,
        saison: deletedMatch.saison,
      },
    });

    // Supprimer de l'audit log
    await prisma.deletedMatch.delete({ where: { id: params.id } });

    return NextResponse.json({
      success: true,
      message: `Match ${deletedMatch.equipedomicile} vs ${deletedMatch.equipeexterieur} restauré avec succès`,
      match: restoredMatch,
    });
  } catch (error) {
    console.error('Erreur restauration match:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la restauration', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
