/**
 * Service de déduplication des matchs
 * Détecte les doublons (même équipes + même division + même saison, dates différentes)
 * et supprime le moins pertinent avec un audit log.
 * 
 * Règle de priorité :
 * 1. Le match avec des scores renseignés est conservé
 * 2. Si les deux ont des scores (ou aucun), le dernier chargé (createdAt) est conservé
 */

import { prisma } from '@/lib/db';

interface DeduplicationResult {
  duplicatesFound: number;
  duplicatesRemoved: number;
  details: Array<{
    kept: { id: string; date: string; scores: string };
    removed: { id: string; date: string; scores: string };
    reason: string;
  }>;
}

export async function deduplicateMatchesInDB(
  saison?: string,
  division?: string
): Promise<DeduplicationResult> {
  const result: DeduplicationResult = {
    duplicatesFound: 0,
    duplicatesRemoved: 0,
    details: [],
  };

  // Construire le filtre
  const where: any = {};
  if (saison) where.saison = saison;
  if (division) where.division = division;

  // Récupérer tous les matchs
  const allMatches = await prisma.match.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  });

  // Grouper par paire d'équipes + division + saison
  const groups = new Map<string, typeof allMatches>();

  for (const match of allMatches) {
    const team1 = match.equipedomicile.toLowerCase().trim();
    const team2 = match.equipeexterieur.toLowerCase().trim();
    // Clé ordonnée : domicile|extérieur (l'ordre compte pour distinguer aller/retour)
    const key = [
      `${team1}|${team2}`,
      match.division.toLowerCase().trim(),
      match.saison,
    ].join('::');

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(match);
  }

  // Traiter chaque groupe avec plus d'un match
  for (const [, matches] of groups) {
    if (matches.length <= 1) continue;

    result.duplicatesFound += matches.length - 1;

    // Déterminer quel match garder
    // Trier : ceux avec scores d'abord, puis par createdAt desc
    const sorted = [...matches].sort((a, b) => {
      const aHasScores = a.scoredomicile !== null && a.scoreexterieur !== null;
      const bHasScores = b.scoredomicile !== null && b.scoreexterieur !== null;

      // Priorité aux matchs avec scores
      if (aHasScores && !bHasScores) return -1;
      if (!aHasScores && bHasScores) return 1;

      // Si même statut de scores, garder le dernier chargé
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const kept = sorted[0];
    const toRemove = sorted.slice(1);

    for (const match of toRemove) {
      const hasScoresKept = kept.scoredomicile !== null && kept.scoreexterieur !== null;
      const hasScoresRemoved = match.scoredomicile !== null && match.scoreexterieur !== null;

      let reason: string;
      if (hasScoresKept && !hasScoresRemoved) {
        reason = 'Doublon sans score — le match avec score a été conservé';
      } else if (!hasScoresKept && hasScoresRemoved) {
        reason = 'Doublon — le match chargé plus récemment a été conservé';
      } else {
        reason = 'Doublon — le match chargé en dernier a été conservé';
      }

      // Sauvegarder dans l'audit log
      await prisma.deletedMatch.create({
        data: {
          originalMatchId: match.id,
          semaine: match.semaine,
          jour: match.jour,
          periode: match.periode,
          date: match.date,
          division: match.division,
          heure: match.heure,
          equipedomicile: match.equipedomicile,
          equipeexterieur: match.equipeexterieur,
          handicapeInitialDomicile: match.handicapeInitialDomicile,
          handicapeInitialExterieur: match.handicapeInitialExterieur,
          scoredomicile: match.scoredomicile,
          scoreexterieur: match.scoreexterieur,
          lieu: match.lieu,
          adresse: match.adresse,
          ville: match.ville,
          saison: match.saison,
          originalCreatedAt: match.createdAt,
          deletionReason: reason,
          keptMatchId: kept.id,
        },
      });

      // Supprimer le match doublon
      await prisma.match.delete({ where: { id: match.id } });

      result.duplicatesRemoved++;
      result.details.push({
        kept: {
          id: kept.id,
          date: kept.date.toISOString(),
          scores:
            kept.scoredomicile !== null
              ? `${kept.scoredomicile}-${kept.scoreexterieur}`
              : 'Pas de score',
        },
        removed: {
          id: match.id,
          date: match.date.toISOString(),
          scores:
            match.scoredomicile !== null
              ? `${match.scoredomicile}-${match.scoreexterieur}`
              : 'Pas de score',
        },
        reason,
      });
    }
  }

  return result;
}
