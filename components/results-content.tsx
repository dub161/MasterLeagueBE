
"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  ChevronUp, 
  ChevronDown, 
  Filter, 
  X, 
  Calendar,
  MapPin,
  Trophy,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TeamLogo } from "@/components/team-logo";
import { useTeamSelection } from "@/lib/team-selection-context";

interface Match {
  id: string;
  date: string;
  heure?: string;
  division: string;
  equipedomicile: string;
  equipeexterieur: string;
  handicapeInitialDomicile?: string;
  handicapeInitialExterieur?: string;
  scoredomicile?: number;
  scoreexterieur?: number;
  lieu?: string;
  ville?: string;
  saison: string;
}

interface Filters {
  equipes: string[];
  divisions: string[];
  saisons: string[];
}

type SortField = 'date' | 'division' | 'equipedomicile' | 'equipeexterieur' | 'lieu';
type SortOrder = 'asc' | 'desc';

export function ResultsContent() {
  const { selectedTeam, saison: selectedSaison } = useTeamSelection();
  const [matches, setMatches] = useState<Match[]>([]);
  const [filters, setFilters] = useState<Filters>({ equipes: [], divisions: [], saisons: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [currentFilters, setCurrentFilters] = useState({
    equipe: selectedTeam || 'all',
    division: 'all',
    saison: selectedSaison || '2025-2026'
  });
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Update filters when context changes
  useEffect(() => {
    if (selectedTeam) {
      setCurrentFilters(prev => ({
        ...prev,
        equipe: selectedTeam,
        saison: selectedSaison || '2025-2026'
      }));
    }
  }, [selectedTeam, selectedSaison]);

  // Charger les filtres disponibles
  const loadFilters = useCallback(async () => {
    try {
      const response = await fetch('/api/filters');
      const data = await response.json();
      if (data.success) {
        setFilters(data.filters);
      }
    } catch (error) {
      console.error('Erreur chargement filtres:', error);
      toast.error('Erreur lors du chargement des filtres');
    }
  }, []);

  // Charger les matchs
  const loadMatches = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        sortBy: sortField,
        sortOrder: sortOrder,
        ...(currentFilters.equipe !== 'all' && { equipe: currentFilters.equipe }),
        ...(currentFilters.division !== 'all' && { division: currentFilters.division }),
        ...(currentFilters.saison !== 'all' && { saison: currentFilters.saison }),
      });

      const response = await fetch(`/api/matches?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setMatches(data.matches || []);
      } else {
        toast.error('Erreur lors du chargement des matchs');
      }
    } catch (error) {
      console.error('Erreur chargement matchs:', error);
      toast.error('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  }, [currentFilters, sortField, sortOrder]);

  // Chargements initiaux
  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // Gérer le tri
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setCurrentFilters({
      equipe: 'all',
      division: 'all',
      saison: 'all'
    });
  };

  // Composant de tri pour les headers
  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 hover:text-orange-600 transition-colors w-full text-left"
    >
      <span>{children}</span>
      {sortField === field && (
        sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
      )}
    </button>
  );

  // Formatter le score
  const formatScore = (scoreDom?: number, scoreExt?: number) => {
    if (scoreDom !== undefined && scoreExt !== undefined) {
      return `${scoreDom} - ${scoreExt}`;
    }
    return '-';
  };

  // Nettoyer le nom de la division (enlever "Division" et remplacer BEK/CUP par COUPE)
  const cleanDivisionName = (division: string) => {
    let cleaned = division.replace(/^Division\s+/i, '');
    cleaned = cleaned.replace(/BEK\d*/gi, 'COUPE');
    cleaned = cleaned.replace(/CUP\d*/gi, 'COUPE');
    // Si le nom contient "COUPE", normaliser vers "COUPE"
    if (cleaned.toUpperCase().includes('COUPE')) {
      return 'COUPE';
    }
    return cleaned;
  };

  // Grouper les divisions pour le filtre (agréger toutes les divisions COUPE/BEK/CUP)
  const groupDivisions = (divisions: string[]) => {
    const grouped = new Set<string>();
    divisions.forEach(div => {
      const cleaned = cleanDivisionName(div);
      grouped.add(cleaned);
    });
    return Array.from(grouped).sort();
  };

  // Déterminer le gagnant et le perdant
  const getWinnerLoser = (scoreDom?: number, scoreExt?: number) => {
    if (scoreDom === undefined || scoreExt === undefined) {
      return { winner: null, isDraw: false };
    }
    if (scoreDom === scoreExt) {
      return { winner: null, isDraw: true };
    }
    return { winner: scoreDom > scoreExt ? 'home' : 'away', isDraw: false };
  };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Filter className="h-5 w-5 mr-2 text-orange-600" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Équipe</label>
              <Select 
                value={currentFilters.equipe} 
                onValueChange={(value) => setCurrentFilters({...currentFilters, equipe: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les équipes</SelectItem>
                  {filters.equipes.map((equipe) => (
                    <SelectItem key={equipe} value={equipe}>
                      {equipe}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Division</label>
              <Select 
                value={currentFilters.division} 
                onValueChange={(value) => setCurrentFilters({...currentFilters, division: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les divisions</SelectItem>
                  {groupDivisions(filters.divisions).map((division) => (
                    <SelectItem key={division} value={division}>
                      {division}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Saison</label>
              <Select 
                value={currentFilters.saison} 
                onValueChange={(value) => setCurrentFilters({...currentFilters, saison: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les saisons</SelectItem>
                  {filters.saisons.map((saison) => (
                    <SelectItem key={saison} value={saison}>
                      {saison}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={resetFilters}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compteur de résultats */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          <span className="font-medium">{matches.length}</span> résultat{matches.length > 1 ? 's' : ''} trouvé{matches.length > 1 ? 's' : ''}
        </p>
        
        {/* Filtres actifs */}
        {(currentFilters.equipe !== 'all' || currentFilters.division !== 'all' || currentFilters.saison !== 'all') && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Filtres actifs:</span>
            {currentFilters.equipe !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Équipe: {currentFilters.equipe}
              </Badge>
            )}
            {currentFilters.division !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Division: {cleanDivisionName(currentFilters.division)}
              </Badge>
            )}
            {currentFilters.saison !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Saison: {currentFilters.saison}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Tableau des résultats */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun résultat trouvé</h3>
              <p className="text-gray-500">
                Essayez de modifier vos filtres ou de charger des données
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      <SortButton field="date">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Date & Heure
                      </SortButton>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      <SortButton field="division">Division</SortButton>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      <SortButton field="equipedomicile">
                        <Users className="h-4 w-4 inline mr-1" />
                        Équipe Domicile
                      </SortButton>
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Score
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      <SortButton field="equipeexterieur">
                        <Users className="h-4 w-4 inline mr-1" />
                        Équipe Extérieur
                      </SortButton>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      <SortButton field="lieu">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        Lieu
                      </SortButton>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {matches.map((match) => {
                    const { winner, isDraw } = getWinnerLoser(match.scoredomicile, match.scoreexterieur);
                    
                    return (
                      <tr key={match.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 text-sm">
                          <div>
                            <div className="font-medium text-gray-900">
                              {format(new Date(match.date), 'dd/MM/yyyy', { locale: fr })}
                            </div>
                            {match.heure && (
                              <div className="text-gray-500 text-xs">{match.heure}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <Badge variant="outline" className="text-xs">
                            {cleanDivisionName(match.division)}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex items-center space-x-3">
                            <TeamLogo teamName={match.equipedomicile} size={32} />
                            <div className="flex items-center space-x-2 flex-1">
                              <span className={`font-medium px-2 py-1 rounded ${
                                winner === 'home'
                                  ? 'text-green-700 bg-green-100 font-semibold'
                                  : winner === 'away'
                                  ? 'text-red-700 bg-red-100'
                                  : isDraw
                                  ? 'text-gray-700 bg-gray-100'
                                  : 'text-gray-900 bg-transparent'
                              }`}>
                                {match.equipedomicile}
                              </span>
                              {match.handicapeInitialDomicile && (
                                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                  {match.handicapeInitialDomicile}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-center">
                          <span className={`font-mono font-bold ${
                            formatScore(match.scoredomicile, match.scoreexterieur) !== '-' 
                              ? 'text-blue-600 bg-blue-50 px-2 py-1 rounded' 
                              : 'text-gray-400'
                          }`}>
                            {formatScore(match.scoredomicile, match.scoreexterieur)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex items-center space-x-3">
                            <TeamLogo teamName={match.equipeexterieur} size={32} />
                            <div className="flex items-center space-x-2 flex-1">
                              <span className={`font-medium px-2 py-1 rounded ${
                                winner === 'away'
                                  ? 'text-green-700 bg-green-100 font-semibold'
                                  : winner === 'home'
                                  ? 'text-red-700 bg-red-100'
                                  : isDraw
                                  ? 'text-gray-700 bg-gray-100'
                                  : 'text-gray-900 bg-transparent'
                              }`}>
                                {match.equipeexterieur}
                              </span>
                              {match.handicapeInitialExterieur && (
                                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                  {match.handicapeInitialExterieur}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          <div>
                            {match.lieu && <div>{match.lieu}</div>}
                            {match.ville && (
                              <div className="text-xs text-gray-500">{match.ville}</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
