

import * as XLSX from 'xlsx';
import { format, parse, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface ExcelMatch {
  semaine?: string;
  jour?: string;
  periode?: string;
  date: Date;
  division: string;
  heure?: string;
  equipedomicile: string;
  equipeexterieur: string;
  handicapeInitialDomicile?: string;
  handicapeInitialExterieur?: string;
  scoredomicile?: number;
  scoreexterieur?: number;
  lieu?: string;
  adresse?: string;
  ville?: string;
  saison: string;
}

export interface ParseResult {
  matches: ExcelMatch[];
  errors: string[];
  totalRows: number;
  corrections: {
    yearCorrected: number;        // Nombre de matchs dont l'année a été corrigée
    excludedFinalRound: number;   // Lignes « CUP » (phase finale) exclues car gérées par l'application
    unknownDivisions: string[];   // Valeurs de division brutes non reconnues
    normalizedTeams: number;      // Noms d'équipes normalisés (ex: UAAE -> ROYALE UAAE)
    detectedSaison: string;       // Saison détectée depuis les dates
  };
}

// Table de correspondance pour les noms tronqués
const TEAM_NAME_CORRECTIONS: Record<string, string> = {
  'REBOND OTTIGN': 'REBOND OTTIGNIES',
  'ECOLE EUROPE': 'ECOLE EUROPEENNE',
  // Ajouter d'autres corrections au besoin
};

// Normalisation des noms d'équipes vers un nom canonique unique
// (évite qu'une même équipe apparaisse sous deux orthographes dans les classements)
const TEAM_NAME_NORMALIZATIONS: Record<string, string> = {
  'UAAE': 'ROYALE UAAE',
};

function normalizeTeamName(name: string): { name: string; changed: boolean } {
  const key = (name || '').trim().toUpperCase();
  const canonical = TEAM_NAME_NORMALIZATIONS[key];
  if (canonical && canonical.toUpperCase() !== key) {
    return { name: canonical, changed: true };
  }
  return { name, changed: false };
}

// Mapping des codes de division du fichier vers le format canonique de l'application.
// Conventions: A -> Division 1, B -> Division 2, C -> Division 3, ...
//              CUP X -> Division BEKX (coupe BEK, groupe X)
//              CUP seul -> phase finale (placeholder géré par l'application) -> exclu
//              2A / 2B / valeurs numériques -> conservées telles quelles
function mapDivision(raw: string): { division: string | null; excluded: boolean; unknown: boolean } {
  const v = (raw || '').trim().toUpperCase();
  if (!v) return { division: null, excluded: false, unknown: true };

  // Coupe BEK
  if (v.startsWith('CUP')) {
    const rest = v.slice(3).trim();
    if (!rest) {
      // « CUP » sans lettre = emplacement de la phase finale (bracket généré par l'application)
      return { division: null, excluded: true, unknown: false };
    }
    return { division: `Division BEK${rest.replace(/\s+/g, '')}`, excluded: false, unknown: false };
  }

  // Déjà au format BEK (ex: « BEKA »)
  if (v.startsWith('BEK')) {
    return { division: `Division ${v.replace(/\s+/g, '')}`, excluded: false, unknown: false };
  }

  // Division championnat sous forme d'une seule lettre: A -> 1, B -> 2, ...
  if (/^[A-Z]$/.test(v)) {
    const num = v.charCodeAt(0) - 64; // A=1, B=2, C=3...
    return { division: `Division ${num}`, excluded: false, unknown: false };
  }

  // Division déjà numérique (ex: « 1 », « 2 »)
  if (/^\d+$/.test(v)) {
    return { division: `Division ${v}`, excluded: false, unknown: false };
  }

  // Sous-divisions (2A, 2B...) ou autres: conservées telles quelles
  if (/^\d+[A-Z]$/.test(v)) {
    return { division: `Division ${v}`, excluded: false, unknown: false };
  }

  // Valeur non reconnue: on conserve la valeur brute mais on la signale
  return { division: `Division ${raw.trim()}`, excluded: false, unknown: true };
}

// Fonction pour extraire l'handicap et nettoyer le nom de l'équipe
function extractHandicapAndCleanTeamName(teamName: string): { cleanName: string; handicap?: string } {
  if (!teamName) return { cleanName: '' };
  
  // Chercher un "+" ou une "(" dans le nom
  const plusIndex = teamName.indexOf('+');
  const parenIndex = teamName.indexOf('(');
  
  // Déterminer quel séparateur vient en premier (s'il existe)
  let splitIndex = -1;
  let handicap: string | undefined;
  
  if (plusIndex !== -1 && parenIndex !== -1) {
    // Les deux existent, prendre le premier
    splitIndex = Math.min(plusIndex, parenIndex);
  } else if (plusIndex !== -1) {
    splitIndex = plusIndex;
  } else if (parenIndex !== -1) {
    splitIndex = parenIndex;
  }
  
  let cleanName: string;
  if (splitIndex !== -1) {
    cleanName = teamName.substring(0, splitIndex).trim();
    handicap = teamName.substring(splitIndex).trim();
  } else {
    cleanName = teamName.trim();
  }
  
  // Vérifier si c'est un nom tronqué et le corriger
  const normalizedName = cleanName.toUpperCase();
  for (const [truncated, full] of Object.entries(TEAM_NAME_CORRECTIONS)) {
    if (normalizedName === truncated.toUpperCase()) {
      cleanName = full;
      break;
    }
  }
  
  return { cleanName, handicap };
}

// Correction automatique des dates basée sur l'année du 2e semestre
function correctDateYear(date: Date, secondSemesterYear: number): Date {
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  const correctedDate = new Date(date);
  
  if (month >= 7) { // Juillet-Décembre (2e semestre)
    correctedDate.setFullYear(secondSemesterYear);
  } else { // Janvier-Juin (1er semestre)
    correctedDate.setFullYear(secondSemesterYear + 1);
  }
  
  return correctedDate;
}

// Fonction pour parser différents formats de date (sans correction)
function parseDateRaw(dateValue: any): Date | null {
  if (!dateValue) return null;
  
  // Si c'est déjà une date
  if (dateValue instanceof Date && isValid(dateValue)) {
    return dateValue;
  }
  
  // Si c'est un nombre (format Excel)
  if (typeof dateValue === 'number') {
    const excelDate = XLSX.SSF.parse_date_code(dateValue);
    if (excelDate) {
      const date = new Date(excelDate.y, excelDate.m - 1, excelDate.d);
      return date;
    }
  }
  
  // Si c'est une string, essayer plusieurs formats
  if (typeof dateValue === 'string') {
    const formats = [
      'dd/MM/yyyy',
      'dd-MM-yyyy',
      'yyyy-MM-dd',
      'MM/dd/yyyy',
      'dd/MM/yy',
      'dd-MM-yy'
    ];
    
    for (const formatString of formats) {
      try {
        const parsed = parse(dateValue, formatString, new Date());
        if (isValid(parsed)) {
          return parsed;
        }
      } catch {
        // Continue to next format
      }
    }
  }
  
  return null;
}

export function parseExcelFile(buffer: Buffer, filename: string): ParseResult {
  const errors: string[] = [];
  const matches: ExcelMatch[] = [];
  
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Chercher la feuille contenant "CHRONOLOG" (ex: "CHRONOLOGIC", "CHRONOLOG 123", etc.)
    let sheetName = workbook.SheetNames[0];
    let isChronologic = false;
    
    // Vérifier s'il y a une feuille contenant "CHRONOLOG" (plus flexible pour les variations)
    for (const name of workbook.SheetNames) {
      if (name.toUpperCase().includes('CHRONOLOG')) {
        sheetName = name;
        isChronologic = true;
        break;
      }
    }
    
    // Si pas de feuille chronolog, vérifier si le nom du fichier l'indique
    if (!isChronologic) {
      isChronologic = filename?.toUpperCase().includes('CHRONOLOG');
    }
    
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir en JSON avec raw=true pour garder les nombres Excel
    const rawData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: null,
      raw: true
    });
    
    if (!rawData || rawData.length === 0) {
      errors.push('Le fichier Excel est vide');
      return {
        matches: [], errors, totalRows: 0,
        corrections: { yearCorrected: 0, excludedFinalRound: 0, unknownDivisions: [], normalizedTeams: 0, detectedSaison: '' },
      };
    }
    
    const totalRows = rawData.length;
    
    // Déterminer la saison par défaut (sera mise à jour plus tard)
    let defaultSaison = '2025-2026';
    
    // Structure des fichiers analysée:
    // MASTERS BASIC (calendrier): semaine(0), jour(1), periode(2), date(3), division(4), heure(5), domicile(6), vide(7), exterieur(8), vide(9), lieu(10), adresse(11), ville(12)
    // CHRONOLOGIC (résultats): semaine(0), jour(1), vide(2), date(3), division(4), heure(5), domicile(6), vide(7), exterieur(8), vide(9), lieu(10), adresse(11), ville(12), scoredom(13), scoreext(14)
    
    // Déterminer la ligne de départ (détecter automatiquement l'en-tête)
    let startIndex = 0;
    
    // Vérifier si la première ligne est une en-tête ou vide
    if (rawData.length > 0) {
      const firstRow = rawData[0] as any[];
      if (firstRow && firstRow.length > 0) {
        const firstRowStr = firstRow.join('').toLowerCase();
        // Si la ligne contient des mots typiques d'en-tête, la sauter
        if (firstRowStr.includes('home') || firstRowStr.includes('away') || firstRowStr.includes('rang')) {
          startIndex = 1;
        }
        // Si la première ligne est complètement vide, la sauter
        const isEmpty = firstRow.every(cell => cell === null || cell === undefined || cell === '');
        if (isEmpty) {
          startIndex = 1;
        }
      }
    }
    
    // PREMIÈRE PASSE: Trouver l'année du 2e semestre (juillet-décembre) et déterminer la saison
    let secondSemesterYear = 2025; // Valeur par défaut
    let seasonDetected = false;
    
    for (let i = startIndex; i < rawData.length; i++) {
      const row = rawData[i] as any[];
      if (!row || row.length < 4) continue;
      
      const dateValue = row[3];
      const parsedDate = parseDateRaw(dateValue);
      if (parsedDate) {
        const month = parsedDate.getMonth() + 1;
        const year = parsedDate.getFullYear();
        
        if (!seasonDetected) {
          // Déterminer la saison en fonction du mois
          if (month >= 7) { // Juillet-Décembre = début de saison
            defaultSaison = `${year}-${year + 1}`;
            secondSemesterYear = year;
          } else { // Janvier-Juin = fin de saison
            defaultSaison = `${year - 1}-${year}`;
            secondSemesterYear = year - 1;
          }
          seasonDetected = true;
        }
        
        if (month >= 7) { // Juillet-Décembre
          secondSemesterYear = year;
          break; // On a trouvé l'année de référence
        }
      }
    }
    
    // Compteurs des corrections appliquées (pour le rapport de cohérence)
    let yearCorrected = 0;
    let excludedFinalRound = 0;
    let normalizedTeams = 0;
    const unknownDivisionsSet = new Set<string>();

    // DEUXIÈME PASSE: Parser chaque ligne avec correction de l'année
    for (let i = startIndex; i < rawData.length; i++) {
      const row = rawData[i] as any[];
      if (!row || row.length < 9) continue;
      
      try {
        // Extraire les données selon la structure analysée
        const dateValue = row[3]; // Index 3 = date
        const division = row[4]?.toString()?.trim(); // Index 4 = division
        const equipedomicileRaw = row[6]?.toString()?.trim(); // Index 6 = équipe domicile
        const equipeexterieurRaw = row[8]?.toString()?.trim(); // Index 8 = équipe extérieur
        
        // Vérifier les champs obligatoires
        if (!dateValue || !division || !equipedomicileRaw || !equipeexterieurRaw || 
            division === 'rang' || equipedomicileRaw === 'home' || equipeexterieurRaw === 'away') {
          // Ignorer les lignes d'en-tête ou incomplètes
          continue;
        }
        
        // Parser la date sans correction
        const parsedDate = parseDateRaw(dateValue);
        if (!parsedDate) {
          errors.push(`Ligne ${i + 1}: Format de date invalide: ${dateValue}`);
          continue;
        }
        
        // Mapper la division vers le format canonique de l'application
        const divInfo = mapDivision(division);
        if (divInfo.excluded) {
          // Ligne « CUP » (phase finale) : gérée par l'application, pas importée
          excludedFinalRound++;
          continue;
        }
        if (!divInfo.division) {
          // Division vide / non exploitable : ignorer la ligne
          continue;
        }
        if (divInfo.unknown) {
          unknownDivisionsSet.add(division);
        }
        
        // Appliquer la correction de l'année
        const correctedDate = correctDateYear(parsedDate, secondSemesterYear);
        if (correctedDate.getFullYear() !== parsedDate.getFullYear()) {
          yearCorrected++;
        }
        
        // Extraire l'handicap et nettoyer les noms d'équipes
        const domicileData = extractHandicapAndCleanTeamName(equipedomicileRaw);
        const exterieurData = extractHandicapAndCleanTeamName(equipeexterieurRaw);
        
        // Normaliser les noms d'équipes vers un nom canonique unique
        const domNorm = normalizeTeamName(domicileData.cleanName);
        const extNorm = normalizeTeamName(exterieurData.cleanName);
        if (domNorm.changed) normalizedTeams++;
        if (extNorm.changed) normalizedTeams++;
        
        // Formater l'heure en hh:mm
        let heureFormatted = row[5]?.toString()?.trim();
        if (heureFormatted) {
          // Si l'heure est un nombre décimal (format Excel), le convertir
          const numericTime = parseFloat(heureFormatted.replace(',', '.'));
          if (!isNaN(numericTime) && numericTime < 1) {
            // Format Excel (fraction de jour)
            const hours = Math.floor(numericTime * 24);
            const minutes = Math.floor((numericTime * 24 - hours) * 60);
            heureFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          } else {
            // Format texte : accepter "21:15", "21.15", "21h15", etc.
            const timeParts = heureFormatted.match(/(\d+)[:.,h]?(\d+)?/);
            if (timeParts) {
              const hours = timeParts[1].padStart(2, '0');
              const minutes = (timeParts[2] || '00').padStart(2, '0');
              heureFormatted = `${hours}:${minutes}`;
            }
          }
        }
        
        // Construire l'objet match
        const match: ExcelMatch = {
          semaine: row[0]?.toString()?.trim() || undefined, // Index 0 = semaine
          jour: row[1]?.toString()?.trim() || undefined, // Index 1 = jour
          periode: row[2]?.toString()?.trim() || undefined, // Index 2 = période (peut être vide pour chronologic)
          date: correctedDate, // Utiliser la date corrigée
          division: divInfo.division, // Division au format canonique
          heure: heureFormatted, // Heure formatée
          equipedomicile: domNorm.name,
          equipeexterieur: extNorm.name,
          handicapeInitialDomicile: domicileData.handicap,
          handicapeInitialExterieur: exterieurData.handicap,
          lieu: row[10]?.toString()?.trim() || undefined, // Index 10 = lieu
          adresse: row[11]?.toString()?.trim() || undefined, // Index 11 = adresse
          ville: row[12]?.toString()?.trim() || undefined, // Index 12 = ville
          saison: defaultSaison
        };
        
        // Parser les scores si présents (seulement pour CHRONOLOGIC)
        if (isChronologic && row.length > 13) {
          const scoredomValue = row[13]; // Index 13 = score domicile
          const scoreextValue = row[14]; // Index 14 = score extérieur
          
          if (scoredomValue !== null && scoredomValue !== undefined && scoredomValue !== '') {
            const scoreDom = parseInt(scoredomValue.toString());
            if (!isNaN(scoreDom)) match.scoredomicile = scoreDom;
          }
          
          if (scoreextValue !== null && scoreextValue !== undefined && scoreextValue !== '') {
            const scoreExt = parseInt(scoreextValue.toString());
            if (!isNaN(scoreExt)) match.scoreexterieur = scoreExt;
          }
        }
        
        matches.push(match);
        
      } catch (error) {
        errors.push(`Ligne ${i + 1}: Erreur de parsing - ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }
    
    return {
      matches, errors, totalRows,
      corrections: {
        yearCorrected,
        excludedFinalRound,
        unknownDivisions: Array.from(unknownDivisionsSet),
        normalizedTeams,
        detectedSaison: defaultSaison,
      },
    };
    
  } catch (error) {
    errors.push(`Erreur lors de la lecture du fichier Excel: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    return {
      matches: [], errors, totalRows: 0,
      corrections: { yearCorrected: 0, excludedFinalRound: 0, unknownDivisions: [], normalizedTeams: 0, detectedSaison: '' },
    };
  }
}
