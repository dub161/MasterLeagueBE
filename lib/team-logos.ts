
import { prisma } from '@/lib/db';
import { downloadFile } from '@/lib/s3';

// Mapping des noms d'équipes vers leurs logos par défaut
export const TEAM_LOGOS: Record<string, string> = {
  'wavre': '/teams/wavre.png',
  'bc wavre': '/teams/wavre.png',
  'uaae': '/teams/uaae.png',
  'royal uaae': '/teams/uaae.png',
  'rallye': '/teams/rallye.png',
  'rallye uccle': '/teams/rallye.png',
  'berchem': '/teams/berchem.png',
  'ecole europeenne': '/teams/ecole-europeenne.png',
  'ecole': '/teams/ecole-europeenne.png',
  'dilbeek': '/teams/dilbeek.png',
  'bertem': '/teams/bertem.png',
  'dynamo bertem': '/teams/bertem.png',
  'asa st hubert': '/teams/asa-st-hubert.png',
  'st hubert': '/teams/asa-st-hubert.png',
  'argentine': '/teams/argentine.png',
  'haacht': '/teams/haacht.png',
  'captains': '/teams/captains.png',
  'captains aalst': '/teams/captains.png',
  'opwijk': '/teams/opwijk.png',
  'chalet': '/teams/chalet.png',
  'p1 anderlecht': '/teams/p1-anderlecht.png',
  'anderlecht': '/teams/p1-anderlecht.png',
  'anderlecht bb': '/teams/p1-anderlecht.png',
  'la cordiale': '/teams/la-cordiale.png',
  'cordiale': '/teams/la-cordiale.png',
  'canter': '/teams/canter.png',
  'royal ottignies': '/teams/royal-ottignies.jpg',
  'rebond ottignies': '/teams/royal-ottignies.jpg',
  'ottignies': '/teams/royal-ottignies.jpg',
  // Nouveaux logos ajoutés
  'tigers halle': '/teams/tigers-halle.png',
  'tigers': '/teams/tigers-halle.png',
  'halle': '/teams/tigers-halle.png',
  'avenir evere': '/teams/avenir-evere.png',
  'avenir': '/teams/avenir-evere.png',
  'evere': '/teams/avenir-evere.png',
  'ollnight': '/teams/ollnight.png',
  'ollnights': '/teams/ollnight.png',
  'wobac': '/teams/wobac.png',
  'pajot': '/teams/pajot.png',
  'bc pajot': '/teams/pajot.png',
  'bc opwijk': '/teams/bc-opwijk.png',
  'genappe': '/teams/genappe.png',
  'asse ternat': '/teams/asse-ternat.jpg',
  'asse': '/teams/asse-ternat.jpg',
  'ternat': '/teams/asse-ternat.jpg',
  'rca jette': '/teams/rca-jette.jpg',
  'jette': '/teams/rca-jette.jpg',
  'rca': '/teams/rca-jette.jpg',
  'ujk': '/teams/ujk.png',
  'runners': '/teams/runners.jpg',
  'runners st-gilles': '/teams/runners.jpg',
  'st-gilles': '/teams/runners.jpg',
  'machelen': '/teams/machelen.png',
};

// Fonction pour obtenir le logo d'une équipe (version asynchrone pour vérifier la base de données)
export async function getTeamLogoUrl(teamName: string | null | undefined): Promise<string | null> {
  if (!teamName) return null;
  
  try {
    // D'abord, vérifier si un logo personnalisé existe en base de données
    const customLogo = await prisma.teamLogo.findUnique({
      where: { teamName },
    });

    if (customLogo) {
      // Générer une URL signée pour le logo personnalisé
      const signedUrl = await downloadFile(customLogo.cloudStoragePath);
      return signedUrl;
    }
  } catch (error) {
    console.error('Error fetching custom logo:', error);
  }

  // Sinon, utiliser le logo par défaut
  const normalized = teamName.toLowerCase().trim();
  
  // Recherche exacte
  if (TEAM_LOGOS[normalized]) {
    return TEAM_LOGOS[normalized];
  }
  
  // Recherche partielle
  for (const [key, logo] of Object.entries(TEAM_LOGOS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return logo;
    }
  }
  
  return null;
}

// Fonction synchrone pour obtenir le logo par défaut (pour les composants client)
export function getTeamLogo(teamName: string | null | undefined): string | null {
  if (!teamName) return null;
  
  const normalized = teamName.toLowerCase().trim();
  
  // Recherche exacte
  if (TEAM_LOGOS[normalized]) {
    return TEAM_LOGOS[normalized];
  }
  
  // Recherche partielle
  for (const [key, logo] of Object.entries(TEAM_LOGOS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return logo;
    }
  }
  
  return null;
}

// Liste des équipes avec leurs logos pour le sélecteur
export const TEAMS_WITH_LOGOS = [
  { name: 'Wavre', logo: '/teams/wavre.png' },
  { name: 'UAAE', logo: '/teams/uaae.png' },
  { name: 'Rallye', logo: '/teams/rallye.png' },
  { name: 'Berchem', logo: '/teams/berchem.png' },
  { name: 'Ecole Europeenne', logo: '/teams/ecole-europeenne.png' },
  { name: 'Dilbeek', logo: '/teams/dilbeek.png' },
  { name: 'Bertem', logo: '/teams/bertem.png' },
  { name: 'ASA St Hubert', logo: '/teams/asa-st-hubert.png' },
  { name: 'Argentine', logo: '/teams/argentine.png' },
  { name: 'Haacht', logo: '/teams/haacht.png' },
  { name: 'Captains', logo: '/teams/captains.png' },
  { name: 'Opwijk', logo: '/teams/opwijk.png' },
  { name: 'Chalet', logo: '/teams/chalet.png' },
  { name: 'P1 Anderlecht', logo: '/teams/p1-anderlecht.png' },
  { name: 'La Cordiale', logo: '/teams/la-cordiale.png' },
  { name: 'Canter', logo: '/teams/canter.png' },
  { name: 'OTTIGNIES', logo: '/teams/royal-ottignies.jpg' },
  // Nouveaux logos ajoutés
  { name: 'Tigers Halle', logo: '/teams/tigers-halle.png' },
  { name: 'Avenir Evere', logo: '/teams/avenir-evere.png' },
  { name: 'Ollnight', logo: '/teams/ollnight.png' },
  { name: 'Wobac', logo: '/teams/wobac.png' },
  { name: 'Pajot', logo: '/teams/pajot.png' },
  { name: 'BC Opwijk', logo: '/teams/bc-opwijk.png' },
  { name: 'Genappe', logo: '/teams/genappe.png' },
  { name: 'Asse Ternat', logo: '/teams/asse-ternat.jpg' },
  { name: 'RCA Jette', logo: '/teams/rca-jette.jpg' },
  { name: 'UJK', logo: '/teams/ujk.png' },
  { name: 'Runners', logo: '/teams/runners.jpg' },
  { name: 'Machelen', logo: '/teams/machelen.png' },
].sort((a, b) => a.name.localeCompare(b.name));
