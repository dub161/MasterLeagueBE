
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE() {
  try {
    // Supprimer tous les matchs
    const result = await prisma.match.deleteMany({});
    
    return NextResponse.json({
      success: true,
      message: `Base de données nettoyée avec succès. ${result.count} matchs supprimés.`,
      deletedCount: result.count
    });
    
  } catch (error) {
    console.error('Erreur lors du nettoyage de la base de données:', error);
    return NextResponse.json({
      error: 'Erreur lors du nettoyage de la base de données',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
