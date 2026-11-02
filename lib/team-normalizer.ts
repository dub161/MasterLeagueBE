
import { prisma } from '@/lib/db';

// Cache pour les alias par saison
const aliasCache = new Map<string, Map<string, string>>();

/**
 * Récupère le nom d'affichage d'une équipe en fonction de la saison
 */
export async function getDisplayName(originalName: string, saison: string): Promise<string> {
  if (!originalName) return originalName;

  // Vérifier le cache
  const seasonCache = aliasCache.get(saison);
  if (seasonCache?.has(originalName)) {
    return seasonCache.get(originalName)!;
  }

  try {
    // Chercher dans la base de données
    const alias = await prisma.teamAlias.findFirst({
      where: {
        saison,
        originalNames: {
          has: originalName
        }
      }
    });

    const displayName = alias?.displayName || originalName;

    // Mettre à jour le cache
    if (!aliasCache.has(saison)) {
      aliasCache.set(saison, new Map());
    }
    aliasCache.get(saison)!.set(originalName, displayName);

    return displayName;
  } catch (error) {
    console.error('Error getting display name:', error);
    return originalName;
  }
}

/**
 * Récupère tous les noms originaux pour un nom d'affichage donné
 */
export async function getOriginalNames(displayName: string, saison: string): Promise<string[]> {
  try {
    const alias = await prisma.teamAlias.findUnique({
      where: {
        displayName_saison: {
          displayName,
          saison
        }
      }
    });

    return alias?.originalNames || [displayName];
  } catch (error) {
    console.error('Error getting original names:', error);
    return [displayName];
  }
}

/**
 * Récupère tous les alias pour une saison
 */
export async function getAllAliases(saison: string) {
  try {
    return await prisma.teamAlias.findMany({
      where: { saison },
      orderBy: { displayName: 'asc' }
    });
  } catch (error) {
    console.error('Error getting all aliases:', error);
    return [];
  }
}

/**
 * Invalide le cache pour une saison
 */
export function invalidateCache(saison?: string) {
  if (saison) {
    aliasCache.delete(saison);
  } else {
    aliasCache.clear();
  }
}

/**
 * Trouve tous les noms d'équipes uniques dans la base de données pour une saison
 * Retourne les noms d'affichage (normalisés) au lieu des noms originaux
 */
export async function findAllTeamNames(saison?: string) {
  try {
    const where = saison ? { saison } : {};
    
    const matches = await prisma.match.findMany({
      where,
      select: {
        equipedomicile: true,
        equipeexterieur: true,
        saison: true
      }
    });

    // Créer un ensemble de noms d'affichage uniques
    const teamDisplayNamesSet = new Set<string>();
    
    for (const match of matches) {
      const homeName = await getDisplayName(match.equipedomicile, match.saison);
      const awayName = await getDisplayName(match.equipeexterieur, match.saison);
      teamDisplayNamesSet.add(homeName);
      teamDisplayNamesSet.add(awayName);
    }

    return Array.from(teamDisplayNamesSet).sort();
  } catch (error) {
    console.error('Error finding team names:', error);
    return [];
  }
}

/**
 * Trouve tous les noms d'équipes originaux (non normalisés) pour une saison
 */
export async function findAllOriginalTeamNames(saison?: string) {
  try {
    const where = saison ? { saison } : {};
    
    const matches = await prisma.match.findMany({
      where,
      select: {
        equipedomicile: true,
        equipeexterieur: true,
        saison: true
      }
    });

    const teamNamesSet = new Set<string>();
    matches.forEach(match => {
      teamNamesSet.add(match.equipedomicile);
      teamNamesSet.add(match.equipeexterieur);
    });

    return Array.from(teamNamesSet).sort();
  } catch (error) {
    console.error('Error finding original team names:', error);
    return [];
  }
}
