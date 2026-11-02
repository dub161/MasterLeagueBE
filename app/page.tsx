'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Trophy,
  Calendar,
  Settings,
  ChevronDown,
  ChevronUp,
  Search,
  Medal,
} from 'lucide-react';
import { useLocale } from '@/lib/i18n/locale-context';
import { useTeamSelection } from '@/lib/team-selection-context';
import { TeamLogo } from '@/components/team-logo';
import Image from 'next/image';

interface Match {
  id: number | string;
  date: string;
  opponent: string;
  scoreFor: number | null;
  scoreAgainst: number | null;
  isHome: boolean;
  division: string | null;
  periode: string | null;
}

interface TeamStats {
  rank: number;
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

interface CupPlayoffMatch {
  id: number | string;
  round: string;
  division: string;
  date: string | null;
  equipedomicile: string;
  equipeexterieur: string;
  scoredomicile: number | null;
  scoreexterieur: number | null;
  isHome: boolean;
}

interface TeamData {
  teamName: string;
  saison: string;
  matches: Match[];
  championship: {
    division: string | null;
    standings: TeamStats[] | null;
  };
  bekCup: {
    groupe: string | null;
    standings: TeamStats[] | null;
  };
  cupPlayoffs: CupPlayoffMatch[] | null;
}

// Playoff standings section for the home page
function PlayoffStandingsSection({ teamName, saison }: { teamName: string; saison: string }) {
  const [playoffData, setPlayoffData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamName || !saison) return;
    setLoading(true);
    fetch(`/api/playoff-standings?saison=${saison}&nbResults=3`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.playoffStandings) {
          // Filter to only groups that contain this team
          const relevant = data.playoffStandings.filter((pg: any) =>
            pg.group.teams.some(
              (t: string) => t.toLowerCase() === teamName.toLowerCase()
            )
          );
          setPlayoffData(relevant);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [teamName, saison]);

  if (loading || playoffData.length === 0) return null;

  return (
    <>
      {playoffData.map((pg: any) => (
        <Card key={pg.group.id} className="shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Medal className="w-5 h-5 text-orange-600" />
              {pg.group.name}
            </CardTitle>
            <CardDescription>
              Classement play-offs • Positions {pg.group.rankStart}-{pg.group.rankEnd}
              {pg.group.startDate && (
                <span> • à partir du {new Date(pg.group.startDate).toLocaleDateString('fr-BE')}</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Pos</th>
                    <th className="text-left p-2">Équipe</th>
                    <th className="text-center p-2">J</th>
                    <th className="text-center p-2">V</th>
                    <th className="text-center p-2">D</th>
                    <th className="text-center p-2">Pts</th>
                    <th className="text-center p-2">+/-</th>
                  </tr>
                </thead>
                <tbody>
                  {pg.standings.map((team: any) => (
                    <tr
                      key={team.name}
                      className={`border-b hover:bg-slate-50 ${
                        team.name.toLowerCase() === teamName.toLowerCase()
                          ? 'bg-primary/10 font-semibold'
                          : ''
                      }`}
                    >
                      <td className="p-2">{team.rank}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <TeamLogo teamName={team.name} size={24} />
                          {team.name}
                        </div>
                      </td>
                      <td className="text-center p-2">{team.played}</td>
                      <td className="text-center p-2">{team.won}</td>
                      <td className="text-center p-2">{team.lost}</td>
                      <td className="text-center p-2 font-semibold">{team.points}</td>
                      <td className="text-center p-2">
                        {team.pointsFor - team.pointsAgainst > 0 ? '+' : ''}
                        {team.pointsFor - team.pointsAgainst}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-center">
              <Link href="/championship-standings">
                <Button variant="outline" size="sm" className="gap-2">
                  <Medal className="w-4 h-4" />
                  Voir tous les play-offs
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [availableSeasons, setAvailableSeasons] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllPastMatches, setShowAllPastMatches] = useState(false);
  const [showAllFutureMatches, setShowAllFutureMatches] = useState(false);
  const { t, locale } = useLocale();
  const { selectedTeam, setSelectedTeam, saison, setSaison } = useTeamSelection();

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

  // Keep team choices scoped to the displayed season, including season changes.
  useEffect(() => {
    let active = true;
    setAvailableTeams([]);
    fetch(`/api/team-names?saison=${encodeURIComponent(saison)}`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.teams) {
          setAvailableTeams(data.teams.sort());
        }
      })
      .catch((err) => console.error('Erreur chargement équipes:', err));
    return () => { active = false; };
  }, [saison]);

  // Load team data when team is selected
  useEffect(() => {
    if (!selectedTeam) {
      setTeamData(null);
      return;
    }

    // Reset collapse states when team changes
    setShowAllPastMatches(false);
    setShowAllFutureMatches(false);

    setIsLoading(true);
    fetch(`/api/team-data?team=${encodeURIComponent(selectedTeam)}&saison=${saison}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.matches) {
          setTeamData(data);
        } else {
          console.error('Données invalides reçues:', data);
          setTeamData(null);
        }
      })
      .catch((err) => {
        console.error('Erreur chargement données:', err);
        setTeamData(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [selectedTeam, saison]);

  // Filter teams based on search query
  const filteredTeams = useMemo(() => {
    if (!searchQuery) return availableTeams;
    const query = searchQuery.toLowerCase();
    return availableTeams.filter((team) =>
      team.toLowerCase().includes(query)
    );
  }, [availableTeams, searchQuery]);

  // Separate past and future matches
  const pastMatches = useMemo(() => {
    if (!teamData || !teamData.matches) return [];
    const now = new Date();
    return teamData.matches
      .filter(
        (m) =>
          m.scoreFor !== null &&
          m.scoreAgainst !== null &&
          new Date(m.date) <= now
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [teamData]);

  const futureMatches = useMemo(() => {
    if (!teamData || !teamData.matches) return [];
    const now = new Date();
    return teamData.matches
      .filter(
        (m) =>
          (m.scoreFor === null || m.scoreAgainst === null) &&
          new Date(m.date) > now
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [teamData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : locale === 'nl' ? 'nl-NL' : 'en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getResultClass = (match: Match) => {
    if (match.scoreFor === null || match.scoreAgainst === null) {
      return 'bg-slate-100 text-slate-700';
    }
    if (match.scoreFor > match.scoreAgainst) {
      return 'bg-green-100 text-green-700';
    }
    if (match.scoreFor < match.scoreAgainst) {
      return 'bg-red-100 text-red-700';
    }
    return 'bg-yellow-100 text-yellow-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16">
                <Image
                  src="/logos/masters-league.jpeg"
                  alt="Masters League"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Masters League Belgium
                </h1>
                <p className="text-sm text-slate-600">
                  Basket Vétérans 35+
                </p>
              </div>
            </div>
            <Link href="/admin-settings">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Team Selection */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">
              {t('dashboard.selectTeam')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.selectTeamDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search Input */}
              <div className="space-y-2">
                <Label htmlFor="search">
                  <Search className="w-4 h-4 inline mr-2" />
                  Rechercher une équipe
                </Label>
                <Input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tapez pour rechercher..."
                  className="w-full"
                />
                {searchQuery && filteredTeams.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto border rounded-md bg-white shadow-lg">
                    {filteredTeams.slice(0, 10).map((team) => (
                      <button
                        key={team}
                        onClick={() => {
                          setSelectedTeam(team);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 transition-colors flex items-center gap-2"
                      >
                        <TeamLogo teamName={team} size={24} />
                        <span>{team}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="team">
                  <ChevronDown className="w-4 h-4 inline mr-2" />
                  Sélection rapide
                </Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger id="team">
                    <SelectValue placeholder="Choisir une équipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeams.map((team) => (
                      <SelectItem key={team} value={team}>
                        <div className="flex items-center gap-2">
                          <TeamLogo teamName={team} size={20} />
                          {team}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Season Selection */}
            <div className="w-full md:w-64">
              <Label htmlFor="saison">{t('common.saison')}</Label>
              <Select value={saison} onValueChange={setSaison}>
                <SelectTrigger id="saison">
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
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-600">Chargement des données...</p>
            </CardContent>
          </Card>
        )}

        {/* No Team Selected */}
        {!selectedTeam && !isLoading && (
          <Card className="border-dashed border-2">
            <CardContent className="py-12 text-center">
              <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-lg text-slate-600">
                Sélectionnez une équipe pour voir ses résultats et classements
              </p>
            </CardContent>
          </Card>
        )}

        {/* Team Data Display */}
        {teamData && !isLoading && (
          <>
            {/* Team Header */}
            <Card className="shadow-lg bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <TeamLogo teamName={teamData.teamName} size={64} />
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">
                      {teamData.teamName}
                    </h2>
                    <p className="text-slate-600">Saison {teamData.saison}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Matches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {t('results.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Last Match Played (Always Visible) */}
                {pastMatches.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-slate-700">
                      {t('results.lastMatchPlayed')}
                    </h3>
                    <div className="space-y-2">
                      <div
                        className={`p-4 rounded-lg border ${getResultClass(pastMatches[0])}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs text-slate-600 mb-1">
                              {formatDate(pastMatches[0].date)}
                              {pastMatches[0].division && ` • ${pastMatches[0].division}`}
                              {pastMatches[0].periode && ` • ${pastMatches[0].periode}`}
                            </p>
                            <div className="flex items-center gap-3">
                              <TeamLogo
                                teamName={pastMatches[0].opponent}
                                size={32}
                              />
                              <span className="font-semibold">
                                {pastMatches[0].isHome ? 'vs' : '@'} {pastMatches[0].opponent}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              {pastMatches[0].scoreFor} - {pastMatches[0].scoreAgainst}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Previous Matches (Collapsible) */}
                    {pastMatches.length > 1 && (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAllPastMatches(!showAllPastMatches)}
                          className="w-full"
                        >
                          {showAllPastMatches ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-2" />
                              {t('results.hidePreviousMatches')}
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-2" />
                              {t('results.showPreviousMatches').replace('{count}', (pastMatches.length - 1).toString())}
                            </>
                          )}
                        </Button>

                        {showAllPastMatches && (
                          <div className="mt-3 space-y-2">
                            <h4 className="text-sm font-medium text-slate-600 mb-2">
                              {t('results.previousMatches')}
                            </h4>
                            {pastMatches.slice(1).map((match) => (
                              <div
                                key={match.id}
                                className={`p-3 rounded-lg border ${getResultClass(match)}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-xs text-slate-600 mb-1">
                                      {formatDate(match.date)}
                                      {match.division && ` • ${match.division}`}
                                      {match.periode && ` • ${match.periode}`}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <TeamLogo
                                        teamName={match.opponent}
                                        size={24}
                                      />
                                      <span className="text-sm font-semibold">
                                        {match.isHome ? 'vs' : '@'} {match.opponent}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-bold">
                                      {match.scoreFor} - {match.scoreAgainst}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Next Match (Always Visible) */}
                {futureMatches.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-slate-700">
                      {t('results.nextMatchScheduled')}
                    </h3>
                    <div className="space-y-2">
                      <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs text-slate-600 mb-1">
                              {formatDate(futureMatches[0].date)}
                              {futureMatches[0].division && ` • ${futureMatches[0].division}`}
                              {futureMatches[0].periode && ` • ${futureMatches[0].periode}`}
                            </p>
                            <div className="flex items-center gap-3">
                              <TeamLogo
                                teamName={futureMatches[0].opponent}
                                size={32}
                              />
                              <span className="font-semibold">
                                {futureMatches[0].isHome ? 'vs' : '@'} {futureMatches[0].opponent}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-blue-600 font-medium">
                              {t('results.scheduled')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Following Matches (Collapsible) */}
                    {futureMatches.length > 1 && (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAllFutureMatches(!showAllFutureMatches)}
                          className="w-full"
                        >
                          {showAllFutureMatches ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-2" />
                              {t('results.hideFollowingMatches')}
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-2" />
                              {t('results.showFollowingMatches').replace('{count}', (futureMatches.length - 1).toString())}
                            </>
                          )}
                        </Button>

                        {showAllFutureMatches && (
                          <div className="mt-3 space-y-2">
                            <h4 className="text-sm font-medium text-slate-600 mb-2">
                              {t('results.followingMatches')}
                            </h4>
                            {futureMatches.slice(1).map((match) => (
                              <div
                                key={match.id}
                                className="p-3 rounded-lg border bg-blue-50 border-blue-200"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-xs text-slate-600 mb-1">
                                      {formatDate(match.date)}
                                      {match.division && ` • ${match.division}`}
                                      {match.periode && ` • ${match.periode}`}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <TeamLogo
                                        teamName={match.opponent}
                                        size={24}
                                      />
                                      <span className="text-sm font-semibold">
                                        {match.isHome ? 'vs' : '@'} {match.opponent}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm text-blue-600 font-medium">
                                      {t('results.scheduled')}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {pastMatches.length === 0 && futureMatches.length === 0 && (
                  <p className="text-center text-slate-500 py-8">
                    {t('results.noResults')}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Championship Standings */}
            {teamData.championship.standings && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    {t('standings.title')}
                    {teamData.championship.division && (
                      <span className="text-base font-normal text-slate-600">
                        {' '}• {teamData.championship.division}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">#</th>
                          <th className="text-left p-2">Équipe</th>
                          <th className="text-center p-2">J</th>
                          <th className="text-center p-2">V</th>
                          <th className="text-center p-2">N</th>
                          <th className="text-center p-2">D</th>
                          <th className="text-center p-2">F</th>
                          <th className="text-center p-2">Pts</th>
                          <th className="text-center p-2">+/-</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamData.championship.standings.map((team) => (
                          <tr
                            key={team.name}
                            className={`border-b hover:bg-slate-50 ${
                              team.name === teamData.teamName
                                ? 'bg-primary/10 font-semibold'
                                : ''
                            }`}
                          >
                            <td className="p-2">{team.rank}</td>
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <TeamLogo teamName={team.name} size={24} />
                                {team.name}
                              </div>
                            </td>
                            <td className="text-center p-2">{team.played}</td>
                            <td className="text-center p-2">{team.won}</td>
                            <td className="text-center p-2">
                              {team.drawn || 0}
                            </td>
                            <td className="text-center p-2">{team.lost}</td>
                            <td className="text-center p-2">
                              {team.forfeit || 0}
                            </td>
                            <td className="text-center p-2 font-semibold">
                              {team.points}
                            </td>
                            <td className="text-center p-2">
                              {team.pointsFor - team.pointsAgainst > 0 ? '+' : ''}
                              {team.pointsFor - team.pointsAgainst}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* BEK Cup Standings */}
            {teamData.bekCup.standings && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    {t('cup.title')}
                    {teamData.bekCup.groupe && (
                      <span className="text-base font-normal text-slate-600">
                        {' '}• Groupe {teamData.bekCup.groupe}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Pos</th>
                          <th className="text-left p-2">Équipe</th>
                          <th className="text-center p-2">J</th>
                          <th className="text-center p-2">V</th>
                          <th className="text-center p-2">D</th>
                          <th className="text-center p-2">Pts</th>
                          <th className="text-center p-2">+/-</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamData.bekCup.standings.map((team, index) => (
                          <tr
                            key={team.name}
                            className={`border-b hover:bg-slate-50 ${
                              team.name === teamData.teamName
                                ? 'bg-primary/10 font-semibold'
                                : ''
                            }`}
                          >
                            <td className="p-2">{index + 1}</td>
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <TeamLogo teamName={team.name} size={24} />
                                {team.name}
                              </div>
                            </td>
                            <td className="text-center p-2">{team.played}</td>
                            <td className="text-center p-2">{team.won}</td>
                            <td className="text-center p-2">{team.lost}</td>
                            <td className="text-center p-2 font-semibold">
                              {team.points}
                            </td>
                            <td className="text-center p-2">
                              {team.pointsDiff !== undefined && team.pointsDiff > 0 ? '+' : ''}
                              {team.pointsDiff !== undefined ? team.pointsDiff : (team.pointsFor - team.pointsAgainst)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cup Playoffs */}
            {teamData.cupPlayoffs && teamData.cupPlayoffs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-orange-600" />
                    Phase Finale Coupe
                  </CardTitle>
                  <CardDescription>
                    Matchs éliminatoires de votre équipe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teamData.cupPlayoffs.map((match) => {
                      const hasScore = match.scoredomicile !== null && match.scoreexterieur !== null;
                      const isTeamHome = match.isHome;
                      const teamWon = hasScore && (
                        (isTeamHome && match.scoredomicile! > match.scoreexterieur!) ||
                        (!isTeamHome && match.scoreexterieur! > match.scoredomicile!)
                      );
                      return (
                        <div
                          key={match.id}
                          className={`p-4 rounded-lg border ${
                            hasScore
                              ? teamWon
                                ? 'bg-green-50 border-green-300'
                                : 'bg-red-50 border-red-300'
                              : 'bg-orange-50 border-orange-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                              {match.round}
                            </span>
                            {match.date && (
                              <span className="text-xs text-slate-500">
                                {formatDate(match.date)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              <TeamLogo teamName={match.equipedomicile} size={28} />
                              <span className={`text-sm font-semibold ${
                                match.equipedomicile === teamData.teamName ? 'text-orange-700' : ''
                              }`}>
                                {match.equipedomicile}
                              </span>
                            </div>
                            <div className="px-4 text-center font-bold min-w-[60px]">
                              {hasScore
                                ? `${match.scoredomicile} - ${match.scoreexterieur}`
                                : 'vs'
                              }
                            </div>
                            <div className="flex items-center gap-2 flex-1 justify-end">
                              <span className={`text-sm font-semibold ${
                                match.equipeexterieur === teamData.teamName ? 'text-orange-700' : ''
                              }`}>
                                {match.equipeexterieur}
                              </span>
                              <TeamLogo teamName={match.equipeexterieur} size={28} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 text-center">
                    <Link href="/cup-eliminations">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Trophy className="w-4 h-4" />
                        Voir l&apos;arbre complet des éliminatoires
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Playoff Standings for selected team */}
            <PlayoffStandingsSection teamName={teamData.teamName} saison={teamData.saison} />

          </>
        )}

        {/* Quick Links */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Liens rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/results">
                <Button variant="outline" className="w-full h-20">
                  <div className="flex flex-col items-center gap-2">
                    <Calendar className="w-6 h-6" />
                    <span>{t('nav.results')}</span>
                  </div>
                </Button>
              </Link>
              <Link href="/championship-standings">
                <Button variant="outline" className="w-full h-20">
                  <div className="flex flex-col items-center gap-2">
                    <Trophy className="w-6 h-6" />
                    <span>{t('nav.championshipStandings')}</span>
                  </div>
                </Button>
              </Link>
              <Link href="/cup-eliminations">
                <Button variant="outline" className="w-full h-20">
                  <div className="flex flex-col items-center gap-2">
                    <Trophy className="w-6 h-6" />
                    <span>{t('nav.cupEliminations')}</span>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
