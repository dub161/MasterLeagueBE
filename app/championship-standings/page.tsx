'use client';

import { useState, useEffect, useMemo } from "react";
import { Trophy, ChevronRight, Home, Medal, Crown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { TeamLogo } from "@/components/team-logo";
import { useLocale } from "@/lib/i18n/locale-context";
import { useTeamSelection } from "@/lib/team-selection-context";

interface TeamStats {
  rank: number;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  forfeit: number;
  points: number;
  pointsFor: number;
  pointsAgainst: number;
}

interface MatchResult {
  date: string;
  opponent: string;
  scoreFor: number;
  scoreAgainst: number;
  result: 'W' | 'D' | 'L' | 'F';
  isHome: boolean;
}

interface PlayoffGroupData {
  group: {
    id: string;
    name: string;
    displayOrder: number;
    rankStart: number;
    rankEnd: number;
    startDate: string | null;
    teams: string[];
    sourceDivisions?: string[];
  };
  standings: (TeamStats & { relativeRank: number })[];
  recentMatches: Record<string, MatchResult[]>;
  totalMatches: number;
}

export default function ChampionshipStandingsPage() {
  const { t } = useLocale();
  const { selectedTeam, saison: selectedSaison } = useTeamSelection();
  const [activeTab, setActiveTab] = useState<'championship' | 'playoffs' | 'final'>('championship');
  const [selectedDivision, setSelectedDivision] = useState<string>("1");
  const [selectedSubDivision, setSelectedSubDivision] = useState<string>("all");
  const [equipePhare, setEquipePhare] = useState<string>(selectedTeam || "");
  const [standings, setStandings] = useState<TeamStats[]>([]);
  const [recentMatches, setRecentMatches] = useState<Record<string, MatchResult[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saison, setSaison] = useState<string>("");
  const [nbResultsVisible, setNbResultsVisible] = useState<number>(3);
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [availableSeasons, setAvailableSeasons] = useState<string[]>([]);
  const [allDivisionsData, setAllDivisionsData] = useState<Record<string, TeamStats[]>>({});
  const [playoffStandings, setPlayoffStandings] = useState<PlayoffGroupData[]>([]);
  const [playoffLoading, setPlayoffLoading] = useState(false);
  // Map: division -> earliest playoff start date (to exclude playoff-phase matches from regular standings)
  const [playoffStartDates, setPlayoffStartDates] = useState<Record<string, string>>({});
  // Final standings: championship standings for divisions without playoffs (e.g. Div 3)
  const [div3Standings, setDiv3Standings] = useState<TeamStats[]>([]);
  const [finalLoading, setFinalLoading] = useState(false);

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

  const loadAllDivisions = async () => {
    try {
      const divisions = ["1", "2A", "2B", "2", "3"];
      const results: Record<string, TeamStats[]> = {};
      
      for (const div of divisions) {
        const response = await fetch(`/api/standings?division=${div}&saison=${saison}&nbResults=1`);
        const data = await response.json();
        if (data.success) {
          results[div] = data.standings || [];
        }
      }
      
      setAllDivisionsData(results);
    } catch (err) {
      console.error("Error loading all divisions:", err);
    }
  };

  const findTeamDivision = (teamName: string): { division: string; subDivision: string } | null => {
    // Check sub-groups first if they exist
    for (const [div, teams] of Object.entries(allDivisionsData)) {
      if (teams.some(team => team.name === teamName)) {
        if (div === "2A") return { division: "2", subDivision: "A" };
        if (div === "2B") return { division: "2", subDivision: "B" };
        if (div === "2") return { division: "2", subDivision: "all" };
        return { division: div, subDivision: "all" };
      }
    }
    return null;
  };

  const handleSelectTeam = (teamName: string) => {
    setEquipePhare(teamName);
    
    const teamDiv = findTeamDivision(teamName);
    if (teamDiv) {
      setSelectedDivision(teamDiv.division);
      setSelectedSubDivision(teamDiv.subDivision);
    }
  };

  // Helper: get beforeDate param for a division based on playoff start dates
  const getBeforeDateParam = (div: string): string => {
    const startDate = playoffStartDates[div];
    return startDate ? `&beforeDate=${startDate}` : '';
  };

  const loadStandings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (selectedDivision === "2" && selectedSubDivision === "all" && !hasDiv2SubGroups) {
        // No sub-groups: load Division 2 as a whole
        const beforeDate = getBeforeDateParam('2');
        const response = await fetch(`/api/standings?division=2&saison=${saison}&nbResults=${nbResultsVisible}${beforeDate}`);
        const data = await response.json();
        if (data.success) {
          setStandings(data.standings || []);
          setRecentMatches(data.recentMatches || {});
        } else {
          setError(data.error || t('standings.loadingStandings'));
        }
      } else {
        let divisionQuery = selectedDivision;
        if (selectedDivision === "2" && selectedSubDivision !== "all") {
          divisionQuery = `2${selectedSubDivision}`;
        }

        const beforeDate = getBeforeDateParam(divisionQuery);
        const response = await fetch(`/api/standings?division=${divisionQuery}&saison=${saison}&nbResults=${nbResultsVisible}${beforeDate}`);
        const data = await response.json();

        if (data.success) {
          setStandings(data.standings || []);
          setRecentMatches(data.recentMatches || {});
        } else {
          setError(data.error || t('standings.loadingStandings'));
        }
      }
    } catch (err) {
      setError(t('common.error'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load playoff start dates per division from playoff groups
  useEffect(() => {
    if (!saison) return;
    fetch(`/api/playoff-groups?saison=${saison}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.groups) {
          const dateMap: Record<string, string> = {};
          for (const group of data.groups) {
            if (group.startDate) {
              const startStr = new Date(group.startDate).toISOString().split('T')[0];
              for (const div of (group.sourceDivisions || [])) {
                // Keep the earliest start date per division
                if (!dateMap[div] || startStr < dateMap[div]) {
                  dateMap[div] = startStr;
                }
              }
            }
          }
          setPlayoffStartDates(dateMap);
        }
      })
      .catch(console.error);
  }, [saison]);

  useEffect(() => {
    if (saison) {
      loadTeamNames();
      loadAllDivisions();
    }
  }, [saison]);

  useEffect(() => {
    loadStandings();
  }, [selectedDivision, selectedSubDivision, saison, nbResultsVisible, playoffStartDates]);

  // Load playoff standings
  const loadPlayoffStandings = async () => {
    if (!saison) return;
    setPlayoffLoading(true);
    try {
      const response = await fetch(`/api/playoff-standings?saison=${saison}&nbResults=${nbResultsVisible}`);
      const data = await response.json();
      if (data.success) {
        setPlayoffStandings(data.playoffStandings || []);
      }
    } catch (err) {
      console.error("Error loading playoff standings:", err);
    } finally {
      setPlayoffLoading(false);
    }
  };

  useEffect(() => {
    if ((activeTab === 'playoffs' || activeTab === 'final') && saison) {
      loadPlayoffStandings();
    }
  }, [activeTab, saison, nbResultsVisible]);

  // Load Division 3 standings for the Final tab (divisions without playoffs)
  const loadFinalData = async () => {
    if (!saison) return;
    setFinalLoading(true);
    try {
      const res = await fetch(`/api/standings?division=3&saison=${saison}&nbResults=0`);
      const data = await res.json();
      if (data.success) {
        setDiv3Standings(data.standings || []);
      }
    } catch (err) {
      console.error("Error loading div 3 standings:", err);
    } finally {
      setFinalLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'final' && saison) {
      loadFinalData();
    }
  }, [activeTab, saison]);

  // Detect if Division 2 has sub-groups (2A/2B) for the current season
  const hasDiv2SubGroups = (allDivisionsData['2A']?.length || 0) > 0 || (allDivisionsData['2B']?.length || 0) > 0;

  // Detect if Division 3 exists for the current season (hide the button otherwise)
  const hasDiv3 = (allDivisionsData['3']?.length || 0) > 0;

  const filteredStandings = standings;

  const equipePhareIndex = filteredStandings.findIndex(
    (team) => team.name.toLowerCase().includes(equipePhare.toLowerCase())
  );

  const filteredRecentMatches = equipePhare
    ? Object.fromEntries(
        Object.entries(recentMatches).filter(([teamName]) =>
          teamName.toLowerCase().includes(equipePhare.toLowerCase())
        )
      )
    : recentMatches;

  const teamsToDisplay = equipePhare
    ? filteredStandings.filter((team) =>
        team.name.toLowerCase().includes(equipePhare.toLowerCase())
      )
    : filteredStandings;

  const getResultColor = (result: string) => {
    switch (result) {
      case 'W':
        return 'bg-green-600 text-white';
      case 'D':
        return 'bg-yellow-500 text-white';
      case 'L':
        return 'bg-red-600 text-white';
      case 'F':
        return 'bg-gray-600 text-white';
      default:
        return 'bg-gray-300 text-gray-700';
    }
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
            {t('standings.title')} <span className="text-orange-600">{t('standings.championshipStandings')}</span>
          </h1>
        </div>
        <p className="text-lg text-gray-600">
          {t('standings.subtitle')}
        </p>
      </div>

      {/* Main tab switcher: Championship vs Playoffs */}
      <div className="mb-8">
        <div className="flex justify-center gap-4 mb-6">
          <Button
            size="lg"
            variant={activeTab === 'championship' ? 'default' : 'outline'}
            onClick={() => setActiveTab('championship')}
            className="min-w-[200px] h-14 text-lg font-semibold"
          >
            <Trophy className="h-5 w-5 mr-2" />
            Championnat
          </Button>
          <Button
            size="lg"
            variant={activeTab === 'playoffs' ? 'default' : 'outline'}
            onClick={() => setActiveTab('playoffs')}
            className="min-w-[200px] h-14 text-lg font-semibold"
          >
            <Medal className="h-5 w-5 mr-2" />
            Play-offs
          </Button>
          <Button
            size="lg"
            variant={activeTab === 'final' ? 'default' : 'outline'}
            onClick={() => setActiveTab('final')}
            className="min-w-[200px] h-14 text-lg font-semibold"
          >
            <Crown className="h-5 w-5 mr-2" />
            Classement Final
          </Button>
        </div>

        {activeTab === 'championship' && (
          <>
            <div className="flex flex-wrap gap-4 justify-center mb-6">
              <Button
                size="lg"
                variant={selectedDivision === "1" ? "default" : "outline"}
                onClick={() => {
                  setSelectedDivision("1");
                  setSelectedSubDivision("all");
                }}
                className="min-w-[150px] h-16 text-lg font-semibold"
              >
                <Trophy className="h-5 w-5 mr-2" />
                {t('standings.division')} 1
              </Button>

              <Button
                size="lg"
                variant={selectedDivision === "2" ? "default" : "outline"}
                onClick={() => {
                  setSelectedDivision("2");
                  // If sub-groups exist, default to Group A; otherwise show all
                  setSelectedSubDivision(hasDiv2SubGroups ? "A" : "all");
                }}
                className="min-w-[150px] h-16 text-lg font-semibold"
              >
                <Trophy className="h-5 w-5 mr-2" />
                {t('standings.division')} 2
              </Button>

              {hasDiv3 && (
                <Button
                  size="lg"
                  variant={selectedDivision === "3" ? "default" : "outline"}
                  onClick={() => {
                    setSelectedDivision("3");
                    setSelectedSubDivision("all");
                  }}
                  className="min-w-[150px] h-16 text-lg font-semibold"
                >
                  <Trophy className="h-5 w-5 mr-2" />
                  {t('standings.division')} 3
                </Button>
              )}
            </div>

            {selectedDivision === "2" && hasDiv2SubGroups && (
              <div className="flex gap-3 justify-center mb-6">
                <Button
                  variant={selectedSubDivision === "A" ? "default" : "outline"}
                  onClick={() => setSelectedSubDivision("A")}
                  className="min-w-[120px]"
                >
                  {t('standings.groupA')}
                </Button>
                <Button
                  variant={selectedSubDivision === "B" ? "default" : "outline"}
                  onClick={() => setSelectedSubDivision("B")}
                  className="min-w-[120px]"
                >
                  {t('standings.groupB')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Filters - shared between tabs */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">{t('common.filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeTab === 'championship' && (
              <div>
                <Label htmlFor="equipe-phare" className="mb-2 block">
                  {t('standings.equipePhareOptional')}
                </Label>
                <Select value={equipePhare || "none"} onValueChange={(val) => {
                  const team = val === "none" ? "" : val;
                  if (team) {
                    handleSelectTeam(team);
                  } else {
                    setEquipePhare("");
                  }
                }}>
                  <SelectTrigger id="equipe-phare">
                    <SelectValue placeholder={t('standings.selectTeam')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('standings.noTeamSelected')}</SelectItem>
                    {availableTeams.map((teamName) => (
                      <SelectItem key={teamName} value={teamName}>
                        {teamName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="saison" className="mb-2 block">
                {t('common.saison')}
              </Label>
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
            <div>
              <Label htmlFor="nb-results" className="mb-2 block">
                {t('standings.nbResultsVisible')}
              </Label>
              <Select 
                value={nbResultsVisible.toString()} 
                onValueChange={(val) => setNbResultsVisible(parseInt(val))}
              >
                <SelectTrigger id="nb-results">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t('standings.resultCount_one')}</SelectItem>
                  <SelectItem value="2">2 {t('standings.resultCount_other')}</SelectItem>
                  <SelectItem value="3">3 {t('standings.resultCount_other')}</SelectItem>
                  <SelectItem value="4">4 {t('standings.resultCount_other')}</SelectItem>
                  <SelectItem value="5">5 {t('standings.resultCount_other')}</SelectItem>
                  <SelectItem value="10">10 {t('standings.resultCount_other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CHAMPIONSHIP TAB */}
      {activeTab === 'championship' && (
        <>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">
                {t('standings.title')} {t('standings.division')} {selectedDivision}
                {selectedDivision === "2" && selectedSubDivision !== "all" && ` - ${t('standings.group')} ${selectedSubDivision}`}
              </CardTitle>
              <CardDescription>
                {t('common.saison')} {saison} • {filteredStandings.length} {t('standings.teamsCount')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-600">
                  {t('standings.loadingStandings')}
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">
                  {error}
                </div>
              ) : filteredStandings.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  {t('standings.noDataForDivision')}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b-2 border-gray-300">
                      <tr>
                        <th className="text-left p-3 font-semibold">{t('standings.rank')}</th>
                        <th className="text-left p-3 font-semibold">{t('standings.team')}</th>
                        <th className="text-center p-3 font-semibold">{t('standings.played')}</th>
                        <th className="text-center p-3 font-semibold">{t('standings.won')}</th>
                        <th className="text-center p-3 font-semibold">{t('standings.drawn')}</th>
                        <th className="text-center p-3 font-semibold">{t('standings.lost')}</th>
                        <th className="text-center p-3 font-semibold">{t('standings.points')}</th>
                        <th className="text-center p-3 font-semibold">{t('standings.pointsFor')}</th>
                        <th className="text-center p-3 font-semibold">{t('standings.pointsAgainst')}</th>
                        <th className="text-center p-3 font-semibold">{t('standings.difference')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStandings.map((team, index) => {
                        const isEquipePhare =
                          equipePhare &&
                          team.name.toLowerCase().includes(equipePhare.toLowerCase());
                        const diff = team.pointsFor - team.pointsAgainst;

                        return (
                          <tr
                            key={team.name}
                            onClick={() => handleSelectTeam(team.name)}
                            className={`border-b hover:bg-gray-50 transition-colors cursor-pointer ${
                              isEquipePhare ? "bg-orange-100 font-semibold border-orange-300" : ""
                            }`}
                            title={t('standings.clickToSelectTeam')}
                          >
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center">
                                <span
                                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                    team.rank === 1
                                      ? "bg-yellow-400 text-yellow-900"
                                      : team.rank === 2
                                      ? "bg-gray-300 text-gray-900"
                                      : team.rank === 3
                                      ? "bg-orange-400 text-orange-900"
                                      : "bg-white border border-gray-300"
                                  }`}
                                >
                                  {team.rank}
                                </span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <TeamLogo teamName={team.name} size={32} />
                                <span>{team.name}</span>
                              </div>
                            </td>
                            <td className="p-3 text-center">{team.played}</td>
                            <td className="p-3 text-center text-green-700 font-medium">
                              {team.won}
                            </td>
                            <td className="p-3 text-center text-yellow-700 font-medium">
                              {team.drawn}
                            </td>
                            <td className="p-3 text-center text-red-700 font-medium">
                              {team.lost}
                            </td>
                            <td className="p-3 text-center font-bold text-lg">
                              {team.points}
                            </td>
                            <td className="p-3 text-center">{team.pointsFor}</td>
                            <td className="p-3 text-center">{team.pointsAgainst}</td>
                            <td
                              className={`p-3 text-center font-medium ${
                                diff > 0
                                  ? "text-green-700"
                                  : diff < 0
                                  ? "text-red-700"
                                  : "text-gray-600"
                              }`}
                            >
                              {diff > 0 ? "+" : ""}
                              {diff}
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

          {filteredStandings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{t('standings.latestResults')}</CardTitle>
                <CardDescription>
                  {equipePhare 
                    ? t('standings.lastNMatchesTeam').replace('{n}', nbResultsVisible.toString())
                    : t('standings.lastNMatchesAll').replace('{n}', nbResultsVisible.toString())
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {teamsToDisplay.map((team) => {
                    const teamRecentMatches = (filteredRecentMatches[team.name] || []).slice(0, nbResultsVisible);
                    const isEquipePhare = equipePhare && 
                      team.name.toLowerCase().includes(equipePhare.toLowerCase());
                    
                    return (
                      <div
                        key={team.name}
                        className={`border rounded-lg p-3 transition-all ${
                          isEquipePhare 
                            ? 'bg-orange-50 border-orange-400 shadow-lg' 
                            : 'hover:shadow-md'
                        }`}
                      >
                        <h3 className={`font-semibold text-base mb-2 flex items-center flex-wrap gap-1 ${
                          isEquipePhare ? 'text-orange-700' : ''
                        }`}>
                          <span className={`px-2 py-0.5 rounded-full text-xs mr-1 ${
                            isEquipePhare 
                              ? 'bg-orange-200 text-orange-800 font-bold' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            #{team.rank}
                          </span>
                          <TeamLogo teamName={team.name} size={24} className="mr-1" />
                          <span className="truncate">{team.name}</span>
                          {isEquipePhare && (
                            <span className="ml-1 text-orange-600">⭐</span>
                          )}
                        </h3>
                        
                        {teamRecentMatches.length === 0 ? (
                          <p className="text-gray-500 text-xs">{t('standings.noRecentMatches')}</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {teamRecentMatches.map((match, idx) => (
                              <div
                                key={idx}
                                className={`flex items-center gap-1.5 rounded-lg p-2 text-xs border ${
                                  isEquipePhare
                                    ? 'bg-orange-100 border-orange-300'
                                    : 'bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`px-1.5 py-0.5 rounded font-bold text-xs ${getResultColor(
                                      match.result
                                    )}`}
                                  >
                                    {match.result}
                                  </span>
                                  <span className="text-gray-600 text-xs">
                                    {match.isHome ? "vs" : "@"}
                                  </span>
                                  <span className="font-medium text-xs truncate max-w-[120px]">{match.opponent}</span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <span className="font-bold text-gray-900 text-xs">
                                    {match.scoreFor}
                                  </span>
                                  <span className="text-gray-400 text-xs">-</span>
                                  <span className="font-bold text-gray-900 text-xs">
                                    {match.scoreAgainst}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* FINAL STANDINGS TAB */}
      {activeTab === 'final' && (
        <div className="space-y-6">
          {(playoffLoading || finalLoading) ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Chargement du classement final...
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Division 1 - from playoff groups */}
              {(() => {
                const div1Groups = playoffStandings.filter(pg => 
                  pg.group.name.toLowerCase().includes('d1') || 
                  pg.group.name.toLowerCase().includes('div 1') ||
                  pg.group.name.toLowerCase().includes('div1') ||
                  (pg.group.sourceDivisions || []).includes('1')
                );
                if (div1Groups.length === 0) return null;
                return (
                  <Card className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Crown className="h-5 w-5 text-yellow-600" />
                        Division 1 — Classement Final
                      </CardTitle>
                      <CardDescription>
                        Basé sur les résultats des play-offs • Saison {saison}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 border-b-2 border-gray-300">
                            <tr>
                              <th className="text-center p-3 font-semibold w-16">Pos.</th>
                              <th className="text-left p-3 font-semibold">{t('standings.team')}</th>
                              <th className="text-center p-3 font-semibold">{t('standings.played')}</th>
                              <th className="text-center p-3 font-semibold">{t('standings.won')}</th>
                              <th className="text-center p-3 font-semibold">{t('standings.lost')}</th>
                              <th className="text-center p-3 font-semibold">{t('standings.points')}</th>
                              <th className="text-center p-3 font-semibold">+/-</th>
                            </tr>
                          </thead>
                          <tbody>
                            {div1Groups.map(pg => 
                              pg.standings.map((team) => {
                                const diff = team.pointsFor - team.pointsAgainst;
                                const isEquipePhare = equipePhare && team.name.toLowerCase().includes(equipePhare.toLowerCase());
                                return (
                                  <tr key={team.name} className={`border-b hover:bg-gray-50 transition-colors ${isEquipePhare ? "bg-orange-100 font-semibold border-orange-300" : ""}`}>
                                    <td className="p-3 text-center">
                                      <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mx-auto ${
                                        team.rank === 1 ? "bg-yellow-400 text-yellow-900" : team.rank === 2 ? "bg-gray-300 text-gray-900" : team.rank === 3 ? "bg-orange-400 text-orange-900" : "bg-white border border-gray-300"
                                      }`}>{team.rank}</span>
                                    </td>
                                    <td className="p-3"><div className="flex items-center gap-3"><TeamLogo teamName={team.name} size={32} /><span>{team.name}</span></div></td>
                                    <td className="p-3 text-center">{team.played}</td>
                                    <td className="p-3 text-center text-green-700 font-medium">{team.won}</td>
                                    <td className="p-3 text-center text-red-700 font-medium">{team.lost}</td>
                                    <td className="p-3 text-center font-bold text-lg">{team.points}</td>
                                    <td className={`p-3 text-center font-medium ${diff > 0 ? "text-green-700" : diff < 0 ? "text-red-700" : "text-gray-600"}`}>{diff > 0 ? "+" : ""}{diff}</td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                      {div1Groups.every(pg => pg.totalMatches === 0) && (
                        <p className="text-center py-4 text-gray-500 text-sm italic">Play-offs pas encore commencés — classement provisoire</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Division 2 - from playoff groups */}
              {(() => {
                const div2Groups = playoffStandings.filter(pg => 
                  pg.group.name.toLowerCase().includes('d2') || 
                  pg.group.name.toLowerCase().includes('div 2') ||
                  pg.group.name.toLowerCase().includes('div2') ||
                  (pg.group.sourceDivisions || []).some((d: string) => d.startsWith('2'))
                );
                if (div2Groups.length === 0) return null;
                return (
                  <Card className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Crown className="h-5 w-5 text-blue-600" />
                        Division 2 — Classement Final
                      </CardTitle>
                      <CardDescription>
                        Basé sur les résultats des play-offs • Saison {saison}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 border-b-2 border-gray-300">
                            <tr>
                              <th className="text-center p-3 font-semibold w-16">Pos.</th>
                              <th className="text-left p-3 font-semibold">{t('standings.team')}</th>
                              <th className="text-center p-3 font-semibold">{t('standings.played')}</th>
                              <th className="text-center p-3 font-semibold">{t('standings.won')}</th>
                              <th className="text-center p-3 font-semibold">{t('standings.lost')}</th>
                              <th className="text-center p-3 font-semibold">{t('standings.points')}</th>
                              <th className="text-center p-3 font-semibold">+/-</th>
                            </tr>
                          </thead>
                          <tbody>
                            {div2Groups.map(pg => 
                              pg.standings.map((team) => {
                                const diff = team.pointsFor - team.pointsAgainst;
                                const isEquipePhare = equipePhare && team.name.toLowerCase().includes(equipePhare.toLowerCase());
                                return (
                                  <tr key={team.name} className={`border-b hover:bg-gray-50 transition-colors ${isEquipePhare ? "bg-orange-100 font-semibold border-orange-300" : ""}`}>
                                    <td className="p-3 text-center">
                                      <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mx-auto ${
                                        team.rank <= 3 ? (team.rank === 1 ? "bg-yellow-400 text-yellow-900" : team.rank === 2 ? "bg-gray-300 text-gray-900" : "bg-orange-400 text-orange-900") : "bg-white border border-gray-300"
                                      }`}>{team.rank}</span>
                                    </td>
                                    <td className="p-3"><div className="flex items-center gap-3"><TeamLogo teamName={team.name} size={32} /><span>{team.name}</span></div></td>
                                    <td className="p-3 text-center">{team.played}</td>
                                    <td className="p-3 text-center text-green-700 font-medium">{team.won}</td>
                                    <td className="p-3 text-center text-red-700 font-medium">{team.lost}</td>
                                    <td className="p-3 text-center font-bold text-lg">{team.points}</td>
                                    <td className={`p-3 text-center font-medium ${diff > 0 ? "text-green-700" : diff < 0 ? "text-red-700" : "text-gray-600"}`}>{diff > 0 ? "+" : ""}{diff}</td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                      {div2Groups.every(pg => pg.totalMatches === 0) && (
                        <p className="text-center py-4 text-gray-500 text-sm italic">Play-offs pas encore commencés — classement provisoire</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Division 3 - from championship standings (no playoffs) */}
              {div3Standings.length > 0 && (
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Crown className="h-5 w-5 text-green-600" />
                      Division 3 — Classement Final
                    </CardTitle>
                    <CardDescription>
                      Basé sur les résultats du championnat (pas de play-offs) • Saison {saison}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 border-b-2 border-gray-300">
                          <tr>
                            <th className="text-center p-3 font-semibold w-16">Pos.</th>
                            <th className="text-left p-3 font-semibold">{t('standings.team')}</th>
                            <th className="text-center p-3 font-semibold">{t('standings.played')}</th>
                            <th className="text-center p-3 font-semibold">{t('standings.won')}</th>
                            <th className="text-center p-3 font-semibold">{t('standings.drawn')}</th>
                            <th className="text-center p-3 font-semibold">{t('standings.lost')}</th>
                            <th className="text-center p-3 font-semibold">{t('standings.points')}</th>
                            <th className="text-center p-3 font-semibold">+/-</th>
                          </tr>
                        </thead>
                        <tbody>
                          {div3Standings.map((team) => {
                            const diff = team.pointsFor - team.pointsAgainst;
                            const isEquipePhare = equipePhare && team.name.toLowerCase().includes(equipePhare.toLowerCase());
                            return (
                              <tr key={team.name} className={`border-b hover:bg-gray-50 transition-colors ${isEquipePhare ? "bg-orange-100 font-semibold border-orange-300" : ""}`}>
                                <td className="p-3 text-center">
                                  <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mx-auto ${
                                    team.rank === 1 ? "bg-yellow-400 text-yellow-900" : team.rank === 2 ? "bg-gray-300 text-gray-900" : team.rank === 3 ? "bg-orange-400 text-orange-900" : "bg-white border border-gray-300"
                                  }`}>{team.rank}</span>
                                </td>
                                <td className="p-3"><div className="flex items-center gap-3"><TeamLogo teamName={team.name} size={32} /><span>{team.name}</span></div></td>
                                <td className="p-3 text-center">{team.played}</td>
                                <td className="p-3 text-center text-green-700 font-medium">{team.won}</td>
                                <td className="p-3 text-center text-yellow-700 font-medium">{team.drawn}</td>
                                <td className="p-3 text-center text-red-700 font-medium">{team.lost}</td>
                                <td className="p-3 text-center font-bold text-lg">{team.points}</td>
                                <td className={`p-3 text-center font-medium ${diff > 0 ? "text-green-700" : diff < 0 ? "text-red-700" : "text-gray-600"}`}>{diff > 0 ? "+" : ""}{diff}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Empty state */}
              {playoffStandings.length === 0 && div3Standings.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Crown className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium text-gray-600">
                      Aucune donnée de classement final pour la saison {saison}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Les play-offs doivent être configurés ou des matchs de Division 3 doivent exister.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* PLAYOFFS TAB */}
      {activeTab === 'playoffs' && (
        <div className="space-y-6">
          {playoffLoading ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Chargement des classements play-offs...
              </CardContent>
            </Card>
          ) : playoffStandings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Medal className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-600">
                  Aucun groupe de play-offs configuré pour la saison {saison}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Les play-offs peuvent être configurés dans l'administration.
                </p>
              </CardContent>
            </Card>
          ) : (
            playoffStandings.map((pg) => (
              <Card key={pg.group.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Medal className="h-5 w-5 text-orange-600" />
                        {pg.group.name}
                      </CardTitle>
                      <CardDescription>
                        Positions {pg.group.rankStart}-{pg.group.rankEnd} • {pg.group.teams.length} équipes • {pg.totalMatches} match(es) joué(s)
                        {pg.group.startDate && (
                          <span className="ml-2">
                            • à partir du {new Date(pg.group.startDate).toLocaleDateString('fr-BE')}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {pg.standings.length === 0 ? (
                    <p className="text-center py-4 text-gray-500">Aucune équipe configurée</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 border-b-2 border-gray-300">
                          <tr>
                            <th className="text-center p-3 font-semibold w-16">Pos.</th>
                            <th className="text-left p-3 font-semibold">{t('standings.team')}</th>
                            <th className="text-center p-3 font-semibold">{t('standings.played')}</th>
                            <th className="text-center p-3 font-semibold">{t('standings.won')}</th>
                            <th className="text-center p-3 font-semibold">{t('standings.drawn')}</th>
                            <th className="text-center p-3 font-semibold">{t('standings.lost')}</th>
                            <th className="text-center p-3 font-semibold">{t('standings.points')}</th>
                            <th className="text-center p-3 font-semibold">{t('standings.pointsFor')}</th>
                            <th className="text-center p-3 font-semibold">{t('standings.pointsAgainst')}</th>
                            <th className="text-center p-3 font-semibold">{t('standings.difference')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pg.standings.map((team) => {
                            const diff = team.pointsFor - team.pointsAgainst;
                            const isEquipePhare = equipePhare &&
                              team.name.toLowerCase().includes(equipePhare.toLowerCase());

                            return (
                              <tr
                                key={team.name}
                                className={`border-b hover:bg-gray-50 transition-colors ${
                                  isEquipePhare ? "bg-orange-100 font-semibold border-orange-300" : ""
                                }`}
                              >
                                <td className="p-3 text-center">
                                  <div className="flex flex-col items-center">
                                    <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                      team.relativeRank === 1
                                        ? "bg-yellow-400 text-yellow-900"
                                        : team.relativeRank === 2
                                        ? "bg-gray-300 text-gray-900"
                                        : team.relativeRank === 3
                                        ? "bg-orange-400 text-orange-900"
                                        : "bg-white border border-gray-300"
                                    }`}>
                                      {team.rank}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-3">
                                    <TeamLogo teamName={team.name} size={32} />
                                    <span>{team.name}</span>
                                  </div>
                                </td>
                                <td className="p-3 text-center">{team.played}</td>
                                <td className="p-3 text-center text-green-700 font-medium">{team.won}</td>
                                <td className="p-3 text-center text-yellow-700 font-medium">{team.drawn}</td>
                                <td className="p-3 text-center text-red-700 font-medium">{team.lost}</td>
                                <td className="p-3 text-center font-bold text-lg">{team.points}</td>
                                <td className="p-3 text-center">{team.pointsFor}</td>
                                <td className="p-3 text-center">{team.pointsAgainst}</td>
                                <td className={`p-3 text-center font-medium ${
                                  diff > 0 ? "text-green-700" : diff < 0 ? "text-red-700" : "text-gray-600"
                                }`}>
                                  {diff > 0 ? "+" : ""}{diff}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Recent matches for this playoff group */}
                  {pg.totalMatches > 0 && (
                    <div className="mt-6 space-y-3">
                      <h4 className="font-semibold text-sm text-gray-700">Derniers résultats</h4>
                      {pg.standings.map((team) => {
                        const matches = (pg.recentMatches[team.name] || []).slice(0, nbResultsVisible);
                        if (matches.length === 0) return null;
                        const isEquipePhare = equipePhare &&
                          team.name.toLowerCase().includes(equipePhare.toLowerCase());
                        return (
                          <div key={team.name} className={`border rounded-lg p-3 ${
                            isEquipePhare ? 'bg-orange-50 border-orange-400' : ''
                          }`}>
                            <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <TeamLogo teamName={team.name} size={20} />
                              {team.name}
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {matches.map((match: MatchResult, idx: number) => (
                                <div key={idx} className="flex items-center gap-1.5 rounded-lg p-2 text-xs border bg-gray-50">
                                  <span className={`px-1.5 py-0.5 rounded font-bold text-xs ${getResultColor(match.result)}`}>
                                    {match.result}
                                  </span>
                                  <span className="text-gray-600 text-xs">
                                    {match.isHome ? "vs" : "@"}
                                  </span>
                                  <span className="font-medium text-xs truncate max-w-[120px]">{match.opponent}</span>
                                  <span className="font-bold text-gray-900 text-xs">{match.scoreFor}-{match.scoreAgainst}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
