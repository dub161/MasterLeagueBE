
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { parseExcelFile } from '@/lib/excel-parser';
import { checkCoherence } from '@/lib/coherence-check';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    const results = {
      files: [] as any[],
      totalInserted: 0,
      errors: [] as string[]
    };
    
    // Fichiers de test à charger
    const testFiles = [
      'MASTERS BASIC 251013.xlsx',
      'CHRONOLOGIC MASTERS.xlsx'
    ];
    
    for (const filename of testFiles) {
      try {
        const filePath = path.join(process.cwd(), 'public', 'test-data', filename);
        
        // Vérifier si le fichier existe
        try {
          await fs.access(filePath);
        } catch {
          results.errors.push(`Fichier non trouvé: ${filename}`);
          continue;
        }
        
        // Lire le fichier
        const buffer = await fs.readFile(filePath);
        
        // Parser le fichier
        const parseResult = parseExcelFile(buffer, filename);
        
        // Test de cohérence préalable : ne pas importer si erreurs bloquantes
        const coherence = checkCoherence(parseResult);
        if (!coherence.ok) {
          results.files.push({
            filename,
            status: 'error',
            message: 'Test de cohérence échoué — fichier non importé',
            coherence,
            errors: coherence.errors
          });
          continue;
        }
        
        // Sauvegarder en base de données
        let insertedCount = 0;
        let skippedCount = 0;
        const insertErrors: string[] = [];
        
        for (const match of parseResult.matches) {
          try {
            // Vérifier si le match existe déjà
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
            insertErrors.push(`Erreur insertion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
          }
        }
        
        results.files.push({
          filename,
          status: 'success',
          coherence,
          stats: {
            totalRows: parseResult.totalRows,
            validMatches: parseResult.matches.length,
            inserted: insertedCount,
            skipped: skippedCount,
            parseErrors: parseResult.errors,
            insertErrors
          }
        });
        
        results.totalInserted += insertedCount;
        
      } catch (error) {
        results.errors.push(`Erreur traitement ${filename}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Chargement des fichiers de test terminé',
      results
    });
    
  } catch (error) {
    console.error('Erreur chargement fichiers test:', error);
    return NextResponse.json({
      error: 'Erreur lors du chargement des fichiers de test',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
