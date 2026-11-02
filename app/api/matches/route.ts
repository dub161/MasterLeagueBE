
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getDisplayName, getOriginalNames } from '@/lib/team-normalizer';
import { deduplicateMatches } from '@/lib/match-deduplication';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const equipe = searchParams.get('equipe');
    const division = searchParams.get('division');
    const saison = searchParams.get('saison');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Construire le filtre WHERE
    const where: any = { AND: [] };
    
    if (equipe && equipe !== 'all') {
      // Si une équipe est sélectionnée, chercher tous ses noms originaux
      if (saison && saison !== 'all') {
        const originalNames = await getOriginalNames(equipe, saison);
        where.AND.push({
          OR: [
            { equipedomicile: { in: originalNames } },
            { equipeexterieur: { in: originalNames } }
          ]
        });
      } else {
        where.AND.push({
          OR: [
            { equipedomicile: equipe },
            { equipeexterieur: equipe }
          ]
        });
      }
    }
    
    if (division && division !== 'all') {
      // Si division = "COUPE", chercher toutes les divisions contenant COUPE, BEK, ou CUP
      if (division.toUpperCase() === 'COUPE') {
        where.AND.push({
          OR: [
            { division: { contains: 'COUPE', mode: 'insensitive' } },
            { division: { contains: 'BEK', mode: 'insensitive' } },
            { division: { contains: 'CUP', mode: 'insensitive' } }
          ]
        });
      } else {
        // Utiliser contains pour plus de flexibilité (gère "Division 1" ou "1")
        where.AND.push({ 
          division: { 
            contains: division, 
            mode: 'insensitive' 
          } 
        });
      }
    }
    
    if (saison && saison !== 'all') {
      where.AND.push({ saison: saison });
    }

    // Si AND est vide, supprimer la clé
    const finalWhere = where.AND.length > 0 ? where : {};
    
    // Construire l'ordre de tri
    const orderBy: any = {};
    if (sortBy === 'date') {
      orderBy.date = sortOrder;
    } else if (sortBy === 'division') {
      orderBy.division = sortOrder;
    } else if (sortBy === 'equipedomicile') {
      orderBy.equipedomicile = sortOrder;
    } else if (sortBy === 'equipeexterieur') {
      orderBy.equipeexterieur = sortOrder;
    } else if (sortBy === 'lieu') {
      orderBy.lieu = sortOrder;
    } else {
      orderBy.date = 'desc'; // Par défaut
    }
    
    // Exécuter la requête
    const rawMatches = await prisma.match.findMany({
      where: finalWhere,
      orderBy,
      select: {
        id: true,
        date: true,
        heure: true,
        division: true,
        equipedomicile: true,
        equipeexterieur: true,
        scoredomicile: true,
        scoreexterieur: true,
        lieu: true,
        ville: true,
        saison: true,
        createdAt: true
      }
    });

    // Dédupliquer les matchs - garder uniquement le DERNIER match pour chaque paire d'équipes
    const uniqueMatches = deduplicateMatches(rawMatches);

    // Normaliser les noms d'équipes
    const matches = await Promise.all(
      uniqueMatches.map(async (match) => ({
        ...match,
        equipedomicile: await getDisplayName(match.equipedomicile, match.saison),
        equipeexterieur: await getDisplayName(match.equipeexterieur, match.saison)
      }))
    );
    
    return NextResponse.json({
      success: true,
      matches,
      count: matches.length
    });
    
  } catch (error) {
    console.error('Erreur récupération matches:', error);
    return NextResponse.json({
      error: 'Erreur lors de la récupération des matchs',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
