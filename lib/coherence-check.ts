import { ParseResult } from './excel-parser';

export interface CoherenceReport {
  ok: boolean;              // true = le fichier peut être chargé sans erreur bloquante
  errors: string[];         // erreurs bloquantes (empêchent le chargement)
  warnings: string[];       // avertissements (chargement possible, à vérifier)
  summary: {
    totalRows: number;
    validMatches: number;
    detectedSaison: string;
    yearCorrected: number;
    excludedFinalRound: number;
    normalizedTeams: number;
    unknownDivisions: string[];
    divisionBreakdown: Record<string, number>;
    dateRange: { min: string | null; max: string | null };
    internalDuplicates: number;
  };
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Test de cohérence appliqué au résultat du parsing AVANT toute écriture en base.
 * Vérifie que les données sont exploitables et signale les anomalies.
 */
export function checkCoherence(result: ParseResult): CoherenceReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { matches, corrections } = result;

  // Répartition par division
  const divisionBreakdown: Record<string, number> = {};
  for (const m of matches) {
    divisionBreakdown[m.division] = (divisionBreakdown[m.division] || 0) + 1;
  }

  // Plage de dates
  let minDate: Date | null = null;
  let maxDate: Date | null = null;
  for (const m of matches) {
    if (!minDate || m.date < minDate) minDate = m.date;
    if (!maxDate || m.date > maxDate) maxDate = m.date;
  }

  // Détection des doublons internes au fichier (même division|domicile|extérieur|date)
  const seen = new Set<string>();
  let internalDuplicates = 0;
  for (const m of matches) {
    const key = `${m.division}|${m.equipedomicile}|${m.equipeexterieur}|${formatDate(m.date)}`;
    if (seen.has(key)) {
      internalDuplicates++;
    } else {
      seen.add(key);
    }
  }

  // --- Erreurs bloquantes ---
  if (matches.length === 0) {
    errors.push("Aucun match valide n'a été détecté dans le fichier. Vérifiez la structure (feuille CHRONOLOGIC, colonnes date/division/équipes).");
  }

  // Noms d'équipes vides
  const emptyTeamRows = matches.filter(m => !m.equipedomicile?.trim() || !m.equipeexterieur?.trim()).length;
  if (emptyTeamRows > 0) {
    errors.push(`${emptyTeamRows} match(s) avec un nom d'équipe manquant.`);
  }

  // Équipe jouant contre elle-même
  const selfMatches = matches.filter(m => m.equipedomicile?.trim() && m.equipedomicile.trim().toUpperCase() === m.equipeexterieur?.trim().toUpperCase()).length;
  if (selfMatches > 0) {
    errors.push(`${selfMatches} match(s) où l'équipe à domicile et à l'extérieur sont identiques.`);
  }

  // Saison non détectée
  if (!corrections.detectedSaison) {
    errors.push("Impossible de détecter la saison à partir des dates du fichier.");
  }

  // --- Avertissements ---
  if (corrections.unknownDivisions.length > 0) {
    warnings.push(`Division(s) non reconnue(s), importée(s) telles quelles : ${corrections.unknownDivisions.join(', ')}. Vérifiez le mapping attendu (A → Division 1, B → Division 2, CUP X → Division BEKX).`);
  }

  if (internalDuplicates > 0) {
    warnings.push(`${internalDuplicates} doublon(s) interne(s) détecté(s) dans le fichier (même division, équipes et date).`);
  }

  // Cohérence de la plage de dates avec la saison détectée
  if (corrections.detectedSaison && minDate && maxDate) {
    const startYear = parseInt(corrections.detectedSaison.slice(0, 4), 10);
    if (!isNaN(startYear)) {
      const lowerBound = new Date(startYear, 6, 1);      // 1er juillet (début saison)
      const upperBound = new Date(startYear + 1, 7, 31); // 31 août suivant (marge fin saison)
      const outOfRange = matches.filter(m => m.date < lowerBound || m.date > upperBound).length;
      if (outOfRange > 0) {
        warnings.push(`${outOfRange} match(s) avec une date hors de la saison détectée (${corrections.detectedSaison}). Vérifiez les dates du fichier.`);
      }
    }
  }

  if (result.errors.length > 0) {
    warnings.push(`${result.errors.length} ligne(s) ont généré une erreur de parsing (ignorée(s)).`);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalRows: result.totalRows,
      validMatches: matches.length,
      detectedSaison: corrections.detectedSaison,
      yearCorrected: corrections.yearCorrected,
      excludedFinalRound: corrections.excludedFinalRound,
      normalizedTeams: corrections.normalizedTeams,
      unknownDivisions: corrections.unknownDivisions,
      divisionBreakdown,
      dateRange: {
        min: minDate ? formatDate(minDate) : null,
        max: maxDate ? formatDate(maxDate) : null,
      },
      internalDuplicates,
    },
  };
}
