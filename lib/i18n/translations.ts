export type Locale = 'fr' | 'en' | 'nl';

export type TranslationKeys = {
  common: {
    home: string;
    results: string;
    championshipStandings: string;
    cupEliminations: string;
    teamLogos: string;
    teamManagement: string;
    languageSettings: string;
    language: string;
    french: string;
    english: string;
    dutch: string;
    selectLanguage: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    upload: string;
    download: string;
    search: string;
    filter: string;
    all: string;
    loading: string;
    error: string;
    success: string;
    noData: string;
    backToHome: string;
    filters: string;
    saison: string;
    none: string;
    drawn: string;
    forfeit: string;
    subtitle: string;
  };
  nav: {
    dashboard: string;
    results: string;
    standings: string;
    cup: string;
    management: string;
    championshipStandings: string;
    cupEliminations: string;
  };
  dashboard: {
    title: string;
    welcomeMessage: string;
    uploadExcel: string;
    manageTeams: string;
    viewResults: string;
    quickAccess: string;
    selectTeam: string;
    selectTeamDescription: string;
  };
  results: {
    title: string;
    allResults: string;
    upcomingMatches: string;
    matchDate: string;
    homeTeam: string;
    awayTeam: string;
    score: string;
    handicap: string;
    finalScore: string;
    division: string;
    saison: string;
    noResults: string;
    noUpcomingMatches: string;
    filterBySaison: string;
    filterByDivision: string;
    filterByGroup: string;
    allDivisions: string;
    allGroups: string;
    tableTitle: string;
    useFilters: string;
    lastMatchPlayed: string;
    nextMatchScheduled: string;
    previousMatches: string;
    followingMatches: string;
    showPreviousMatches: string;
    hidePreviousMatches: string;
    showFollowingMatches: string;
    hideFollowingMatches: string;
    scheduled: string;
  };
  standings: {
    title: string;
    championshipStandings: string;
    division: string;
    selectDivision: string;
    selectSaison: string;
    team: string;
    played: string;
    won: string;
    lost: string;
    drawn: string;
    pointsFor: string;
    pointsAgainst: string;
    difference: string;
    points: string;
    noStandings: string;
    rank: string;
    equipePhare: string;
    equipePhareOptional: string;
    selectTeam: string;
    noTeamSelected: string;
    nbResultsVisible: string;
    resultCount_one: string;
    resultCount_other: string;
    subtitle: string;
    group: string;
    groupA: string;
    groupB: string;
    all_groups: string;
    loadingStandings: string;
    teamsCount: string;
    noDataForDivision: string;
    latestResults: string;
    lastNMatchesTeam: string;
    lastNMatchesAll: string;
    noRecentMatches: string;
    clickToSelectTeam: string;
  };
  cup: {
    title: string;
    cupEliminations: string;
    group: string;
    selectGroup: string;
    selectSaison: string;
    playoffBracket: string;
    groupStandings: string;
    noPlayoffData: string;
    quarterFinals: string;
    semiFinals: string;
    final: string;
    winner: string;
    poules: string;
    playoffs: string;
    groupMatches: string;
    playoffTree: string;
    qualificationRules: string;
    qualificationTitle: string;
    qualificationDesc: string;
    onlyFirstQualified: string;
    winnerDeterminedBy: string;
    equipePhare: string;
    noTeamSelected: string;
    selectTeam: string;
    subtitle: string;
    noDataForGroup: string;
    teamNotInPlayoffs: string;
    noPlayoffsAvailable: string;
  };
  teamLogos: {
    title: string;
    manageLogos: string;
    uploadLogo: string;
    teamName: string;
    currentLogo: string;
    actions: string;
    noLogo: string;
    uploadSuccess: string;
    uploadError: string;
    deleteSuccess: string;
    deleteError: string;
    selectTeam: string;
    selectFile: string;
  };
  teamManagement: {
    title: string;
    manageAliases: string;
    displayName: string;
    originalNames: string;
    saison: string;
    actions: string;
    addAlias: string;
    editAlias: string;
    deleteAlias: string;
    applyRetroactive: string;
    saveSuccess: string;
    saveError: string;
    deleteSuccess: string;
    deleteError: string;
    enterDisplayName: string;
    enterOriginalNames: string;
    selectSaison: string;
  };
  upload: {
    title: string;
    uploadExcelFile: string;
    selectFile: string;
    dragAndDrop: string;
    supportedFormats: string;
    uploadSuccess: string;
    uploadError: string;
    processing: string;
    filesUploaded: string;
    fileName: string;
    uploadedAt: string;
    actions: string;
  };
  languageSettings: {
    title: string;
    selectYourLanguage: string;
    comparisonTable: string;
    translationKey: string;
    french: string;
    english: string;
    dutch: string;
    description: string;
    commonTerms: string;
    navigation: string;
    resultsPage: string;
    standingsPage: string;
    cupPage: string;
    teamManagementPage: string;
  };
};

export const translations: Record<Locale, TranslationKeys> = {
  fr: {
    common: {
      home: 'Accueil',
      results: 'Résultats',
      championshipStandings: 'Classement Championship',
      cupEliminations: 'Éliminations Coupe',
      teamLogos: 'Logos des Équipes',
      teamManagement: 'Gestion des Équipes',
      languageSettings: 'Paramètres de Langue',
      language: 'Langue',
      french: 'Français',
      english: 'Anglais',
      dutch: 'Néerlandais',
      selectLanguage: 'Sélectionner la langue',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      add: 'Ajouter',
      upload: 'Télécharger',
      download: 'Télécharger',
      search: 'Rechercher',
      filter: 'Filtrer',
      all: 'Tous',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      noData: 'Aucune donnée disponible',
      backToHome: "Retour à l'accueil",
      filters: 'Filtres',
      saison: 'Saison',
      none: 'Aucun',
      drawn: 'Nuls',
      forfeit: 'Forfait',
      subtitle: 'Basketball Vétérans +35 ans',
    },
    nav: {
      dashboard: 'Tableau de bord',
      results: 'Résultats',
      standings: 'Classements',
      cup: 'Coupe',
      management: 'Gestion',
      championshipStandings: 'Classements Championnat',
      cupEliminations: 'Éliminations Coupe',
    },
    dashboard: {
      title: 'Tableau de bord',
      welcomeMessage: 'Bienvenue sur la plateforme de gestion des Masters Vétérans',
      uploadExcel: 'Télécharger un fichier Excel',
      manageTeams: 'Gérer les équipes',
      viewResults: 'Voir les résultats',
      quickAccess: 'Accès rapide',
      selectTeam: 'Sélectionnez votre équipe',
      selectTeamDescription: 'Choisissez une équipe pour voir ses résultats, classements et statistiques',
    },
    results: {
      title: 'Résultats et Matchs',
      allResults: 'Tous les résultats du championnat vétérans avec filtres et tri',
      upcomingMatches: 'Matchs à venir',
      matchDate: 'Date du match',
      homeTeam: 'Équipe à domicile',
      awayTeam: 'Équipe visiteuse',
      score: 'Score',
      handicap: 'Handicap',
      finalScore: 'Score final',
      division: 'Division',
      saison: 'Saison',
      noResults: 'Aucun résultat disponible',
      noUpcomingMatches: 'Aucun match à venir',
      filterBySaison: 'Utilisez les filtres ci-dessous pour affiner votre recherche',
      filterByDivision: 'Filtrer par division',
      filterByGroup: 'Filtrer par groupe',
      allDivisions: 'Toutes les divisions',
      allGroups: 'Tous les groupes',
      tableTitle: 'Tableau des résultats',
      useFilters: 'Utilisez les filtres ci-dessous pour affiner votre recherche',
      lastMatchPlayed: 'Dernier match joué',
      nextMatchScheduled: 'Prochain match à venir',
      previousMatches: 'Matchs précédents',
      followingMatches: 'Matchs suivants',
      showPreviousMatches: 'Voir les {count} matchs précédents',
      hidePreviousMatches: 'Masquer les matchs précédents',
      showFollowingMatches: 'Voir les {count} matchs suivants',
      hideFollowingMatches: 'Masquer les matchs suivants',
      scheduled: 'À venir',
    },
    standings: {
      title: 'Classements',
      championshipStandings: 'Championnat',
      division: 'Division',
      selectDivision: 'Sélectionner une division',
      selectSaison: 'Sélectionner une saison',
      team: 'Équipe',
      played: 'J',
      won: 'V',
      lost: 'D',
      drawn: 'N',
      pointsFor: 'Pts+',
      pointsAgainst: 'Pts-',
      difference: 'Diff',
      points: 'Pts',
      noStandings: 'Aucun classement disponible',
      rank: 'Rang',
      equipePhare: 'Équipe Phare',
      equipePhareOptional: 'Équipe Phare (optionnel)',
      selectTeam: 'Sélectionner une équipe...',
      noTeamSelected: 'Aucune équipe phare',
      nbResultsVisible: 'Nombre de résultats visibles',
      resultCount_one: '1 résultat',
      resultCount_other: 'résultats',
      subtitle: 'Suivez les classements et résultats de chaque division',
      group: 'Groupe',
      groupA: 'Groupe A',
      groupB: 'Groupe B',
      all_groups: 'Toutes',
      loadingStandings: 'Chargement des classements...',
      teamsCount: 'équipes',
      noDataForDivision: 'Aucune donnée disponible pour cette division',
      latestResults: 'Derniers Résultats',
      lastNMatchesTeam: "Les {n} derniers matchs de l'équipe sélectionnée",
      lastNMatchesAll: 'Les {n} derniers matchs de chaque équipe',
      noRecentMatches: 'Aucun match récent',
      clickToSelectTeam: 'Cliquez pour sélectionner comme équipe phare et adapter la division',
    },
    cup: {
      title: 'Éliminatoires',
      cupEliminations: 'Coupe',
      group: 'Groupe',
      selectGroup: 'Sélectionner un groupe',
      selectSaison: 'Sélectionner une saison',
      playoffBracket: 'Tableau des éliminatoires',
      groupStandings: 'Classement Groupe',
      noPlayoffData: 'Aucune donnée de playoff disponible',
      quarterFinals: 'Quarts de finale',
      semiFinals: 'Demi-finales',
      final: 'Finale',
      winner: 'Vainqueur',
      poules: 'Poules',
      playoffs: 'Phase Finale',
      groupMatches: 'Matchs du Groupe',
      playoffTree: 'Arbre des Phases Finales',
      qualificationRules: 'Règles de Qualification',
      qualificationTitle: 'Qualification',
      qualificationDesc: 'Seuls les 1ers de chaque poule sont qualifiés pour les phases finales. Le vainqueur est déterminé par le nombre de points, puis la différence de points.',
      onlyFirstQualified: 'Les 1ers de chaque poule sont qualifiés',
      winnerDeterminedBy: 'Le vainqueur est déterminé par le nombre de points',
      equipePhare: 'Équipe Phare',
      noTeamSelected: 'Aucune équipe phare',
      selectTeam: 'Sélectionner une équipe...',
      subtitle: 'Poules et phases finales de la coupe',
      noDataForGroup: 'Aucune donnée disponible pour ce groupe',
      teamNotInPlayoffs: "Votre équipe n'a pas participé aux phases finales",
      noPlayoffsAvailable: 'Aucune phase finale disponible pour cette saison',
    },
    teamLogos: {
      title: 'Logos des Équipes',
      manageLogos: 'Gérer les logos des équipes',
      uploadLogo: 'Télécharger un logo',
      teamName: 'Nom de l\'équipe',
      currentLogo: 'Logo actuel',
      actions: 'Actions',
      noLogo: 'Aucun logo',
      uploadSuccess: 'Logo téléchargé avec succès',
      uploadError: 'Erreur lors du téléchargement du logo',
      deleteSuccess: 'Logo supprimé avec succès',
      deleteError: 'Erreur lors de la suppression du logo',
      selectTeam: 'Sélectionner une équipe',
      selectFile: 'Sélectionner un fichier',
    },
    teamManagement: {
      title: 'Gestion des Équipes',
      manageAliases: 'Gérer les alias des équipes',
      displayName: 'Nom affiché',
      originalNames: 'Noms originaux',
      saison: 'Saison',
      actions: 'Actions',
      addAlias: 'Ajouter un alias',
      editAlias: 'Modifier l\'alias',
      deleteAlias: 'Supprimer l\'alias',
      applyRetroactive: 'Appliquer rétroactivement',
      saveSuccess: 'Alias enregistré avec succès',
      saveError: 'Erreur lors de l\'enregistrement de l\'alias',
      deleteSuccess: 'Alias supprimé avec succès',
      deleteError: 'Erreur lors de la suppression de l\'alias',
      enterDisplayName: 'Entrer le nom affiché',
      enterOriginalNames: 'Entrer les noms originaux (séparés par des virgules)',
      selectSaison: 'Sélectionner une saison',
    },
    upload: {
      title: 'Téléchargement',
      uploadExcelFile: 'Télécharger un fichier Excel',
      selectFile: 'Sélectionner un fichier',
      dragAndDrop: 'Glisser-déposer un fichier ici',
      supportedFormats: 'Formats supportés: .xlsx, .xls',
      uploadSuccess: 'Fichier téléchargé avec succès',
      uploadError: 'Erreur lors du téléchargement du fichier',
      processing: 'Traitement en cours...',
      filesUploaded: 'Fichiers téléchargés',
      fileName: 'Nom du fichier',
      uploadedAt: 'Téléchargé le',
      actions: 'Actions',
    },
    languageSettings: {
      title: 'Paramètres de Langue',
      selectYourLanguage: 'Sélectionnez votre langue',
      comparisonTable: 'Tableau de comparaison des traductions',
      translationKey: 'Clé de traduction',
      french: 'Français',
      english: 'Anglais',
      dutch: 'Néerlandais',
      description: 'Description',
      commonTerms: 'Termes communs',
      navigation: 'Navigation',
      resultsPage: 'Page des résultats',
      standingsPage: 'Page des classements',
      cupPage: 'Page de la coupe',
      teamManagementPage: 'Page de gestion des équipes',
    },
  },
  en: {
    common: {
      home: 'Home',
      results: 'Results',
      championshipStandings: 'Championship Standings',
      cupEliminations: 'Cup Eliminations',
      teamLogos: 'Team Logos',
      teamManagement: 'Team Management',
      languageSettings: 'Language Settings',
      language: 'Language',
      french: 'French',
      english: 'English',
      dutch: 'Dutch',
      selectLanguage: 'Select language',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      upload: 'Upload',
      download: 'Download',
      search: 'Search',
      filter: 'Filter',
      all: 'All',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      noData: 'No data available',
      backToHome: "Back to home",
      filters: 'Filters',
      saison: 'Season',
      none: 'None',
      drawn: 'Draws',
      forfeit: 'Forfeit',
      subtitle: 'Veterans Basketball +35 years',
    },
    nav: {
      dashboard: 'Dashboard',
      results: 'Results',
      standings: 'Standings',
      cup: 'Cup',
      management: 'Management',
      championshipStandings: 'Championship Standings',
      cupEliminations: 'Cup Eliminations',
    },
    dashboard: {
      title: 'Dashboard',
      welcomeMessage: 'Welcome to the Masters Veterans Management Platform',
      uploadExcel: 'Upload an Excel file',
      manageTeams: 'Manage teams',
      viewResults: 'View results',
      quickAccess: 'Quick access',
      selectTeam: 'Select your team',
      selectTeamDescription: 'Choose a team to see its results, standings and statistics',
    },
    results: {
      title: 'Results and Scheduled',
      allResults: 'All results from the veterans championship with filters and sorting',
      upcomingMatches: 'Upcoming matches',
      matchDate: 'Match date',
      homeTeam: 'Home team',
      awayTeam: 'Away team',
      score: 'Score',
      handicap: 'Handicap',
      finalScore: 'Final score',
      division: 'Division',
      saison: 'Season',
      noResults: 'No results available',
      noUpcomingMatches: 'No upcoming matches',
      filterBySaison: 'Use the filters below to refine your search',
      filterByDivision: 'Filter by division',
      filterByGroup: 'Filter by group',
      allDivisions: 'All divisions',
      allGroups: 'All groups',
      tableTitle: 'Results table',
      useFilters: 'Use the filters below to refine your search',
      lastMatchPlayed: 'Last match played',
      nextMatchScheduled: 'Next scheduled match',
      previousMatches: 'Previous matches',
      followingMatches: 'Following matches',
      showPreviousMatches: 'Show {count} previous matches',
      hidePreviousMatches: 'Hide previous matches',
      showFollowingMatches: 'Show {count} following matches',
      hideFollowingMatches: 'Hide following matches',
      scheduled: 'Scheduled',
    },
    standings: {
      title: 'Standings',
      championshipStandings: 'Championship',
      division: 'Division',
      selectDivision: 'Select a division',
      selectSaison: 'Select a season',
      team: 'Team',
      played: 'P',
      won: 'W',
      lost: 'L',
      drawn: 'D',
      pointsFor: 'PF',
      pointsAgainst: 'PA',
      difference: 'Diff',
      points: 'Pts',
      noStandings: 'No standings available',
      rank: 'Rank',
      equipePhare: 'Star Team',
      equipePhareOptional: 'Star Team (optional)',
      selectTeam: 'Select a team...',
      noTeamSelected: 'No star team',
      nbResultsVisible: 'Number of visible results',
      resultCount_one: '1 result',
      resultCount_other: 'results',
      subtitle: 'Follow standings and results for each division',
      group: 'Group',
      groupA: 'Group A',
      groupB: 'Group B',
      all_groups: 'All',
      loadingStandings: 'Loading standings...',
      teamsCount: 'teams',
      noDataForDivision: 'No data available for this division',
      latestResults: 'Latest Results',
      lastNMatchesTeam: "Last {n} matches of the selected team",
      lastNMatchesAll: "Last {n} matches of each team",
      noRecentMatches: 'No recent matches',
      clickToSelectTeam: 'Click to select as star team and adapt division',
    },
    cup: {
      title: 'Eliminations',
      cupEliminations: 'Cup',
      group: 'Group',
      selectGroup: 'Select a group',
      selectSaison: 'Select a season',
      playoffBracket: 'Playoff bracket',
      groupStandings: 'Group Standings',
      noPlayoffData: 'No playoff data available',
      quarterFinals: 'Quarter finals',
      semiFinals: 'Semi finals',
      final: 'Final',
      winner: 'Winner',
      poules: 'Groups',
      playoffs: 'Playoffs',
      groupMatches: 'Group Matches',
      playoffTree: 'Playoff Tree',
      qualificationRules: 'Qualification Rules',
      qualificationTitle: 'Qualification',
      qualificationDesc: 'Only the 1st of each group qualifies for the playoffs. The winner is determined by the number of points, then by the point difference.',
      onlyFirstQualified: '1st of each group qualifies',
      winnerDeterminedBy: 'Winner determined by points',
      equipePhare: 'Star Team',
      noTeamSelected: 'No star team',
      selectTeam: 'Select a team...',
      subtitle: 'Groups and playoffs of the cup',
      noDataForGroup: 'No data available for this group',
      teamNotInPlayoffs: "Your team did not participate in the playoffs",
      noPlayoffsAvailable: 'No playoffs available for this season',
    },
    teamLogos: {
      title: 'Team Logos',
      manageLogos: 'Manage team logos',
      uploadLogo: 'Upload a logo',
      teamName: 'Team name',
      currentLogo: 'Current logo',
      actions: 'Actions',
      noLogo: 'No logo',
      uploadSuccess: 'Logo uploaded successfully',
      uploadError: 'Error uploading logo',
      deleteSuccess: 'Logo deleted successfully',
      deleteError: 'Error deleting logo',
      selectTeam: 'Select a team',
      selectFile: 'Select a file',
    },
    teamManagement: {
      title: 'Team Management',
      manageAliases: 'Manage team aliases',
      displayName: 'Display name',
      originalNames: 'Original names',
      saison: 'Season',
      actions: 'Actions',
      addAlias: 'Add alias',
      editAlias: 'Edit alias',
      deleteAlias: 'Delete alias',
      applyRetroactive: 'Apply retroactively',
      saveSuccess: 'Alias saved successfully',
      saveError: 'Error saving alias',
      deleteSuccess: 'Alias deleted successfully',
      deleteError: 'Error deleting alias',
      enterDisplayName: 'Enter display name',
      enterOriginalNames: 'Enter original names (comma-separated)',
      selectSaison: 'Select a season',
    },
    upload: {
      title: 'Upload',
      uploadExcelFile: 'Upload an Excel file',
      selectFile: 'Select a file',
      dragAndDrop: 'Drag and drop a file here',
      supportedFormats: 'Supported formats: .xlsx, .xls',
      uploadSuccess: 'File uploaded successfully',
      uploadError: 'Error uploading file',
      processing: 'Processing...',
      filesUploaded: 'Uploaded files',
      fileName: 'File name',
      uploadedAt: 'Uploaded on',
      actions: 'Actions',
    },
    languageSettings: {
      title: 'Language Settings',
      selectYourLanguage: 'Select your language',
      comparisonTable: 'Translation comparison table',
      translationKey: 'Translation key',
      french: 'French',
      english: 'English',
      dutch: 'Dutch',
      description: 'Description',
      commonTerms: 'Common terms',
      navigation: 'Navigation',
      resultsPage: 'Results page',
      standingsPage: 'Standings page',
      cupPage: 'Cup page',
      teamManagementPage: 'Team management page',
    },
  },
  nl: {
    common: {
      home: 'Home',
      results: 'Resultaten',
      championshipStandings: 'Kampioenschap Klassement',
      cupEliminations: 'Beker Eliminaties',
      teamLogos: 'Team Logo\'s',
      teamManagement: 'Teambeheer',
      languageSettings: 'Taalinstellingen',
      language: 'Taal',
      french: 'Frans',
      english: 'Engels',
      dutch: 'Nederlands',
      selectLanguage: 'Selecteer taal',
      save: 'Opslaan',
      cancel: 'Annuleren',
      delete: 'Verwijderen',
      edit: 'Bewerken',
      add: 'Toevoegen',
      upload: 'Uploaden',
      download: 'Downloaden',
      search: 'Zoeken',
      filter: 'Filteren',
      all: 'Alle',
      loading: 'Laden...',
      error: 'Fout',
      success: 'Succes',
      noData: 'Geen gegevens beschikbaar',
      backToHome: "Terug naar home",
      filters: 'Filters',
      saison: 'Seizoen',
      none: 'Geen',
      drawn: 'Gelijk',
      forfeit: 'Forfait',
      subtitle: 'Veteranen Basketbal +35 jaar',
    },
    nav: {
      dashboard: 'Dashboard',
      results: 'Resultaten',
      standings: 'Klassementen',
      cup: 'Beker',
      management: 'Beheer',
      championshipStandings: 'Kampioenschap Klassement',
      cupEliminations: 'Beker Eliminaties',
    },
    dashboard: {
      title: 'Dashboard',
      welcomeMessage: 'Welkom bij het Masters Veteranen Beheerplatform',
      uploadExcel: 'Upload een Excel-bestand',
      manageTeams: 'Teams beheren',
      viewResults: 'Resultaten bekijken',
      quickAccess: 'Snelle toegang',
      selectTeam: 'Selecteer uw team',
      selectTeamDescription: 'Kies een team om de resultaten, standen en statistieken te zien',
    },
    results: {
      title: 'Resultaten en Wedstrijden',
      allResults: 'Alle resultaten van het veteranenkampioenschap met filters en sortering',
      upcomingMatches: 'Aankomende wedstrijden',
      matchDate: 'Wedstrijddatum',
      homeTeam: 'Thuisteam',
      awayTeam: 'Uitteam',
      score: 'Score',
      handicap: 'Handicap',
      finalScore: 'Eindscore',
      division: 'Divisie',
      saison: 'Seizoen',
      noResults: 'Geen resultaten beschikbaar',
      noUpcomingMatches: 'Geen aankomende wedstrijden',
      filterBySaison: 'Gebruik de onderstaande filters om uw zoekopdracht te verfijnen',
      filterByDivision: 'Filteren op divisie',
      filterByGroup: 'Filteren op groep',
      allDivisions: 'Alle divisies',
      allGroups: 'Alle groepen',
      tableTitle: 'Resultaten tabel',
      useFilters: 'Gebruik de onderstaande filters om uw zoekopdracht te verfijnen',
      lastMatchPlayed: 'Laatste gespeelde wedstrijd',
      nextMatchScheduled: 'Volgende geplande wedstrijd',
      previousMatches: 'Vorige wedstrijden',
      followingMatches: 'Volgende wedstrijden',
      showPreviousMatches: 'Toon {count} vorige wedstrijden',
      hidePreviousMatches: 'Verberg vorige wedstrijden',
      showFollowingMatches: 'Toon {count} volgende wedstrijden',
      hideFollowingMatches: 'Verberg volgende wedstrijden',
      scheduled: 'Gepland',
    },
    standings: {
      title: 'Klassementen',
      championshipStandings: 'Kampioenschap',
      division: 'Divisie',
      selectDivision: 'Selecteer een divisie',
      selectSaison: 'Selecteer een seizoen',
      team: 'Team',
      played: 'G',
      won: 'W',
      lost: 'V',
      drawn: 'G',
      pointsFor: 'Ptn+',
      pointsAgainst: 'Ptn-',
      difference: 'Versch',
      points: 'Ptn',
      noStandings: 'Geen klassement beschikbaar',
      rank: 'Rang',
      equipePhare: 'Speerpunt Team',
      equipePhareOptional: 'Speerpunt Team (optioneel)',
      selectTeam: 'Selecteer een team...',
      noTeamSelected: 'Geen speerpunt team',
      nbResultsVisible: 'Aantal zichtbare resultaten',
      resultCount_one: '1 resultaat',
      resultCount_other: 'resultaten',
      subtitle: 'Volg klassementen en resultaten voor elke divisie',
      group: 'Groep',
      groupA: 'Groep A',
      groupB: 'Groep B',
      all_groups: 'Alle',
      loadingStandings: 'Klassementen laden...',
      teamsCount: 'teams',
      noDataForDivision: 'Geen gegevens beschikbaar voor deze divisie',
      latestResults: 'Laatste Resultaten',
      lastNMatchesTeam: "Laatste {n} wedstrijden van het geselecteerde team",
      lastNMatchesAll: "Laatste {n} wedstrijden van elk team",
      noRecentMatches: 'Geen recente wedstrijden',
      clickToSelectTeam: 'Klik om te selecteren als speerpunt team en pas divisie aan',
    },
    cup: {
      title: 'Eliminaties',
      cupEliminations: 'Beker',
      group: 'Groep',
      selectGroup: 'Selecteer een groep',
      selectSaison: 'Selecteer een seizoen',
      playoffBracket: 'Playoff schema',
      groupStandings: 'Groepsklassement',
      noPlayoffData: 'Geen playoff gegevens beschikbaar',
      quarterFinals: 'Kwartfinales',
      semiFinals: 'Halve finales',
      final: 'Finale',
      winner: 'Winnaar',
      poules: 'Poules',
      playoffs: 'Playoffs',
      groupMatches: 'Groepswedstrijden',
      playoffTree: 'Playoff Schema',
      qualificationRules: 'Kwalificatieregels',
      qualificationTitle: 'Kwalificatie',
      qualificationDesc: 'Alleen de nummer 1 van elke poule kwalificeert zich voor de playoffs. De winnaar wordt bepaald door het aantal punten, vervolgens door het puntenverschil.',
      onlyFirstQualified: 'Nummer 1 van elke poule kwalificeert zich',
      winnerDeterminedBy: 'Winnaar bepaald door punten',
      equipePhare: 'Speerpunt Team',
      noTeamSelected: 'Geen speerpunt team',
      selectTeam: 'Selecteer een team...',
      subtitle: 'Poules en playoffs van de beker',
      noDataForGroup: 'Geen gegevens beschikbaar voor deze groep',
      teamNotInPlayoffs: "Uw team heeft niet deelgenomen aan de playoffs",
      noPlayoffsAvailable: 'Geen playoffs beschikbaar voor dit seizoen',
    },
    teamLogos: {
      title: 'Team Logo\'s',
      manageLogos: 'Team logo\'s beheren',
      uploadLogo: 'Upload een logo',
      teamName: 'Teamnaam',
      currentLogo: 'Huidig logo',
      actions: 'Acties',
      noLogo: 'Geen logo',
      uploadSuccess: 'Logo succesvol geüpload',
      uploadError: 'Fout bij uploaden logo',
      deleteSuccess: 'Logo succesvol verwijderd',
      deleteError: 'Fout bij verwijderen logo',
      selectTeam: 'Selecteer een team',
      selectFile: 'Selecteer een bestand',
    },
    teamManagement: {
      title: 'Teambeheer',
      manageAliases: 'Team aliassen beheren',
      displayName: 'Weergavenaam',
      originalNames: 'Originele namen',
      saison: 'Seizoen',
      actions: 'Acties',
      addAlias: 'Alias toevoegen',
      editAlias: 'Alias bewerken',
      deleteAlias: 'Alias verwijderen',
      applyRetroactive: 'Retroactief toepassen',
      saveSuccess: 'Alias succesvol opgeslagen',
      saveError: 'Fout bij opslaan alias',
      deleteSuccess: 'Alias succesvol verwijderd',
      deleteError: 'Fout bij verwijderen alias',
      enterDisplayName: 'Voer weergavenaam in',
      enterOriginalNames: 'Voer originele namen in (gescheiden door komma\'s)',
      selectSaison: 'Selecteer een seizoen',
    },
    upload: {
      title: 'Uploaden',
      uploadExcelFile: 'Upload een Excel-bestand',
      selectFile: 'Selecteer een bestand',
      dragAndDrop: 'Sleep en zet een bestand hier neer',
      supportedFormats: 'Ondersteunde formaten: .xlsx, .xls',
      uploadSuccess: 'Bestand succesvol geüpload',
      uploadError: 'Fout bij uploaden bestand',
      processing: 'Verwerken...',
      filesUploaded: 'Geüploade bestanden',
      fileName: 'Bestandsnaam',
      uploadedAt: 'Geüpload op',
      actions: 'Acties',
    },
    languageSettings: {
      title: 'Taalinstellingen',
      selectYourLanguage: 'Selecteer uw taal',
      comparisonTable: 'Vertaalvergelijkingstabel',
      translationKey: 'Vertaalsleutel',
      french: 'Frans',
      english: 'Engels',
      dutch: 'Nederlands',
      description: 'Beschrijving',
      commonTerms: 'Veelgebruikte termen',
      navigation: 'Navigatie',
      resultsPage: 'Resultaten pagina',
      standingsPage: 'Klassementen pagina',
      cupPage: 'Beker pagina',
      teamManagementPage: 'Teambeheer pagina',
    },
  },
};
