/**
 * Utilitaire pour dédupliquer les matchs
 * Garde uniquement le DERNIER match chargé pour chaque confrontation unique.
 * 
 * IMPORTANT : L'ordre domicile/extérieur est significatif.
 * MACHELEN (dom) vs RUNNERS A (ext) et RUNNERS A (dom) vs MACHELEN (ext) sont
 * deux matchs différents (aller/retour) et ne doivent PAS être dédupliqués.
 * 
 * Un doublon = même équipe domicile + même équipe extérieur (importé plusieurs fois).
 * Le "dernier chargé" est déterminé par createdAt (date de création en DB).
 */

interface MatchLike {
  equipedomicile: string;
  equipeexterieur: string;
  date?: Date | string | null;
  createdAt?: Date | string | null;
  [key: string]: any;
}

/**
 * Déduplique une liste de matchs en ne gardant que le dernier match CHARGÉ
 * pour chaque confrontation unique (même domicile vs même extérieur).
 * 
 * @param matches - Liste des matchs à dédupliquer
 * @returns Liste de matchs sans doublons (dernier chargé conservé)
 * 
 * Exemple: Si 2 imports contiennent "REBOND OTTIGNIES (dom) vs ARGENTINE A (ext)" :
 * - Match 1: créé le 04/12
 * - Match 2: créé le 08/12
 * → Le match 2 sera conservé (createdAt le plus récent = dernier chargé)
 * 
 * Mais "REBOND OTTIGNIES (dom) vs ARGENTINE A (ext)" et
 *      "ARGENTINE A (dom) vs REBOND OTTIGNIES (ext)" sont 2 matchs distincts (aller/retour).
 */
export function deduplicateMatches<T extends MatchLike>(matches: T[]): T[] {
  const matchesMap = new Map<string, T>();
  
  // Parcourir tous les matchs
  for (const match of matches) {
    const home = match.equipedomicile.toLowerCase().trim();
    const away = match.equipeexterieur.toLowerCase().trim();
    
    // Clé ordonnée : domicile|extérieur (l'ordre compte pour distinguer aller/retour)
    const key = `${home}|${away}`;
    
    // Vérifier si ce match existe déjà
    const existingMatch = matchesMap.get(key);
    
    if (!existingMatch) {
      // Premier match pour cette confrontation
      matchesMap.set(key, match);
    } else {
      // Comparer les dates de CRÉATION (createdAt) pour garder le dernier chargé
      const existingCreatedAt = existingMatch.createdAt ? new Date(existingMatch.createdAt).getTime() : 0;
      const currentCreatedAt = match.createdAt ? new Date(match.createdAt).getTime() : 0;
      
      // Si le match actuel a été créé plus récemment, le remplacer
      // Si pas de createdAt, le dernier dans la liste écrase les précédents
      if (currentCreatedAt >= existingCreatedAt) {
        matchesMap.set(key, match);
      }
      // Sinon, garder l'existant (qui a été chargé plus récemment)
    }
  }
  
  return Array.from(matchesMap.values());
}
