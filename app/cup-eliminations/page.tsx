'use client';

import { useState, useEffect } from "react";
import { Trophy, Home, Users, GitBranch } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { TeamLogo } from "@/components/team-logo";
import { PlayoffTree } from "@/components/playoff-tree";
import { useLocale } from "@/lib/i18n/locale-context";
import { useTeamSelection } from "@/lib/team-selection-context";

interface TeamStats {
  name: string;
  played: number;
  won: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsDiff: number;
  points: number;
}

interface Match {
  equipedomicile: string;
  equipeexterieur: string;
  scoredomicile: number | null;
  scoreexterieur: number | null;
  date: string | null;
}

interface GroupData {
  standings: TeamStats[];
  matches: Match[];
}

export default function CupEliminationsPage() {
  const { t } = useLocale();
  const { selectedTeam, saison: selectedSaison } = useTeamSelection();
  const [view, setView] = useState<'poules' | 'playoffs'>('poules');
  const [selectedGroupe, setSelectedGroupe] = useState<string>('A');
  const [equipePhare, setEquipePhare] = useState<string>(selectedTeam || "");
  const [saison, setSaison] = useState<string>("");
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [quarterFinals, setQuarterFinals] = useState<(Match | null)[]>([]);
  const [semiFinals, setSemiFinals] = useState<(Match | null)[]>([]);
  const [finals, setFinals] = useState<(Match | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [availableSeasons, setAvailableSeasons] = useState<string[]>([]);

  const groupes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  // Season-aware cup bracket pairing (matches /api/cup-playoffs)
  const cupBracket = saison <= '2025-2026'
    ? { qf: [['A', 'D'], ['B', 'E'], ['C', 'F'], ['H', 'G']], sf: ['BE', 'AD', 'CF', 'HG'], final: ['BEAD', 'CFHG'] }
    : { qf: [['H', 'A'], ['G', 'B'], ['F', 'C'], ['E', 'D']], sf: ['HA', 'GB', 'FC', 'ED'], final: ['HAGB', 'EDFC'] };

  // Load available seasons from filters
  useEffect(() => {
    fetch('/api/filters')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.filters?.saisons) {
          setAvailableSeasons(data.filters.saisons);
        }
      })
      .catch((err) => console.error('Erreur chargement saisons:', err));
  }, []);

  // Update equipePhare when context changes
  useEffect(() => {
    if (selectedTeam) {
      setEquipePhare(selectedTeam);
    }
  }, [selectedTeam]);

  // Initialize saison on mount
  useEffect(() => {
    setSaison(selectedSaison || "2025-2026");
  }, [selectedSaison]);

  const loadTeamNames = async () => {
    try {
      const response = await fetch(`/api/team-names?saison=${saison}`);
      const data = await response.json();
      if (data.success) {
        setAvailableTeams(data.teams || []);
      }
    } catch (err) {
      console.error("Error loading team names:", err);
    }
  };

  const loadGroupData = async (groupe: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cup-standings?groupe=${groupe}&saison=${saison}`);
      const data = await response.json();
      if (data.success) {
        setGroupData(data);
      }
    } catch (error) {
      console.error('Error loading group data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayoffData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cup-playoffs?saison=${saison}`);
      const data = await response.json();
      if (data.success) {
        setQuarterFinals(data.quarterFinals || []);
        setSemiFinals(data.semiFinals || []);
        setFinals(data.finals || []);
      }
    } catch (error) {
      console.error('Error loading playoff data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (saison) {
      loadTeamNames();
    }
  }, [saison]);

  useEffect(() => {
    if (saison) {
      if (view === 'poules') {
        loadGroupData(selectedGroupe);
      } else {
        loadPlayoffData();
      }
    }
  }, [view, selectedGroupe, saison]);

  // Don't filter standings by equipePhare - show all teams in the group
  const filteredGroupData = groupData;

  // Show all matches (no filtering by equipePhare) - just highlight the selected team
  const filteredQuarterFinals = quarterFinals;
  const filteredSemiFinals = semiFinals;
  const filteredFinals = finals;

  useEffect(() => {
    if (equipePhare && view === 'poules') {
      const checkGroups = async () => {
        for (const grp of groupes) {
          const response = await fetch(`/api/cup-standings?groupe=${grp}&saison=${saison}`);
          const data = await response.json();
          if (data.success) {
            const found = data.standings.some((team: TeamStats) =>
              team.name.toLowerCase().includes(equipePhare.toLowerCase())
            );
            if (found) {
              setSelectedGroupe(grp);
              break;
            }
          }
        }
      };
      checkGroups();
    }
  }, [equipePhare]);

  const MatchCard = ({ match, highlight = false }: { match: Match; highlight?: boolean }) => {
    const isHighlightHome = highlight && match.equipedomicile.toLowerCase().includes(equipePhare.toLowerCase());
    const isHighlightAway = highlight && match.equipeexterieur.toLowerCase().includes(equipePhare.toLowerCase());

    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className={`flex-1 flex items-center justify-end gap-2 ${isHighlightHome ? 'font-bold text-orange-600' : ''}`}>
          <span>{match.equipedomicile}</span>
          <TeamLogo teamName={match.equipedomicile} size={28} />
        </div>
        <div className="px-4 text-center font-bold min-w-[60px]">
          {match.scoredomicile !== null && match.scoreexterieur !== null
            ? `${match.scoredomicile} - ${match.scoreexterieur}`
            : 'vs'
          }
        </div>
        <div className={`flex-1 flex items-center gap-2 ${isHighlightAway ? 'font-bold text-orange-600' : ''}`}>
          <TeamLogo teamName={match.equipeexterieur} size={28} />
          <span>{match.equipeexterieur}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            {t('common.backToHome')}
          </Button>
        </Link>
      </div>

      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Trophy className="h-12 w-12 text-orange-600 mr-3" />
          <h1 className="text-4xl font-bold text-gray-900">
            {t('cup.title')} <span className="text-orange-600">{t('cup.cupEliminations')}</span>
          </h1>
        </div>
        <p className="text-lg text-gray-600">
          {t('cup.subtitle')}
        </p>
      </div>

      <div className="mb-8">
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            variant={view === 'poules' ? 'default' : 'outline'}
            className={view === 'poules' ? 'bg-orange-600 hover:bg-orange-700' : ''}
            onClick={() => setView('poules')}
          >
            <Users className="h-4 w-4 mr-2" />
            {t('cup.poules')}
          </Button>
          <Button
            variant={view === 'playoffs' ? 'default' : 'outline'}
            className={view === 'playoffs' ? 'bg-orange-600 hover:bg-orange-700' : ''}
            onClick={() => setView('playoffs')}
          >
            <GitBranch className="h-4 w-4 mr-2" />
            {t('cup.playoffs')}
          </Button>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t('common.filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="equipe-phare">{t('cup.equipePhare')}</Label>
              <Select value={equipePhare || "none"} onValueChange={(val) => setEquipePhare(val === "none" ? "" : val)}>
                <SelectTrigger id="equipe-phare" className="mt-1">
                  <SelectValue placeholder={t('cup.selectTeam')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('cup.noTeamSelected')}</SelectItem>
                  {availableTeams.map((teamName) => (
                    <SelectItem key={teamName} value={teamName}>
                      {teamName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="saison">{t('common.saison')}</Label>
              <Select value={saison} onValueChange={setSaison}>
                <SelectTrigger id="saison" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableSeasons.length > 0 ? (
                    availableSeasons.map((season) => (
                      <SelectItem key={season} value={season}>
                        {season}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="2025-2026">2025-2026</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {view === 'poules' && (
        <>
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 justify-center">
              {groupes.map(grp => (
                <Button
                  key={grp}
                  variant={selectedGroupe === grp ? 'default' : 'outline'}
                  className={selectedGroupe === grp ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  onClick={() => setSelectedGroupe(grp)}
                >
                  {t('cup.group')} {grp}
                </Button>
              ))}
            </div>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t('cup.groupStandings')} {selectedGroupe}</CardTitle>
              <CardDescription>{t('common.saison')} {saison}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-600">{t('common.loading')}</div>
              ) : filteredGroupData && filteredGroupData.standings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">#</th>
                        <th className="text-left p-3">{t('standings.team')}</th>
                        <th className="text-center p-3">{t('standings.played')}</th>
                        <th className="text-center p-3">{t('standings.won')}</th>
                        <th className="text-center p-3">{t('standings.lost')}</th>
                        <th className="text-center p-3">{t('standings.pointsFor')}</th>
                        <th className="text-center p-3">{t('standings.pointsAgainst')}</th>
                        <th className="text-center p-3">+/-</th>
                        <th className="text-center p-3 font-bold">{t('standings.points')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGroupData.standings.map((team, index) => {
                        const isHighlight = equipePhare && 
                          team.name.toLowerCase().includes(equipePhare.toLowerCase());
                        const isFirst = index === 0;
                        
                        return (
                          <tr
                            key={team.name}
                            className={`border-b hover:bg-gray-50 ${
                              isHighlight ? 'bg-orange-50' : ''
                            } ${isFirst ? 'bg-green-50' : ''}`}
                          >
                            <td className="p-3">
                              {isFirst && <span className="text-green-600 font-bold">👑 </span>}
                              {index + 1}
                            </td>
                            <td className={`p-3 ${isHighlight ? 'font-bold text-orange-600' : ''}`}>
                              <div className="flex items-center gap-3">
                                <TeamLogo teamName={team.name} size={32} />
                                <span>{team.name}</span>
                              </div>
                            </td>
                            <td className="text-center p-3">{team.played}</td>
                            <td className="text-center p-3 text-green-600 font-semibold">{team.won}</td>
                            <td className="text-center p-3 text-red-600 font-semibold">{team.lost}</td>
                            <td className="text-center p-3">{team.pointsFor}</td>
                            <td className="text-center p-3">{team.pointsAgainst}</td>
                            <td className={`text-center p-3 ${team.pointsDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {team.pointsDiff > 0 ? '+' : ''}{team.pointsDiff}
                            </td>
                            <td className="text-center p-3 font-bold text-lg">{team.points}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {t('cup.noDataForGroup')}
                </div>
              )}
            </CardContent>
          </Card>

          {filteredGroupData && filteredGroupData.matches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('cup.groupMatches')} {selectedGroupe}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredGroupData.matches.map((match, idx) => (
                    <MatchCard key={idx} match={match} highlight={!!equipePhare} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {view === 'playoffs' && (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('cup.playoffTree')}</CardTitle>
              <CardDescription>
                {t('cup.onlyFirstQualified')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(filteredQuarterFinals.some(m => m !== null) || filteredSemiFinals.some(m => m !== null) || filteredFinals.some(m => m !== null)) ? (
                <PlayoffTree
                  quarterFinals={filteredQuarterFinals}
                  semiFinals={filteredSemiFinals}
                  finals={filteredFinals}
                  equipePhare={equipePhare}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  {t('cup.noPlayoffsAvailable')}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('cup.qualificationRules')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-bold mb-2">{t('cup.quarterFinals')} (CUP4)</h4>
                  <ul className="space-y-1 text-sm">
                    {cupBracket.qf.map(([g1, g2]) => (
                      <li key={`${g1}${g2}`}>• 1er BEK {g1} vs 1er BEK {g2}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-bold mb-2">Demi-Finales (CUP2)</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Vainqueur {cupBracket.sf[0]} vs Vainqueur {cupBracket.sf[1]}</li>
                    <li>• Vainqueur {cupBracket.sf[2]} vs Vainqueur {cupBracket.sf[3]}</li>
                  </ul>
                  <h4 className="font-bold mb-2 mt-3">Finale (CUP1)</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Vainqueur {cupBracket.final[0]} vs Vainqueur {cupBracket.final[1]}</li>
                  </ul>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-bold mb-2">{t('cup.qualificationTitle')}</h4>
                  <p className="text-sm">
                    {t('cup.qualificationDesc')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
