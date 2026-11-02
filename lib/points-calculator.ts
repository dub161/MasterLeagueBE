/**
 * Fonctions communes pour le calcul des points dans les classements
 * Utilisé par tous les endpoints pour garantir la cohérence
 */

export interface TeamStats {
  name: string;
  played: number;
  won: number;
  drawn?: number;
  lost: number;
  forfeit?: number;
  points: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsDiff?: number;
}

export interface MatchScore {
  homeScore: number;
  awayScore: number;
}

export interface PointsResult {
  homePoints: number;
  awayPoints: number;
  homeWon: boolean;
  awayWon: boolean;
  isDrawn: boolean;
  isHomeForfeit: boolean;
  isAwayForfeit: boolean;
  isBothForfeit: boolean;
}

/**
 * Détecte si un match est un forfait
 */
export function detectForfeit(homeScore: number, awayScore: number): {
  isHomeForfeit: boolean;
  isAwayForfeit: boolean;
  isBothForfeit: boolean;
} {
  const isHomeForfeit = (homeScore === 0 && awayScore === 20);
  const isAwayForfeit = (homeScore === 20 && awayScore === 0);
  const isBothForfeit = (homeScore === 0 && awayScore === 0);

  return { isHomeForfeit, isAwayForfeit, isBothForfeit };
}

/**
 * Calcule les points pour un match selon les règles officielles
 * 
 * RÈGLES CHAMPIONNAT ET COUPE:
 * - Victoire: 3 points pour le gagnant, 1 point pour le perdant
 * - Match nul: 2 points pour chaque équipe
 * - Forfait: 3 points pour l'adversaire, 0 point pour l'équipe qui forfait
 * - Double forfait: 0 point pour les deux équipes
 * 
 * @param homeScore Score de l'équipe à domicile
 * @param awayScore Score de l'équipe à l'extérieur
 * @returns Objet contenant les points et les indicateurs de résultat
 */
export function calculatePoints(homeScore: number, awayScore: number): PointsResult {
  const { isHomeForfeit, isAwayForfeit, isBothForfeit } = detectForfeit(homeScore, awayScore);

  // Double forfait: 0 point pour les deux
  if (isBothForfeit) {
    return {
      homePoints: 0,
      awayPoints: 0,
      homeWon: false,
      awayWon: false,
      isDrawn: false,
      isHomeForfeit: true,
      isAwayForfeit: true,
      isBothForfeit: true
    };
  }

  // Forfait domicile: 0 point domicile, 3 points extérieur
  if (isHomeForfeit) {
    return {
      homePoints: 0,
      awayPoints: 3,
      homeWon: false,
      awayWon: true,
      isDrawn: false,
      isHomeForfeit: true,
      isAwayForfeit: false,
      isBothForfeit: false
    };
  }

  // Forfait extérieur: 3 points domicile, 0 point extérieur
  if (isAwayForfeit) {
    return {
      homePoints: 3,
      awayPoints: 0,
      homeWon: true,
      awayWon: false,
      isDrawn: false,
      isHomeForfeit: false,
      isAwayForfeit: true,
      isBothForfeit: false
    };
  }

  // Victoire domicile: 3 points domicile, 1 point extérieur
  if (homeScore > awayScore) {
    return {
      homePoints: 3,
      awayPoints: 1,
      homeWon: true,
      awayWon: false,
      isDrawn: false,
      isHomeForfeit: false,
      isAwayForfeit: false,
      isBothForfeit: false
    };
  }

  // Victoire extérieur: 1 point domicile, 3 points extérieur
  if (homeScore < awayScore) {
    return {
      homePoints: 1,
      awayPoints: 3,
      homeWon: false,
      awayWon: true,
      isDrawn: false,
      isHomeForfeit: false,
      isAwayForfeit: false,
      isBothForfeit: false
    };
  }

  // Match nul: 2 points chacun
  return {
    homePoints: 2,
    awayPoints: 2,
    homeWon: false,
    awayWon: false,
    isDrawn: true,
    isHomeForfeit: false,
    isAwayForfeit: false,
    isBothForfeit: false
  };
}

/**
 * Met à jour les statistiques d'une équipe après un match
 * 
 * @param teamStats Les statistiques actuelles de l'équipe
 * @param isHome true si l'équipe joue à domicile
 * @param homeScore Score à domicile
 * @param awayScore Score à l'extérieur
 */
export function updateTeamStats(
  teamStats: TeamStats,
  isHome: boolean,
  homeScore: number,
  awayScore: number
): void {
  const result = calculatePoints(homeScore, awayScore);
  const scoreFor = isHome ? homeScore : awayScore;
  const scoreAgainst = isHome ? awayScore : homeScore;
  const teamWon = isHome ? result.homeWon : result.awayWon;
  const teamPoints = isHome ? result.homePoints : result.awayPoints;
  const isForfeit = isHome ? result.isHomeForfeit : result.isAwayForfeit;

  // Mettre à jour les statistiques
  teamStats.played++;
  teamStats.pointsFor += scoreFor;
  teamStats.pointsAgainst += scoreAgainst;
  teamStats.points += teamPoints;

  // Mettre à jour les compteurs de victoires/défaites/nuls/forfaits
  if (result.isBothForfeit || isForfeit) {
    if (teamStats.forfeit !== undefined) {
      teamStats.forfeit++;
    }
  } else if (teamWon) {
    teamStats.won++;
  } else if (result.isDrawn) {
    if (teamStats.drawn !== undefined) {
      teamStats.drawn++;
    }
  } else {
    teamStats.lost++;
  }

  // Calculer la différence de buts si demandée
  if (teamStats.pointsDiff !== undefined) {
    teamStats.pointsDiff = teamStats.pointsFor - teamStats.pointsAgainst;
  }
}

/**
 * Initialise les statistiques d'une équipe à zéro
 * 
 * @param teamName Nom de l'équipe
 * @param includeDrawn Inclure le compteur de matchs nuls
 * @param includeForfeit Inclure le compteur de forfaits
 * @param includePointsDiff Inclure la différence de buts
 * @returns Objet TeamStats initialisé
 */
export function initializeTeamStats(
  teamName: string,
  includeDrawn: boolean = true,
  includeForfeit: boolean = true,
  includePointsDiff: boolean = false
): TeamStats {
  const stats: TeamStats = {
    name: teamName,
    played: 0,
    won: 0,
    lost: 0,
    points: 0,
    pointsFor: 0,
    pointsAgainst: 0
  };

  if (includeDrawn) {
    stats.drawn = 0;
  }

  if (includeForfeit) {
    stats.forfeit = 0;
  }

  if (includePointsDiff) {
    stats.pointsDiff = 0;
  }

  return stats;
}

/**
 * Interface pour stocker les confrontations directes entre équipes
 */
export interface HeadToHeadResult {
  teamA: string;
  teamB: string;
  teamAWins: number;
  teamBWins: number;
  draws: number;
  teamAPointsFor: number;
  teamAPointsAgainst: number;
  teamBPointsFor: number;
  teamBPointsAgainst: number;
}

/**
 * Structure pour stocker toutes les confrontations directes d'une division
 */
export type HeadToHeadMap = Map<string, HeadToHeadResult>;

/**
 * Génère une clé unique pour une paire d'équipes (ordre alphabétique)
 */
export function getHeadToHeadKey(teamA: string, teamB: string): string {
  const sorted = [teamA.toLowerCase(), teamB.toLowerCase()].sort();
  return `${sorted[0]}|${sorted[1]}`;
}

/**
 * Récupère ou initialise les confrontations directes entre deux équipes
 */
export function getOrCreateHeadToHead(
  map: HeadToHeadMap,
  teamA: string,
  teamB: string
): HeadToHeadResult {
  const key = getHeadToHeadKey(teamA, teamB);
  
  if (!map.has(key)) {
    const sorted = [teamA.toLowerCase(), teamB.toLowerCase()].sort();
    const isTeamAFirst = teamA.toLowerCase() === sorted[0];
    
    map.set(key, {
      teamA: isTeamAFirst ? teamA : teamB,
      teamB: isTeamAFirst ? teamB : teamA,
      teamAWins: 0,
      teamBWins: 0,
      draws: 0,
      teamAPointsFor: 0,
      teamAPointsAgainst: 0,
      teamBPointsFor: 0,
      teamBPointsAgainst: 0
    });
  }
  
  return map.get(key)!;
}

/**
 * Met à jour les confrontations directes après un match
 */
export function updateHeadToHead(
  map: HeadToHeadMap,
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number
): void {
  const h2h = getOrCreateHeadToHead(map, homeTeam, awayTeam);
  const isHomeTeamA = homeTeam.toLowerCase() === h2h.teamA.toLowerCase();
  
  // Mettre à jour les scores
  if (isHomeTeamA) {
    h2h.teamAPointsFor += homeScore;
    h2h.teamAPointsAgainst += awayScore;
    h2h.teamBPointsFor += awayScore;
    h2h.teamBPointsAgainst += homeScore;
  } else {
    h2h.teamBPointsFor += homeScore;
    h2h.teamBPointsAgainst += awayScore;
    h2h.teamAPointsFor += awayScore;
    h2h.teamAPointsAgainst += homeScore;
  }
  
  // Déterminer le gagnant (en ignorant les forfaits pour les confrontations directes)
  if (homeScore > awayScore) {
    if (isHomeTeamA) {
      h2h.teamAWins++;
    } else {
      h2h.teamBWins++;
    }
  } else if (awayScore > homeScore) {
    if (isHomeTeamA) {
      h2h.teamBWins++;
    } else {
      h2h.teamAWins++;
    }
  } else {
    h2h.draws++;
  }
}

/**
 * Compare les confrontations directes entre deux équipes
 * @returns > 0 si teamA gagne les confrontations, < 0 si teamB gagne, 0 si égalité
 */
export function compareHeadToHead(
  map: HeadToHeadMap,
  teamA: string,
  teamB: string
): number {
  const key = getHeadToHeadKey(teamA, teamB);
  const h2h = map.get(key);
  
  if (!h2h) {
    return 0; // Pas de confrontation directe
  }
  
  const isTeamAFirst = teamA.toLowerCase() === h2h.teamA.toLowerCase();
  
  // Comparer le nombre de victoires dans les confrontations directes
  const teamAWins = isTeamAFirst ? h2h.teamAWins : h2h.teamBWins;
  const teamBWins = isTeamAFirst ? h2h.teamBWins : h2h.teamAWins;
  
  if (teamAWins !== teamBWins) {
    return teamBWins - teamAWins; // Ordre décroissant (plus de victoires = meilleur)
  }
  
  // Si égalité sur les victoires, comparer la différence de points dans les confrontations
  const teamAPointsFor = isTeamAFirst ? h2h.teamAPointsFor : h2h.teamBPointsFor;
  const teamAPointsAgainst = isTeamAFirst ? h2h.teamAPointsAgainst : h2h.teamBPointsAgainst;
  const teamBPointsFor = isTeamAFirst ? h2h.teamBPointsFor : h2h.teamAPointsFor;
  const teamBPointsAgainst = isTeamAFirst ? h2h.teamBPointsAgainst : h2h.teamAPointsAgainst;
  
  const diffA = teamAPointsFor - teamAPointsAgainst;
  const diffB = teamBPointsFor - teamBPointsAgainst;
  
  return diffB - diffA; // Ordre décroissant
}

/**
 * Compare deux équipes pour le tri dans le classement
 * Critères (ordre de priorité):
 * 1. Nombre de points
 * 2. Confrontations directes (si même nombre de points)
 * 3. Différence de buts générale
 * 4. Nombre de buts marqués
 * 
 * @param a Première équipe
 * @param b Deuxième équipe
 * @returns Nombre négatif si a < b, positif si a > b, 0 si égal
 */
export function compareTeams(a: TeamStats, b: TeamStats): number {
  // 1. Comparer les points (ordre décroissant)
  if (b.points !== a.points) {
    return b.points - a.points;
  }

  // 2. Comparer la différence de buts (ordre décroissant)
  const diffA = a.pointsFor - a.pointsAgainst;
  const diffB = b.pointsFor - b.pointsAgainst;
  if (diffB !== diffA) {
    return diffB - diffA;
  }

  // 3. Comparer les buts marqués (ordre décroissant)
  return b.pointsFor - a.pointsFor;
}

/**
 * Compare deux équipes avec les confrontations directes
 * Critères (ordre de priorité):
 * 1. Nombre de points
 * 2. Confrontations directes (si même nombre de points)
 * 3. Différence de buts générale
 * 4. Nombre de buts marqués
 * 
 * @param a Première équipe
 * @param b Deuxième équipe
 * @param headToHeadMap Map des confrontations directes
 * @returns Nombre négatif si a < b, positif si a > b, 0 si égal
 */
export function compareTeamsWithHeadToHead(
  a: TeamStats,
  b: TeamStats,
  headToHeadMap: HeadToHeadMap
): number {
  // 1. Comparer les points (ordre décroissant)
  if (b.points !== a.points) {
    return b.points - a.points;
  }

  // 2. Comparer les confrontations directes (si même nombre de points)
  const h2hResult = compareHeadToHead(headToHeadMap, a.name, b.name);
  if (h2hResult !== 0) {
    return h2hResult;
  }

  // 3. Comparer la différence de buts générale (ordre décroissant)
  const diffA = a.pointsFor - a.pointsAgainst;
  const diffB = b.pointsFor - b.pointsAgainst;
  if (diffB !== diffA) {
    return diffB - diffA;
  }

  // 4. Comparer les buts marqués (ordre décroissant)
  return b.pointsFor - a.pointsFor;
}
