"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import { ArrowLeft, Pencil, Trash2, Search, ChevronLeft, ChevronRight, X, Save, AlertTriangle, RotateCcw, Copy, Loader2, Flag } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Match {
  id: string;
  semaine: string | null;
  jour: string | null;
  periode: string | null;
  date: string;
  division: string;
  heure: string | null;
  equipedomicile: string;
  equipeexterieur: string;
  homeDisplayName: string;
  awayDisplayName: string;
  handicapeInitialDomicile: string | null;
  handicapeInitialExterieur: string | null;
  scoredomicile: number | null;
  scoreexterieur: number | null;
  lieu: string | null;
  adresse: string | null;
  ville: string | null;
  saison: string;
}

interface DeletedMatch {
  id: string;
  originalMatchId: string;
  date: string;
  division: string;
  equipedomicile: string;
  equipeexterieur: string;
  homeDisplayName: string;
  awayDisplayName: string;
  scoredomicile: number | null;
  scoreexterieur: number | null;
  lieu: string | null;
  saison: string;
  originalCreatedAt: string;
  deletedAt: string;
  deletionReason: string;
  keptMatchId: string | null;
}

interface EditFormData {
  semaine: string;
  jour: string;
  periode: string;
  date: string;
  division: string;
  heure: string;
  equipedomicile: string;
  equipeexterieur: string;
  handicapeInitialDomicile: string;
  handicapeInitialExterieur: string;
  scoredomicile: string;
  scoreexterieur: string;
  lieu: string;
  adresse: string;
  ville: string;
  saison: string;
}

type TabType = "matches" | "audit";

type ForfeitType = "home" | "away" | "double" | null;

function detectForfeitType(scoreHome: number | null, scoreAway: number | null): ForfeitType {
  if (scoreHome === null || scoreAway === null) return null;
  if (scoreHome === 0 && scoreAway === 0) return "double";
  if (scoreHome === 0 && scoreAway === 20) return "home";
  if (scoreHome === 20 && scoreAway === 0) return "away";
  return null;
}

function ForfeitBadge({ type, compact }: { type: ForfeitType; compact?: boolean }) {
  if (!type) return null;
  
  const labels: Record<string, string> = {
    home: "FF DOM",
    away: "FF EXT",
    double: "DOUBLE FF",
  };
  
  const colors: Record<string, string> = {
    home: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800",
    away: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800",
    double: "bg-red-200 text-red-800 dark:bg-red-900/60 dark:text-red-200 border-red-300 dark:border-red-700",
  };
  
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${colors[type]}`}>
      <Flag className="w-2.5 h-2.5" />
      {labels[type]}
    </span>
  );
}

export default function MatchManagementPage() {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<TabType>("matches");
  
  // Match state
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableSeasons, setAvailableSeasons] = useState<string[]>([]);
  const [availableDivisions, setAvailableDivisions] = useState<string[]>([]);
  
  // Filters
  const [saison, setSaison] = useState("");
  const [division, setDivision] = useState("");
  const [team, setTeam] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Edit modal
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Delete confirmation
  const [deletingMatch, setDeletingMatch] = useState<Match | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Deduplication
  const [deduplicating, setDeduplicating] = useState(false);

  // Audit log state
  const [deletedMatches, setDeletedMatches] = useState<DeletedMatch[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditTotalCount, setAuditTotalCount] = useState(0);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Load available seasons
  useEffect(() => {
    const loadSeasons = async () => {
      try {
        const response = await fetch("/api/filters");
        const data = await response.json();
        if (data.success && data.filters?.saisons) {
          const seasons: string[] = [...data.filters.saisons].sort((a, b) => b.localeCompare(a));
          setAvailableSeasons(seasons);
          if (seasons.length > 0) {
            setSaison((current) => current || seasons[0]);
          }
        }
      } catch (error) {
        console.error("Error loading seasons:", error);
      }
    };
    loadSeasons();
  }, []);

  // Load matches
  const loadMatches = useCallback(async () => {
    if (!saison) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("saison", saison);
      params.set("page", page.toString());
      params.set("limit", "50");
      if (division) params.set("division", division);
      if (team) params.set("team", team);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      
      const response = await fetch(`/api/match-management?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setMatches(data.matches);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.totalCount);
        setAvailableDivisions(data.divisions || []);
      } else {
        toast.error(data.error || "Erreur lors du chargement");
      }
    } catch (error) {
      console.error("Error loading matches:", error);
      toast.error("Erreur lors du chargement des matchs");
    } finally {
      setLoading(false);
    }
  }, [saison, division, team, dateFrom, dateTo, page]);

  useEffect(() => {
    if (activeTab === "matches") loadMatches();
  }, [loadMatches, activeTab]);

  // Load audit log
  const loadDeletedMatches = useCallback(async () => {
    if (!saison) return;
    
    setAuditLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("saison", saison);
      params.set("page", auditPage.toString());
      params.set("limit", "50");
      if (division) params.set("division", division);
      
      const response = await fetch(`/api/deleted-matches?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setDeletedMatches(data.deletedMatches);
        setAuditTotalPages(data.pagination.totalPages);
        setAuditTotalCount(data.pagination.totalCount);
      }
    } catch (error) {
      console.error("Error loading deleted matches:", error);
      toast.error("Erreur lors du chargement de l'audit log");
    } finally {
      setAuditLoading(false);
    }
  }, [saison, division, auditPage]);

  useEffect(() => {
    if (activeTab === "audit") loadDeletedMatches();
  }, [loadDeletedMatches, activeTab]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setAuditPage(1);
  }, [saison, division, team, dateFrom, dateTo]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-BE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-BE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format date for input
  const formatDateForInput = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toISOString().split("T")[0];
  };

  // Open edit modal
  const openEditModal = (match: Match) => {
    setEditingMatch(match);
    setEditFormData({
      semaine: match.semaine || "",
      jour: match.jour || "",
      periode: match.periode || "",
      date: formatDateForInput(match.date),
      division: match.division,
      heure: match.heure || "",
      equipedomicile: match.equipedomicile,
      equipeexterieur: match.equipeexterieur,
      handicapeInitialDomicile: match.handicapeInitialDomicile || "",
      handicapeInitialExterieur: match.handicapeInitialExterieur || "",
      scoredomicile: match.scoredomicile !== null ? match.scoredomicile.toString() : "",
      scoreexterieur: match.scoreexterieur !== null ? match.scoreexterieur.toString() : "",
      lieu: match.lieu || "",
      adresse: match.adresse || "",
      ville: match.ville || "",
      saison: match.saison,
    });
  };

  const closeEditModal = () => {
    setEditingMatch(null);
    setEditFormData(null);
  };

  // Save match changes
  const saveMatch = async () => {
    if (!editingMatch || !editFormData) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/match-management/${editingMatch.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Match mis à jour avec succès");
        closeEditModal();
        loadMatches();
      } else {
        toast.error(data.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Error saving match:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  // Delete match
  const deleteMatch = async () => {
    if (!deletingMatch) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/match-management/${deletingMatch.id}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Match supprimé avec succès");
        setDeletingMatch(null);
        loadMatches();
      } else {
        toast.error(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting match:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  // Run deduplication
  const runDeduplication = async () => {
    setDeduplicating(true);
    try {
      const body: any = {};
      if (saison) body.saison = saison;
      if (division) body.division = division;
      
      const response = await fetch("/api/deduplication/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (data.duplicatesRemoved > 0) {
          toast.success(`${data.duplicatesRemoved} doublon(s) supprimé(s) et archivé(s) dans l'audit log`);
          loadMatches();
          if (activeTab === "audit") loadDeletedMatches();
        } else {
          toast.info("Aucun doublon trouvé");
        }
      } else {
        toast.error(data.error || "Erreur lors de la déduplication");
      }
    } catch (error) {
      console.error("Error running deduplication:", error);
      toast.error("Erreur lors de la déduplication");
    } finally {
      setDeduplicating(false);
    }
  };

  // Restore deleted match
  const restoreMatch = async (deletedMatchId: string) => {
    setRestoringId(deletedMatchId);
    try {
      const response = await fetch(`/api/deleted-matches/${deletedMatchId}/restore`, {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message || "Match restauré avec succès");
        loadDeletedMatches();
      } else {
        toast.error(data.error || "Erreur lors de la restauration");
      }
    } catch (error) {
      console.error("Error restoring match:", error);
      toast.error("Erreur lors de la restauration");
    } finally {
      setRestoringId(null);
    }
  };

  // Handle form input changes
  const handleInputChange = (field: keyof EditFormData, value: string) => {
    if (editFormData) {
      setEditFormData({ ...editFormData, [field]: value });
    }
  };

  // Set forfeit scores (batch update)
  const setForfeitScores = (scoreHome: string, scoreAway: string) => {
    if (editFormData) {
      setEditFormData({ ...editFormData, scoredomicile: scoreHome, scoreexterieur: scoreAway });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-orange-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Retour</span>
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Gestion des Matchs
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-1">
          <button
            onClick={() => setActiveTab("matches")}
            className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === "matches"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Matchs ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === "audit"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Audit Log - Doublons supprimés ({auditTotalCount})
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filtres</h2>
            <button
              onClick={runDeduplication}
              disabled={deduplicating || !saison}
              className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
            >
              {deduplicating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {deduplicating ? "Déduplication..." : "Lancer la déduplication"}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Season */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Saison
              </label>
              <select
                value={saison}
                onChange={(e) => setSaison(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {availableSeasons.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Division */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Division
              </label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Toutes</option>
                {availableDivisions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Team */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Équipe
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {team && (
                  <button
                    onClick={() => setTeam("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date début
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date fin
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* TAB: Matches */}
        {activeTab === "matches" && (
          <>
            {/* Results count */}
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {totalCount} match{totalCount !== 1 ? "s" : ""} trouvé{totalCount !== 1 ? "s" : ""}
            </div>

            {/* Matches table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Division</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Domicile</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Extérieur</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lieu</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          Chargement...
                        </td>
                      </tr>
                    ) : matches.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          Aucun match trouvé
                        </td>
                      </tr>
                    ) : (
                      matches.map((match) => {
                        const forfeitType = detectForfeitType(match.scoredomicile, match.scoreexterieur);
                        return (
                        <tr key={match.id} className={`hover:bg-gray-50 dark:hover:bg-gray-750 ${forfeitType ? "bg-red-50/40 dark:bg-red-900/10" : ""}`}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            <div>{formatDate(match.date)}</div>
                            {match.heure && (
                              <div className="text-xs text-gray-500">{match.heure}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {match.division}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            <div className="font-medium">{match.homeDisplayName}</div>
                            <div className="text-xs text-gray-500">{match.equipedomicile}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            {match.scoredomicile !== null && match.scoreexterieur !== null ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-bold text-gray-900 dark:text-white">
                                  {match.scoredomicile} - {match.scoreexterieur}
                                </span>
                                <ForfeitBadge type={detectForfeitType(match.scoredomicile, match.scoreexterieur)} />
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            <div className="font-medium">{match.awayDisplayName}</div>
                            <div className="text-xs text-gray-500">{match.equipeexterieur}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {match.lieu || match.ville || "-"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditModal(match)}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                title="Modifier"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingMatch(match)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );})
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="text-sm text-gray-500">Page {page} sur {totalPages}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB: Audit Log */}
        {activeTab === "audit" && (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {auditTotalCount} match{auditTotalCount !== 1 ? "s" : ""} supprimé{auditTotalCount !== 1 ? "s" : ""} par déduplication
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Les matchs doublons supprimés automatiquement ou manuellement sont archivés ici. Vous pouvez les restaurer si nécessaire.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date match</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Division</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Domicile</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Extérieur</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Raison</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Supprimé le</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {auditLoading ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                          Chargement...
                        </td>
                      </tr>
                    ) : deletedMatches.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                          Aucun match supprimé trouvé
                        </td>
                      </tr>
                    ) : (
                      deletedMatches.map((dm) => (
                        <tr key={dm.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {formatDate(dm.date)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {dm.division}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            <div className="font-medium">{dm.homeDisplayName}</div>
                            <div className="text-xs text-gray-500">{dm.equipedomicile}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            {dm.scoredomicile !== null && dm.scoreexterieur !== null ? (
                              <span className="font-bold text-gray-900 dark:text-white">
                                {dm.scoredomicile} - {dm.scoreexterieur}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">Pas de score</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            <div className="font-medium">{dm.awayDisplayName}</div>
                            <div className="text-xs text-gray-500">{dm.equipeexterieur}</div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="inline-block px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs rounded-full">
                              {dm.deletionReason}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {formatDateTime(dm.deletedAt)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => restoreMatch(dm.id)}
                              disabled={restoringId === dm.id}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-xs font-medium mx-auto transition-colors"
                              title="Restaurer ce match"
                            >
                              {restoringId === dm.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="w-3.5 h-3.5" />
                              )}
                              Restaurer
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Audit Pagination */}
              {auditTotalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="text-sm text-gray-500">Page {auditPage} sur {auditTotalPages}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                      disabled={auditPage <= 1}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setAuditPage((p) => Math.min(auditTotalPages, p + 1))}
                      disabled={auditPage >= auditTotalPages}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Edit Modal */}
      {editingMatch && editFormData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Modifier le match
              </h2>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label>
                  <input type="date" value={editFormData.date} onChange={(e) => handleInputChange("date", e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Heure</label>
                  <input type="text" value={editFormData.heure} onChange={(e) => handleInputChange("heure", e.target.value)} placeholder="ex: 20:30" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Division *</label>
                  <input type="text" value={editFormData.division} onChange={(e) => handleInputChange("division", e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Saison *</label>
                  <select value={editFormData.saison} onChange={(e) => handleInputChange("saison", e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    {availableSeasons.map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Équipe Domicile *</label>
                  <input type="text" value={editFormData.equipedomicile} onChange={(e) => handleInputChange("equipedomicile", e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Équipe Extérieur *</label>
                  <input type="text" value={editFormData.equipeexterieur} onChange={(e) => handleInputChange("equipeexterieur", e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>

              {/* Forfeit Buttons */}
              {(() => {
                const currentForfeit = detectForfeitType(
                  editFormData.scoredomicile !== "" ? parseInt(editFormData.scoredomicile) : null,
                  editFormData.scoreexterieur !== "" ? parseInt(editFormData.scoreexterieur) : null
                );
                return (
                  <div className="border border-red-200 dark:border-red-800 rounded-lg p-3 bg-red-50/50 dark:bg-red-900/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Flag className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">Forfait</span>
                      {currentForfeit && (
                        <ForfeitBadge type={currentForfeit} />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setForfeitScores("0", "20")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                          currentForfeit === "home"
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-white dark:bg-gray-700 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                        }`}
                      >
                        <Flag className="w-3 h-3" />
                        FF Domicile (0-20)
                      </button>
                      <button
                        type="button"
                        onClick={() => setForfeitScores("20", "0")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                          currentForfeit === "away"
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-white dark:bg-gray-700 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                        }`}
                      >
                        <Flag className="w-3 h-3" />
                        FF Extérieur (20-0)
                      </button>
                      <button
                        type="button"
                        onClick={() => setForfeitScores("0", "0")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                          currentForfeit === "double"
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-white dark:bg-gray-700 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                        }`}
                      >
                        <Flag className="w-3 h-3" />
                        Double FF (0-0)
                      </button>
                      {currentForfeit && (
                        <button
                          type="button"
                          onClick={() => setForfeitScores("", "")}
                          className="px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5"
                        >
                          <X className="w-3 h-3" />
                          Retirer forfait
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Score Domicile</label>
                  <input type="number" value={editFormData.scoredomicile} onChange={(e) => handleInputChange("scoredomicile", e.target.value)} placeholder="Vide si pas joué" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Score Extérieur</label>
                  <input type="number" value={editFormData.scoreexterieur} onChange={(e) => handleInputChange("scoreexterieur", e.target.value)} placeholder="Vide si pas joué" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lieu</label>
                  <input type="text" value={editFormData.lieu} onChange={(e) => handleInputChange("lieu", e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ville</label>
                  <input type="text" value={editFormData.ville} onChange={(e) => handleInputChange("ville", e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse</label>
                <input type="text" value={editFormData.adresse} onChange={(e) => handleInputChange("adresse", e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semaine</label>
                  <input type="text" value={editFormData.semaine} onChange={(e) => handleInputChange("semaine", e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jour</label>
                  <input type="text" value={editFormData.jour} onChange={(e) => handleInputChange("jour", e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Période</label>
                  <input type="text" value={editFormData.periode} onChange={(e) => handleInputChange("periode", e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button onClick={closeEditModal} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                Annuler
              </button>
              <button onClick={saveMatch} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Supprimer le match</h3>
                  <p className="text-sm text-gray-500">Cette action est irréversible</p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>{deletingMatch.homeDisplayName}</strong>{" vs "}<strong>{deletingMatch.awayDisplayName}</strong>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(deletingMatch.date)} - {deletingMatch.division}
                </p>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Êtes-vous sûr de vouloir supprimer ce match ? Les classements seront recalculés automatiquement.
              </p>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button onClick={() => setDeletingMatch(null)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                Annuler
              </button>
              <button onClick={deleteMatch} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
