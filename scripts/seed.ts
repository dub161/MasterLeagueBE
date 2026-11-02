
import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import { parseExcelFile } from '../lib/excel-parser';

const prisma = new PrismaClient();

async function main() {
  console.log('🏀 Début du seed de la base de données...');

  try {
    // Fichiers de test à charger
    const testFiles = [
      'MASTERS BASIC 251013.xlsx',
      'CHRONOLOGIC MASTERS.xlsx'
    ];

    let totalInserted = 0;

    for (const filename of testFiles) {
      console.log(`📂 Traitement du fichier: ${filename}`);
      
      try {
        const filePath = path.join(process.cwd(), 'public', 'test-data', filename);
        
        // Vérifier si le fichier existe
        try {
          await fs.access(filePath);
        } catch {
          console.log(`⚠️  Fichier non trouvé: ${filename}`);
          continue;
        }

        // Lire le fichier
        const buffer = await fs.readFile(filePath);
        
        // Parser le fichier
        const parseResult = parseExcelFile(buffer, filename);
        
        console.log(`📊 Parsing ${filename}:`);
        console.log(`   - Total lignes: ${parseResult.totalRows}`);
        console.log(`   - Matchs valides: ${parseResult.matches.length}`);
        console.log(`   - Erreurs de parsing: ${parseResult.errors.length}`);

        if (parseResult.errors.length > 0) {
          console.log('⚠️  Erreurs de parsing:');
          parseResult.errors.slice(0, 5).forEach(error => console.log(`   - ${error}`));
          if (parseResult.errors.length > 5) {
            console.log(`   ... et ${parseResult.errors.length - 5} autres erreurs`);
          }
        }

        if (parseResult.matches.length === 0) {
          console.log(`❌ Aucun match valide trouvé dans ${filename}`);
          continue;
        }

        // Sauvegarder en base de données
        let insertedCount = 0;
        let skippedCount = 0;

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
            console.log(`❌ Erreur insertion match: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
          }
        }

        console.log(`✅ ${filename} traité:`);
        console.log(`   - Insérés/Mis à jour: ${insertedCount}`);
        console.log(`   - Ignorés (doublons): ${skippedCount}`);
        
        totalInserted += insertedCount;

      } catch (error) {
        console.log(`❌ Erreur traitement ${filename}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }

    console.log(`🎉 Seed terminé ! Total: ${totalInserted} matchs insérés/mis à jour`);

    // Afficher quelques statistiques
    const totalMatches = await prisma.match.count();
    const totalTeams = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT team) as count FROM (
        SELECT equipedomicile as team FROM "Match"
        UNION
        SELECT equipeexterieur as team FROM "Match"
      ) teams
    ` as { count: bigint }[];
    
    const totalDivisions = await prisma.match.findMany({
      select: { division: true },
      distinct: ['division']
    });

    console.log('📈 Statistiques finales:');
    console.log(`   - Total matchs en base: ${totalMatches}`);
    console.log(`   - Total équipes: ${Number(totalTeams[0]?.count || 0)}`);
    console.log(`   - Total divisions: ${totalDivisions.length}`);

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('💥 Erreur fatale:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
