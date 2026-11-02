'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Home,
  Plus,
  Trash2,
  Save,
  Trophy,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  X,
  Zap,
} from 'lucide-react';
import { useLocale } from '@/lib/i18n/locale-context';
import { toast } from 'sonner';

interface PlayoffGroup {
  id?: string;
  saison: string;
  name: string;
  displayOrder: number;
  rankStart: number;
  rankEnd: number;
  sourceDivisions: string[];
  sourcePositionStart: number | null;
  sourcePositionEnd: number | null;
  startDate: string | null;
  teams: string[];
}

interface TeamStats {
  rank: number;
  name: string;
  points: number;
}

const EMPTY_GROUP: PlayoffGroup = {
  saison: '',
  name: '',
  displayOrder: 0,
  rankStart: 1,
  rankEnd: 3,
  sourceDivisions: [],
  sourcePositionStart: null,
  sourcePositionEnd: null,
  startDate: null,
  teams: [],
};

export default function PlayoffConfigPage() {
  const { t } = useLocale();
  const [saison, setSaison] = useState<string>('2025-2026');
  const [availableSeasons, setAvailableSeasons] = useState<string[]>([]);
  const [groups, setGroups] = useState<PlayoffGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PlayoffGroup | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [availableTeams, setAvailableTeams] = useState<Record<string, TeamStats[]>>({});
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check admin auth
  useEffect(() => {
    const auth = sessionStorage.getItem('adminAuth');
    setIsAuthenticated(auth === 'true');
  }, []);

  // Load seasons
  useEffect(() => {
    fetch('/api/filters')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.filters?.saisons) {
          setAvailableSeasons(data.filters.saisons);
        }
      })
      .catch(console.error);
  }, []);

  // Load playoff groups
  const loadGroups = useCallback(async () => {
    if (!saison) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/playoff-groups?saison=${saison}`);
      const data = await res.json();
      if (data.success) {
        setGroups(
          data.groups.map((g: any) => ({
            ...g,
            startDate: g.startDate
              ? new Date(g.startDate).toISOString().split('T')[0]
              : null,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      toast.error('Erreur lors du chargement des groupes');
    } finally {
      setLoading(false);
    }
  }, [saison]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // Load current standings for teams picker
  const loadAvailableTeams = useCallback(async () => {
    if (!saison) return;
    setLoadingTeams(true);
    try {
      const divisions = ['1', '2', '2A', '2B'];
      const results: Record<string, TeamStats[]> = {};
      for (const div of divisions) {
        const res = await fetch(`/api/standings?division=${div}&saison=${saison}&nbResults=0`);
        const data = await res.json();
        if (data.success && data.standings) {
          results[div] = data.standings;
        }
      }
      setAvailableTeams(results);
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoadingTeams(false);
    }
  }, [saison]);

  useEffect(() => {
    loadAvailableTeams();
  }, [loadAvailableTeams]);

  const handleSaveGroup = async (group: PlayoffGroup) => {
    try {
      const res = await fetch('/api/playoff-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...group,
          saison,
          startDate: group.startDate || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Groupe "${group.name}" sauvegardé`);
        setEditingGroup(null);
        loadGroups();
      } else {
        toast.error(data.error || 'Erreur de sauvegarde');
      }
    } catch (error) {
      toast.error('Erreur de sauvegarde');
    }
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    if (!confirm(`Supprimer le groupe "${name}" ?`)) return;
    try {
      const res = await fetch(`/api/playoff-groups?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success(`Groupe "${name}" supprimé`);
        loadGroups();
      } else {
        toast.error(data.error || 'Erreur de suppression');
      }
    } catch (error) {
      toast.error('Erreur de suppression');
    }
  };

  const addTeamToGroup = (group: PlayoffGroup, teamName: string) => {
    if (!teamName || group.teams.includes(teamName)) return;
    const updated = { ...group, teams: [...group.teams, teamName] };
    setEditingGroup(updated);
  };

  const removeTeamFromGroup = (group: PlayoffGroup, teamName: string) => {
    const updated = { ...group, teams: group.teams.filter((t) => t !== teamName) };
    setEditingGroup(updated);
  };

  // Auto-fill teams from standings (fetches fresh standings with beforeDate if startDate is set)
  const autoFillTeams = async (group: PlayoffGroup) => {
    if (!group.sourceDivisions.length || group.sourcePositionStart === null || group.sourcePositionEnd === null) {
      toast.error('Configurez d\'abord les divisions source et les positions');
      return;
    }

    setLoadingTeams(true);
    try {
      const selectedTeams: string[] = [];
      for (const div of group.sourceDivisions) {
        // If group has a startDate, fetch standings excluding matches on/after that date
        const beforeDateParam = group.startDate ? `&beforeDate=${group.startDate}` : '';
        const res = await fetch(`/api/standings?division=${div}&saison=${saison}&nbResults=0${beforeDateParam}`);
        const data = await res.json();
        if (data.success && data.standings) {
          const start = group.sourcePositionStart!;
          const end = group.sourcePositionEnd!;
          for (const team of data.standings) {
            if (team.rank >= start && team.rank <= end) {
              selectedTeams.push(team.name);
            }
          }
        }
      }

      if (selectedTeams.length === 0) {
        toast.error('Aucune équipe trouvée pour ces critères');
        return;
      }

      setEditingGroup({ ...group, teams: selectedTeams });
      toast.success(`${selectedTeams.length} équipe(s) ajoutée(s)${group.startDate ? ' (classement avant le ' + new Date(group.startDate + 'T00:00:00').toLocaleDateString('fr-BE') + ')' : ''}`);
    } catch (error) {
      console.error('Error auto-filling teams:', error);
      toast.error('Erreur lors du remplissage automatique');
    } finally {
      setLoadingTeams(false);
    }
  };

  const startNewGroup = () => {
    const nextOrder = groups.length > 0 ? Math.max(...groups.map((g) => g.displayOrder)) + 1 : 1;
    const nextRankStart = groups.length > 0 ? Math.max(...groups.map((g) => g.rankEnd)) + 1 : 1;
    setEditingGroup({
      ...EMPTY_GROUP,
      saison,
      displayOrder: nextOrder,
      rankStart: nextRankStart,
      rankEnd: nextRankStart + 2,
      name: `Play-offs ${nextOrder}`,
    });
  };

  // Get all team names already assigned to any group
  const assignedTeams = groups.flatMap((g) => g.teams);
  const editingAssigned = editingGroup ? editingGroup.teams : [];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-md mx-auto mt-20 text-center">
          <Card>
            <CardHeader>
              <CardTitle>Accès restreint</CardTitle>
              <CardDescription>
                Vous devez d'abord vous connecter via l'administration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin-settings">
                <Button>Aller à l'administration</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="h-6 w-6 text-orange-600" />
                Configuration des Play-offs
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Définir les groupes de play-offs pour chaque saison
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin-settings">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Administration
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  Accueil
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Season selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Label className="whitespace-nowrap font-semibold">Saison :</Label>
              <Select value={saison} onValueChange={setSaison}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableSeasons.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={startNewGroup} className="ml-auto">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau groupe
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Edit form */}
        {editingGroup && (
          <Card className="border-orange-300 shadow-lg">
            <CardHeader className="bg-orange-50">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-orange-600" />
                  {editingGroup.id ? 'Modifier' : 'Nouveau'} groupe de play-offs
                </span>
                <Button variant="ghost" size="sm" onClick={() => setEditingGroup(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Row 1: Name and order */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Nom du groupe *</Label>
                  <Input
                    value={editingGroup.name}
                    onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                    placeholder="Play-offs 1"
                  />
                </div>
                <div>
                  <Label>Ordre d'affichage</Label>
                  <Input
                    type="number"
                    value={editingGroup.displayOrder}
                    onChange={(e) =>
                      setEditingGroup({ ...editingGroup, displayOrder: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label>Date de début des play-offs</Label>
                  <Input
                    type="date"
                    value={editingGroup.startDate || ''}
                    onChange={(e) =>
                      setEditingGroup({ ...editingGroup, startDate: e.target.value || null })
                    }
                  />
                </div>
              </div>

              {/* Row 2: Rank range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Position classement général - début *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editingGroup.rankStart}
                    onChange={(e) =>
                      setEditingGroup({ ...editingGroup, rankStart: parseInt(e.target.value) || 1 })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ex: 1 pour les premières positions du classement final
                  </p>
                </div>
                <div>
                  <Label>Position classement général - fin *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editingGroup.rankEnd}
                    onChange={(e) =>
                      setEditingGroup({ ...editingGroup, rankEnd: parseInt(e.target.value) || 3 })
                    }
                  />
                </div>
              </div>

              {/* Row 3: Source configuration for auto-fill */}
              <div className="border rounded-lg p-4 bg-blue-50/50">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  Remplissage automatique depuis les classements
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Divisions source</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {['1', '2', '2A', '2B'].map((div) => (
                        <Button
                          key={div}
                          size="sm"
                          variant={
                            editingGroup.sourceDivisions.includes(div) ? 'default' : 'outline'
                          }
                          onClick={() => {
                            const newDivs = editingGroup.sourceDivisions.includes(div)
                              ? editingGroup.sourceDivisions.filter((d) => d !== div)
                              : [...editingGroup.sourceDivisions, div];
                            setEditingGroup({ ...editingGroup, sourceDivisions: newDivs });
                          }}
                        >
                          Div {div}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Position début (dans classement source)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={editingGroup.sourcePositionStart || ''}
                      onChange={(e) =>
                        setEditingGroup({
                          ...editingGroup,
                          sourcePositionStart: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <Label>Position fin (dans classement source)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={editingGroup.sourcePositionEnd || ''}
                      onChange={(e) =>
                        setEditingGroup({
                          ...editingGroup,
                          sourcePositionEnd: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      placeholder="3"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <Button
                    onClick={() => autoFillTeams(editingGroup)}
                    variant="secondary"
                    disabled={loadingTeams}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {loadingTeams ? 'Chargement...' : 'Remplir automatiquement'}
                  </Button>
                  {editingGroup.startDate && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Classement calculé avant le {new Date(editingGroup.startDate + 'T00:00:00').toLocaleDateString('fr-BE')}
                    </span>
                  )}
                </div>
              </div>

              {/* Row 4: Teams */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Équipes du groupe ({editingGroup.teams.length})
                </h4>

                {editingGroup.teams.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {editingGroup.teams.map((team, idx) => (
                      <div
                        key={team}
                        className="flex items-center gap-1 bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full text-sm font-medium"
                      >
                        <span className="text-orange-500 text-xs">#{idx + 1}</span>
                        {team}
                        <button
                          onClick={() => removeTeamFromGroup(editingGroup, team)}
                          className="ml-1 text-orange-600 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Manual add team */}
                <div className="flex gap-2">
                  <Input
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Nom de l'équipe..."
                    className="flex-1"
                    list="available-teams-list"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (newTeamName.trim()) {
                        addTeamToGroup(editingGroup, newTeamName.trim());
                        setNewTeamName('');
                      }
                    }}
                    disabled={!newTeamName.trim()}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </Button>
                </div>

                {/* Quick add from available divisions */}
                {Object.keys(availableTeams).length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-gray-500 font-medium">Ajout rapide depuis les classements :</p>
                    {Object.entries(availableTeams).map(([div, teams]) => (
                      <div key={div}>
                        <p className="text-xs text-gray-400 mb-1">Division {div} :</p>
                        <div className="flex flex-wrap gap-1">
                          {teams.map((team) => {
                            const alreadyIn = editingGroup.teams.includes(team.name);
                            const inOtherGroup = !alreadyIn && assignedTeams.includes(team.name);
                            return (
                              <button
                                key={team.name}
                                onClick={() => {
                                  if (!alreadyIn) addTeamToGroup(editingGroup, team.name);
                                }}
                                disabled={alreadyIn || inOtherGroup}
                                className={`text-xs px-2 py-1 rounded border transition-colors ${
                                  alreadyIn
                                    ? 'bg-orange-200 border-orange-400 text-orange-800 cursor-default'
                                    : inOtherGroup
                                    ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                                    : 'bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-400 cursor-pointer'
                                }`}
                                title={
                                  inOtherGroup ? 'Déjà dans un autre groupe' : `#${team.rank} - ${team.points} pts`
                                }
                              >
                                #{team.rank} {team.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <datalist id="available-teams-list">
                  {Object.values(availableTeams)
                    .flat()
                    .map((t) => (
                      <option key={t.name} value={t.name} />
                    ))}
                </datalist>
              </div>

              {/* Save / Cancel */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditingGroup(null)}>
                  Annuler
                </Button>
                <Button
                  onClick={() => handleSaveGroup(editingGroup)}
                  disabled={!editingGroup.name || editingGroup.teams.length === 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing groups list */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                Chargement...
              </CardContent>
            </Card>
          ) : groups.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">Aucun groupe de play-offs configuré</p>
                <p className="text-sm">Cliquez sur "Nouveau groupe" pour commencer</p>
              </CardContent>
            </Card>
          ) : (
            groups.map((group) => (
              <Card
                key={group.id}
                className={`transition-all ${
                  expandedGroup === group.id ? 'shadow-lg border-orange-200' : ''
                }`}
              >
                <CardHeader
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id!)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold">
                        {group.displayOrder}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <CardDescription>
                          Positions {group.rankStart}-{group.rankEnd} •{' '}
                          {group.teams.length} équipe(s)
                          {group.startDate && (
                            <span className="ml-2">
                              • à partir du {new Date(group.startDate + 'T00:00:00').toLocaleDateString('fr-BE')}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingGroup({
                            ...group,
                            startDate: group.startDate
                              ? typeof group.startDate === 'string'
                                ? group.startDate
                                : new Date(group.startDate).toISOString().split('T')[0]
                              : null,
                          });
                        }}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup(group.id!, group.name);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {expandedGroup === group.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                {expandedGroup === group.id && (
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Divisions source :</span>
                          <p className="font-medium">
                            {group.sourceDivisions.length > 0
                              ? group.sourceDivisions.map((d) => `Div ${d}`).join(', ')
                              : 'Non défini'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Positions source :</span>
                          <p className="font-medium">
                            {group.sourcePositionStart && group.sourcePositionEnd
                              ? `${group.sourcePositionStart}-${group.sourcePositionEnd}`
                              : 'Non défini'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Classement final :</span>
                          <p className="font-medium">
                            {group.rankStart}-{group.rankEnd}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Date début :</span>
                          <p className="font-medium">
                            {group.startDate
                              ? new Date(group.startDate + 'T00:00:00').toLocaleDateString('fr-BE')
                              : 'Non défini'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-sm">Équipes :</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {group.teams.map((team, idx) => (
                            <span
                              key={team}
                              className="inline-flex items-center gap-1 bg-orange-50 text-orange-800 border border-orange-200 px-3 py-1 rounded-full text-sm"
                            >
                              <span className="text-orange-400 text-xs font-bold">
                                {group.rankStart + idx}
                              </span>
                              {team}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
