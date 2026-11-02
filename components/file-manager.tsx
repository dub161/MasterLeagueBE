
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Download, Trash2, CheckCircle, Clock, Loader2, ShieldCheck, AlertTriangle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface UploadedFile {
  id: string;
  originalName: string;
  fileSize: number;
  uploadedAt: string;
  isLoaded: boolean;
  loadedAt?: string | null;
  matchCount?: number | null;
}

interface CoherenceReport {
  ok: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalRows: number;
    validMatches: number;
    detectedSaison: string;
    yearCorrected: number;
    excludedFinalRound: number;
    normalizedTeams: number;
    unknownDivisions: string[];
    divisionBreakdown: Record<string, number>;
    dateRange: { min: string | null; max: string | null };
    internalDuplicates: number;
  };
}

interface LoadResult {
  success: boolean;
  message: string;
  error?: string;
  coherence?: CoherenceReport;
  stats?: {
    totalRows: number;
    validMatches: number;
    inserted: number;
    skipped: number;
    parseErrors: string[];
    insertErrors: string[];
  };
}

interface ValidateResult {
  success: boolean;
  coherence?: CoherenceReport;
  error?: string;
}

export function FileManager({ refreshSignal }: { refreshSignal?: number }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  const [validatingFileId, setValidatingFileId] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [loadResult, setLoadResult] = useState<LoadResult | null>(null);
  const [coherenceResult, setCoherenceResult] = useState<CoherenceReport | null>(null);
  const { toast } = useToast();

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/files');
      const data = await response.json();
      
      if (data.success) {
        setFiles(data.files);
      }
    } catch (error) {
      console.error('Erreur récupération fichiers:', error);
      toast({
        title: "❌ Erreur",
        description: "Impossible de récupérer la liste des fichiers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [refreshSignal]);

  const handleValidateFile = async (fileId: string, fileName: string) => {
    setValidatingFileId(fileId);
    setCoherenceResult(null);
    setLoadResult(null);

    try {
      const response = await fetch(`/api/files/${fileId}/validate`, {
        method: 'POST',
      });

      const data: ValidateResult = await response.json();

      if (response.ok && data.success && data.coherence) {
        setCoherenceResult(data.coherence);
        toast({
          title: data.coherence.ok ? "✅ Test de cohérence réussi" : "⚠️ Anomalies détectées",
          description: data.coherence.ok
            ? "Le fichier peut être chargé."
            : "Des erreurs bloquantes ont été détectées.",
          duration: 5000,
        });
      } else {
        throw new Error(data.error || 'Erreur lors du test de cohérence');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "❌ Erreur",
        description: error instanceof Error ? error.message : "Impossible de tester la cohérence du fichier",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setValidatingFileId(null);
    }
  };

  const handleLoadFile = async (fileId: string, fileName: string) => {
    setLoadingFileId(fileId);
    setLoadResult(null);
    setCoherenceResult(null);
    
    try {
      const response = await fetch(`/api/files/${fileId}/load`, {
        method: 'POST',
      });
      
      const data: LoadResult = await response.json();
      setLoadResult(data);
      if (data.coherence) setCoherenceResult(data.coherence);
      
      if (response.ok && data.success) {
        toast({
          title: "✅ Fichier chargé",
          description: data.message,
          duration: 5000,
        });
        
        // Rafraîchir la liste des fichiers
        await fetchFiles();
      } else {
        throw new Error(data.error || data.message || 'Erreur lors du chargement');
      }
      
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "❌ Erreur",
        description: error instanceof Error ? error.message : "Impossible de charger le fichier",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoadingFileId(null);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    setDeletingFileId(fileId);
    
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({
          title: "✅ Fichier supprimé",
          description: data.message,
          duration: 5000,
        });
        
        // Rafraîchir la liste des fichiers
        await fetchFiles();
      } else {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }
      
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "❌ Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer le fichier",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setDeletingFileId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Aucun fichier uploadé pour le moment</p>
        <p className="text-sm text-gray-400 mt-1">Utilisez la section d'upload ci-dessus pour ajouter des fichiers</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-700">Fichiers uploadés ({files.length})</h4>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchFiles}
          disabled={isLoading}
        >
          Actualiser
        </Button>
      </div>

      {/* Résultat du chargement */}
      {loadResult && (
        <Card className={`border-l-4 ${
          loadResult.success 
            ? 'border-l-green-500 bg-green-50' 
            : 'border-l-red-500 bg-red-50'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              {loadResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <Loader2 className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className={`font-medium ${
                  loadResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {loadResult.success ? 'Import réussi !' : 'Erreur d\'import'}
                </h4>
                <p className={`text-sm mt-1 ${
                  loadResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {loadResult.message}
                </p>

                {loadResult.stats && (
                  <div className="mt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Total lignes:</span> {loadResult.stats.totalRows}
                      </div>
                      <div>
                        <span className="font-medium">Matchs valides:</span> {loadResult.stats.validMatches}
                      </div>
                      <div>
                        <span className="font-medium text-green-700">Insérés:</span> {loadResult.stats.inserted}
                      </div>
                      <div>
                        <span className="font-medium text-yellow-700">Ignorés:</span> {loadResult.stats.skipped}
                      </div>
                    </div>

                    {loadResult.stats.parseErrors.length > 0 && (
                      <div className="mt-3">
                        <h5 className="font-medium text-red-700 text-sm mb-1">
                          Erreurs de parsing ({loadResult.stats.parseErrors.length}):
                        </h5>
                        <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                          {loadResult.stats.parseErrors.slice(0, 5).map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rapport du test de cohérence */}
      {coherenceResult && (
        <Card className={`border-l-4 ${
          coherenceResult.ok
            ? (coherenceResult.warnings.length > 0 ? 'border-l-yellow-500 bg-yellow-50' : 'border-l-green-500 bg-green-50')
            : 'border-l-red-500 bg-red-50'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              {coherenceResult.ok ? (
                coherenceResult.warnings.length > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                ) : (
                  <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
                )
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className={`font-medium ${
                  coherenceResult.ok
                    ? (coherenceResult.warnings.length > 0 ? 'text-yellow-800' : 'text-green-800')
                    : 'text-red-800'
                }`}>
                  {coherenceResult.ok
                    ? (coherenceResult.warnings.length > 0 ? 'Test de cohérence : anomalies à vérifier' : 'Test de cohérence réussi')
                    : 'Test de cohérence échoué'}
                </h4>

                {/* Résumé des corrections */}
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
                  <div><span className="font-medium">Saison détectée :</span> {coherenceResult.summary.detectedSaison || '—'}</div>
                  <div><span className="font-medium">Matchs valides :</span> {coherenceResult.summary.validMatches}</div>
                  <div><span className="font-medium">Années corrigées :</span> {coherenceResult.summary.yearCorrected}</div>
                  <div><span className="font-medium">Lignes phase finale exclues :</span> {coherenceResult.summary.excludedFinalRound}</div>
                  <div><span className="font-medium">Équipes normalisées :</span> {coherenceResult.summary.normalizedTeams}</div>
                  <div><span className="font-medium">Doublons internes :</span> {coherenceResult.summary.internalDuplicates}</div>
                  {coherenceResult.summary.dateRange.min && (
                    <div className="col-span-2"><span className="font-medium">Période :</span> {coherenceResult.summary.dateRange.min} → {coherenceResult.summary.dateRange.max}</div>
                  )}
                </div>

                {/* Répartition par division */}
                {Object.keys(coherenceResult.summary.divisionBreakdown).length > 0 && (
                  <div className="mt-3 text-sm">
                    <span className="font-medium text-gray-700">Répartition par division :</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Object.entries(coherenceResult.summary.divisionBreakdown)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([div, count]) => (
                          <span key={div} className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                            {div} : {count}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Erreurs bloquantes */}
                {coherenceResult.errors.length > 0 && (
                  <div className="mt-3">
                    <h5 className="font-medium text-red-700 text-sm mb-1">Erreurs bloquantes :</h5>
                    <ul className="text-xs text-red-600 space-y-1">
                      {coherenceResult.errors.map((e, i) => (<li key={i}>• {e}</li>))}
                    </ul>
                  </div>
                )}

                {/* Avertissements */}
                {coherenceResult.warnings.length > 0 && (
                  <div className="mt-3">
                    <h5 className="font-medium text-yellow-700 text-sm mb-1">Avertissements :</h5>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      {coherenceResult.warnings.map((w, i) => (<li key={i}>• {w}</li>))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des fichiers */}
      <div className="space-y-2">
        {files.map((file) => (
          <Card key={file.id} className={`transition-all ${
            file.isLoaded ? 'border-green-200 bg-green-50' : 'border-gray-200'
          }`}>
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <FileText className={`h-5 w-5 shrink-0 ${
                    file.isLoaded ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 break-words">
                      {file.originalName}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(file.uploadedAt), { 
                          addSuffix: true,
                          locale: fr 
                        })}
                      </span>
                      {file.isLoaded && file.matchCount && (
                        <span className="flex items-center text-green-600 font-medium">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {file.matchCount} matchs importés
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:ml-4 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleValidateFile(file.id, file.originalName)}
                    disabled={validatingFileId === file.id || loadingFileId === file.id || deletingFileId === file.id}
                    className="flex-1 sm:flex-none"
                  >
                    {validatingFileId === file.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Vérification...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4 mr-1" />
                        Vérifier la cohérence
                      </>
                    )}
                  </Button>

                  <Button
                    variant={file.isLoaded ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleLoadFile(file.id, file.originalName)}
                    disabled={validatingFileId === file.id || loadingFileId === file.id || deletingFileId === file.id}
                    className={`flex-1 sm:flex-none ${file.isLoaded ? "" : "bg-blue-600 hover:bg-blue-700"}`}
                  >
                    {loadingFileId === file.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-1" />
                        {file.isLoaded ? 'Recharger' : 'Charger'}
                      </>
                    )}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={loadingFileId === file.id || deletingFileId === file.id}
                      >
                        {deletingFileId === file.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer le fichier <strong>{file.originalName}</strong> ?
                          <br /><br />
                          Cette action est irréversible et supprimera le fichier du stockage cloud.
                          {file.isLoaded && (
                            <span className="text-orange-600 font-medium">
                              <br /><br />
                              Note: Les données déjà importées dans la base de données ne seront pas supprimées.
                            </span>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteFile(file.id, file.originalName)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
