'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  ChevronDown,
  ChevronUp,
  Rocket,
  Bug,
  Sparkles,
  Wrench,
  ArrowLeft,
} from 'lucide-react';

type ChangeType = 'feature' | 'fix' | 'improvement' | 'refactor';

interface Change {
  type: ChangeType;
  description: string;
}

interface Release {
  version: string;
  date: string;
  title: string;
  description: string;
  changes: Change[];
  isLatest?: boolean;
}

const changeTypeConfig: Record<ChangeType, { label: string; icon: typeof Rocket; color: string }> = {
  feature: { label: 'Nouveauté', icon: Sparkles, color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  fix: { label: 'Correction', icon: Bug, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  improvement: { label: 'Amélioration', icon: Rocket, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  refactor: { label: 'Refactoring', icon: Wrench, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
};

const releases: Release[] = [
  {
    version: '2.5',
    date: '9 octobre 2026',
    title: 'Saison 2026-2027',
    description: 'Import du calendrier de la nouvelle saison 2026-2027 (championnat Division 1 & 2 et coupe) avec bracket de coupe mis à jour.',
    isLatest: true,
    changes: [
      { type: 'feature', description: 'Nouvelle saison 2026-2027 disponible : championnat (Division 1 & 2) et coupe (poules A à H).' },
      { type: 'feature', description: 'Division A = Division 1 et Division B = Division 2 pour simplifier la lecture.' },
      { type: 'improvement', description: 'Nouveau tableau de la coupe 2026-2027 : quarts HA, GB, FC, ED → demis HAGB / EDFC → finale.' },
      { type: 'improvement', description: 'Les tableaux de coupe des saisons précédentes restent inchangés (BE, AD, CF, HG).' },
      { type: 'improvement', description: 'Le bouton Division 3 n’apparaît que pour les saisons qui en contiennent.' },
      { type: 'improvement', description: 'La saison 2026-2027 est sélectionnée par défaut à l’ouverture.' },
    ],
  },
  {
    version: '2.4',
    date: '14 avril 2026',
    title: 'Arbre de Coupe & Bracket',
    description: 'Correction de la progression logique du bracket de coupe (CUP4 → CUP2 → CUP1) et amélioration du filtre équipe.',
    changes: [
      { type: 'fix', description: 'Progression du bracket corrigée : les quarts (CUP4) sont maintenant ordonnés selon les poules BEK réelles (BE, AD, CF, HG).' },
      { type: 'fix', description: 'Demi-finales correctement positionnées : BEAD (slot 1) et CFHG (slot 2) respectent le chemin des équipes depuis les quarts.' },
      { type: 'improvement', description: 'Identification des équipes par appartenance directe aux poules BEK (au lieu du fuzzy matching sur les noms).' },
      { type: 'improvement', description: 'Labels du bracket mis à jour : BE, AD, CF, HG pour les quarts et BEAD, CFHG pour les demis.' },
      { type: 'fix', description: 'Slots vides conservés comme placeholders "À déterminer" pour maintenir les positions correctes dans l\'arbre.' },
      { type: 'fix', description: 'Le filtre équipe phare ne masque plus les autres matchs en vue playoffs — il surligne simplement l\'équipe sélectionnée.' },
      { type: 'improvement', description: 'Règles de qualification mises à jour avec le détail complet des pairings CUP4, CUP2 et CUP1.' },
    ],
  },
  {
    version: '2.3',
    date: '2 avril 2026',
    title: 'Play-offs Championnat',
    description: 'Système complet de play-offs avec classements dynamiques, filtrage par date et gestion aller/retour.',
    changes: [
      { type: 'feature', description: 'Configuration des groupes de play-offs : définition des équipes, positions, divisions source et dates de début via la page admin.' },
      { type: 'feature', description: 'Classements play-offs en temps réel : calcul automatique des standings par groupe avec les règles H2H existantes.' },
      { type: 'feature', description: 'Onglet "Play-offs" dans la page Classements avec affichage de tous les groupes configurés.' },
      { type: 'feature', description: 'Section play-offs sur la page d\'accueil : affiche le classement du groupe concerné pour l\'équipe sélectionnée.' },
      { type: 'feature', description: 'Remplissage automatique des équipes depuis les classements, avec prise en compte de la date de début (classement calculé avant les play-offs).' },
      { type: 'improvement', description: 'Les classements de saison régulière excluent automatiquement les matchs joués après la date de début des play-offs correspondants.' },
      { type: 'fix', description: 'Les matchs de subdivisions (2A, 2B) ne polluent plus les classements play-offs — seuls les matchs de la division principale sont comptabilisés.' },
      { type: 'fix', description: 'Correction de la déduplication : les matchs aller (A dom vs B ext) et retour (B dom vs A ext) sont maintenant correctement distingués.' },
    ],
  },
  {
    version: '2.2',
    date: '23 mars 2026',
    title: 'Phase Finale Coupe',
    description: 'Refonte complète de l\'arbre des playoffs et intégration sur la page d\'accueil.',
    changes: [
      { type: 'feature', description: 'Section "Phase Finale Coupe" sur la page d\'accueil : affiche automatiquement le parcours d\'une équipe en phase éliminatoire (tour, adversaire, date, score).' },
      { type: 'feature', description: 'Refonte de l\'arbre playoffs avec connecteurs SVG dynamiques et cartes placeholder "À déterminer".' },
      { type: 'fix', description: 'Les quarts de finale en convention "CUP" (en plus de "BEK") sont maintenant visibles dans l\'arbre playoff.' },
      { type: 'improvement', description: 'Filtrage intelligent : les divisions playoff (CUP4, BEK4, CUP2, BEK2, etc.) sont exclues des classements championnat standard.' },
    ],
  },
  {
    version: '2.1',
    date: '18 mars 2026',
    title: 'Forfeits visuels',
    description: 'Indicateurs visuels et gestion rapide des matchs forfait.',
    changes: [
      { type: 'feature', description: 'Badges forfait "FF DOM", "FF EXT", "DOUBLE FF" dans le tableau des matchs.' },
      { type: 'feature', description: 'Détection automatique des scores forfait : 20-0, 0-20, 0-0.' },
      { type: 'feature', description: 'Boutons forfait rapides dans la modal d\'édition pour appliquer un score en un clic.' },
      { type: 'improvement', description: 'Fond rouge subtil pour les matchs forfait dans la liste.' },
    ],
  },
  {
    version: '2.0',
    date: '13 mars 2026',
    title: 'Gestion des matchs & Audit',
    description: 'Interface complète de gestion des matchs avec déduplication et journal d\'audit.',
    changes: [
      { type: 'feature', description: 'Page Match Management : visualisation, édition et suppression des matchs avec pagination et filtres avancés (saison, division, équipe, dates).' },
      { type: 'feature', description: 'Déduplication avec audit : modèle DeletedMatch pour tracer les matchs supprimés automatiquement, avec possibilité de restauration.' },
      { type: 'fix', description: 'Correction de l\'appel async getDisplayName dans le journal d\'audit.' },
      { type: 'fix', description: 'Correction des caractères unicode dans la gestion des matchs.' },
    ],
  },
  {
    version: '1.9',
    date: '12 mars 2026',
    title: 'Tiebreaker Head-to-Head',
    description: 'Implémentation des règles officielles de départage.',
    changes: [
      { type: 'feature', description: 'Départage tête-à-tête : Points totaux → Confrontations directes (victoires puis différence de points) → Goal-average général → Points marqués.' },
      { type: 'improvement', description: 'Appliqué sur tous les classements : championnat, coupe et page d\'accueil.' },
    ],
  },
  {
    version: '1.8',
    date: '6 février 2026',
    title: 'Neutralisation des couleurs',
    description: 'Traitement visuel uniforme pour toutes les équipes.',
    changes: [
      { type: 'refactor', description: 'Suppression du highlight spécial pour Rebond Ottignies.' },
      { type: 'improvement', description: 'Toutes les équipes ont le même style visuel : vert=victoire, rouge=défaite, gris=nul.' },
    ],
  },
  {
    version: '1.7',
    date: '8-10 décembre 2025',
    title: 'Nouveaux logos & Déduplication',
    description: 'Ajout massif de logos d\'équipes et service robuste de déduplication.',
    changes: [
      { type: 'feature', description: '12 nouveaux logos d\'équipes : Tigers Halle, UJK, Ollnight, Pajot, Machelen, Genappe, Opwijk, Wobac, RCA Jette, Runners, Avenir Evere, Asse-Ternat.' },
      { type: 'feature', description: 'Service de déduplication robuste pour fusionner les doublons d\'importation Excel.' },
      { type: 'fix', description: 'Correction de l\'affichage des matchs dupliqués en coupe.' },
      { type: 'improvement', description: 'La déduplication conserve le match le plus récemment importé.' },
    ],
  },
  {
    version: '1.6',
    date: '2 décembre 2025',
    title: 'Système de points unifié',
    description: 'Centralisation du calcul des points selon les règles officielles.',
    changes: [
      { type: 'refactor', description: 'Module points-calculator.ts centralisé avec règles 3-1-2-0 (Victoire=3, Nul=1, Défaite=2, Forfait=0).' },
      { type: 'fix', description: 'Même logique de calcul appliquée sur toutes les pages (accueil, classements, coupe).' },
    ],
  },
  {
    version: '1.5',
    date: '27-28 novembre 2025',
    title: 'Logos cloud & Team Management',
    description: 'Upload de logos vers le cloud et corrections du module de gestion d\'équipes.',
    changes: [
      { type: 'feature', description: 'Upload des logos d\'équipes vers AWS S3 avec URLs signées.' },
      { type: 'fix', description: 'Correction des filtres saison/équipe sur la page Team Management.' },
      { type: 'fix', description: 'Correction de la réponse API Team Management (teams au lieu de teamNames).' },
    ],
  },
  {
    version: '1.4',
    date: '25-26 novembre 2025',
    title: 'Multilingue & Dashboard interactif',
    description: 'Support complet FR/EN/NL et interface utilisateur enrichie.',
    changes: [
      { type: 'feature', description: 'Système multilingue complet : Français, English, Nederlands.' },
      { type: 'feature', description: 'Page admin sécurisée avec sélecteur d\'équipe phare.' },
      { type: 'feature', description: 'Classement Coupe BEK affiché sur la page d\'accueil.' },
      { type: 'feature', description: 'Sélection d\'équipe persistante entre les pages via contexte React global.' },
      { type: 'feature', description: 'Sections de matchs repliables ("Show more") sur la page d\'accueil.' },
      { type: 'fix', description: 'Corrections multiples : liste d\'équipes, contexte de sélection, saison 2025-2026.' },
    ],
  },
  {
    version: '1.3',
    date: '24 novembre 2025',
    title: 'Classements complets',
    description: 'Amélioration des classements et détection dynamique des feuilles Excel.',
    changes: [
      { type: 'improvement', description: 'Inclusion de toutes les équipes dans les classements (plus seulement l\'équipe filtrée).' },
      { type: 'improvement', description: 'Détection dynamique des feuilles Excel avec fallback CHRONOLOG.' },
    ],
  },
  {
    version: '1.2',
    date: '3 novembre 2025',
    title: 'Parser Chronologic & Corrections',
    description: 'Support de la feuille CHRONOLOGIC dans les fichiers Excel.',
    changes: [
      { type: 'feature', description: 'Support de la feuille "CHRONOLOGIC" dans les fichiers Excel pour extraire les scores.' },
      { type: 'fix', description: 'Correction du parser ligne 2 chronologic.' },
      { type: 'fix', description: 'Corrections des heures, divisions et aliases par saison.' },
    ],
  },
  {
    version: '1.1',
    date: '19-21 octobre 2025',
    title: 'Logos, Playoffs & Aliases',
    description: 'Intégration visuelle et première version de l\'arbre éliminatoire.',
    changes: [
      { type: 'feature', description: 'Intégration du thème Masters League avec logos d\'équipes et système de gestion.' },
      { type: 'feature', description: 'Première version de l\'arbre éliminatoire BEK (playoffs).' },
      { type: 'feature', description: 'Système d\'alias pour harmoniser les noms d\'équipes entre fichiers Excel.' },
      { type: 'improvement', description: 'Auto-adaptation des divisions et layout responsive.' },
      { type: 'improvement', description: 'Harmonisation des noms d\'équipes via TeamAlias.' },
    ],
  },
  {
    version: '1.0',
    date: '19 octobre 2025',
    title: 'Lancement initial',
    description: 'Première version complète de l\'application Masters League Belgium.',
    changes: [
      { type: 'feature', description: 'Import de fichiers Excel (MASTERS BASIC) avec extraction des matchs, scores, divisions et saisons.' },
      { type: 'feature', description: 'Base de données PostgreSQL avec modèles Match et UploadedFile.' },
      { type: 'feature', description: 'Page Championnat avec classements par division.' },
      { type: 'feature', description: 'Page Coupe BEK avec filtres et éliminatoires.' },
      { type: 'feature', description: 'Gestion des fichiers uploadés et nettoyage de la base de données.' },
      { type: 'feature', description: 'Navigation complète entre les pages avec bouton retour.' },
    ],
  },
];

function ReleaseCard({ release }: { release: Release }) {
  const [isExpanded, setIsExpanded] = useState(release.isLatest || false);

  return (
    <Card className={`transition-all duration-200 ${
      release.isLatest
        ? 'border-orange-300 shadow-lg shadow-orange-100/50 dark:border-orange-700 dark:shadow-orange-900/20'
        : 'hover:shadow-md'
    }`}>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${
              release.isLatest
                ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}>
              v{release.version}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {release.title}
                {release.isLatest && (
                  <Badge className="bg-orange-500 text-white text-xs hover:bg-orange-600">
                    Dernière version
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {release.date}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {release.description}
        </p>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-2.5 border-t pt-4">
            {release.changes.map((change, idx) => {
              const config = changeTypeConfig[change.type];
              const Icon = config.icon;
              return (
                <div key={idx} className="flex items-start gap-3">
                  <Badge
                    variant="secondary"
                    className={`text-xs shrink-0 mt-0.5 ${config.color}`}
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {config.label}
                  </Badge>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {change.description}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function ReleaseNotesPage() {
  const totalFeatures = releases.reduce(
    (acc, r) => acc + r.changes.filter((c) => c.type === 'feature').length,
    0
  );
  const totalFixes = releases.reduce(
    (acc, r) => acc + r.changes.filter((c) => c.type === 'fix').length,
    0
  );
  const totalImprovements = releases.reduce(
    (acc, r) => acc + r.changes.filter((c) => c.type === 'improvement').length,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Rocket className="w-6 h-6 text-orange-500" />
                Release Notes
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Historique des versions et fonctionnalités de Masters League Belgium
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin-settings">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" size="sm">
                  <Home className="w-4 h-4 mr-2" />
                  Accueil
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center p-4">
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{releases.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Versions</p>
          </Card>
          <Card className="text-center p-4">
            <p className="text-3xl font-bold text-emerald-600">{totalFeatures}</p>
            <p className="text-xs text-muted-foreground mt-1">Nouveautés</p>
          </Card>
          <Card className="text-center p-4">
            <p className="text-3xl font-bold text-red-600">{totalFixes}</p>
            <p className="text-xs text-muted-foreground mt-1">Corrections</p>
          </Card>
          <Card className="text-center p-4">
            <p className="text-3xl font-bold text-blue-600">{totalImprovements}</p>
            <p className="text-xs text-muted-foreground mt-1">Améliorations</p>
          </Card>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[23px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-orange-300 via-slate-200 to-slate-200 dark:from-orange-700 dark:via-slate-700 dark:to-slate-700" />

          <div className="space-y-5">
            {releases.map((release) => (
              <div key={release.version} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className={`relative z-10 w-[48px] h-[48px] shrink-0 flex items-center justify-center`}>
                  <div className={`w-3 h-3 rounded-full ${
                    release.isLatest
                      ? 'bg-orange-500 ring-4 ring-orange-200 dark:ring-orange-900'
                      : 'bg-slate-300 dark:bg-slate-600'
                  }`} />
                </div>
                {/* Card */}
                <div className="flex-1 -mt-1">
                  <ReleaseCard release={release} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            🏀 Masters League Belgium — Championnat Vétérans +35
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Première version déployée le 19 octobre 2025
          </p>
        </div>
      </div>
    </div>
  );
}
