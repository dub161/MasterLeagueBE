
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { downloadFileAsBuffer } from '@/lib/s3';
import { parseExcelFile } from '@/lib/excel-parser';
import { checkCoherence } from '@/lib/coherence-check';
import { deduplicateMatchesInDB } from '@/lib/deduplication-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const fileId = params.fileId;
    
    // Récupérer les métadonnées du fichier
    const uploadedFile = await prisma.uploadedFile.findUnique({
      where: { id: fileId }
    });
    
    if (!uploadedFile) {
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
    }
    
    // Télécharger le fichier depuis S3
    const buffer = await downloadFileAsBuffer(uploadedFile.cloudStoragePath);
    
    // Parser le fichier Excel
    const parseResult = parseExcelFile(buffer, uploadedFile.originalName);
    
    // Test de cohérence préalable : bloquer le chargement si erreurs bloquantes
    const coherence = checkCoherence(parseResult);
    if (!coherence.ok) {
      return NextResponse.json({
        success: false,
        error: 'Le test de cohérence a échoué. Le fichier n\'a pas été chargé.',
        message: 'Le test de cohérence a échoué. Aucune donnée n\'a été importée.',
        coherence
      }, { status: 400 });
    }
    
    // Sauvegarder en base de données
    let insertedCount = 0;
    let skippedCount = 0;
    const insertErrors: string[] = [];
    
    for (const match of parseResult.matches) {
      try {
        // Vérifier si le match existe déjà (même date, équipes, division)
        const existingMatch = await prisma.match.findFirst({
          where: {
            date: match.date,
            equipedomicile: match.equipedomicile,
            equipeexterieur: match.equipeexterieur,
            division: match.division
          }
        });
        
        if (existingMatch) {
          // Mettre à jour si de nouveaux scores sont disponibles
          if (match.scoredomicile !== undefined || match.scoreexterieur !== undefined) {
            await prisma.match.update({
              where: { id: existingMatch.id },
              data: {
                scoredomicile: match.scoredomicile ?? existingMatch.scoredomicile,
                scoreexterieur: match.scoreexterieur ?? existingMatch.scoreexterieur,
                semaine: match.semaine ?? existingMatch.semaine,
                jour: match.jour ?? existingMatch.jour,
                periode: match.periode ?? existingMatch.periode,
                heure: match.heure ?? existingMatch.heure,
                lieu: match.lieu ?? existingMatch.lieu,
                adresse: match.adresse ?? existingMatch.adresse,
                ville: match.ville ?? existingMatch.ville,
                saison: match.saison ?? existingMatch.saison
              }
            });
            insertedCount++;
          } else {
            skippedCount++;
          }
        } else {
          // Créer un nouveau match
          await prisma.match.create({
            data: match
          });
          insertedCount++;
        }
      } catch (error) {
        insertErrors.push(`Erreur insertion match ${match.equipedomicile} vs ${match.equipeexterieur}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }
    
    // Mettre à jour les métadonnées du fichier
    await prisma.uploadedFile.update({
      where: { id: fileId },
      data: {
        isLoaded: true,
        loadedAt: new Date(),
        matchCount: insertedCount
      }
    });
    
    // Lancer la déduplication automatique après le chargement
    let deduplicationResult = null;
    try {
      // Récupérer les saisons présentes dans le fichier importé
      const saisons = [...new Set(parseResult.matches.map(m => m.saison))];
      let totalDuplicatesRemoved = 0;
      const deduplicationDetails: any[] = [];
      
      for (const s of saisons) {
        if (s) {
          const dedup = await deduplicateMatchesInDB(s);
          totalDuplicatesRemoved += dedup.duplicatesRemoved;
          deduplicationDetails.push(...dedup.details);
        }
      }
      
      if (totalDuplicatesRemoved > 0) {
        deduplicationResult = {
          duplicatesRemoved: totalDuplicatesRemoved,
          details: deduplicationDetails,
        };
      }
    } catch (dedupError) {
      console.error('Erreur déduplication auto:', dedupError);
    }

    return NextResponse.json({
      success: true,
      message: 'Fichier chargé avec succès',
      stats: {
        totalRows: parseResult.totalRows,
        validMatches: parseResult.matches.length,
        inserted: insertedCount,
        skipped: skippedCount,
        parseErrors: parseResult.errors,
        insertErrors
      },
      coherence,
      deduplication: deduplicationResult
    });
    
  } catch (error) {
    console.error('Erreur chargement fichier:', error);
    return NextResponse.json({
      error: 'Erreur lors du chargement du fichier',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
