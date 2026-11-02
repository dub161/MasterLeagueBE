
"use client";

import { useState } from "react";
import { Download, CheckCircle, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface LoadTestFilesResult {
  success: boolean;
  message: string;
  results?: {
    files: Array<{
      filename: string;
      status: string;
      message?: string;
      stats?: any;
      errors?: string[];
    }>;
    totalInserted: number;
    errors: string[];
  };
}

export function LoadTestFilesSection() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadResult, setLoadResult] = useState<LoadTestFilesResult | null>(null);

  const handleLoadTestFiles = async () => {
    setIsLoading(true);
    setLoadResult(null);

    try {
      const response = await fetch('/api/load-test-files', {
        method: 'POST',
      });

      const result: LoadTestFilesResult = await response.json();
      setLoadResult(result);

      if (result.success) {
        toast.success(`${result.results?.totalInserted || 0} matchs chargés avec succès`);
      } else {
        toast.error('Erreur lors du chargement des fichiers de test');
      }
    } catch (error) {
      const errorResult: LoadTestFilesResult = {
        success: false,
        message: 'Erreur de connexion',
      };
      setLoadResult(errorResult);
      toast.error('Erreur lors du chargement des fichiers');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bouton de chargement */}
      <Button
        onClick={handleLoadTestFiles}
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700"
        size="lg"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Chargement en cours...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Charger les fichiers de test
          </>
        )}
      </Button>

      {/* Description des fichiers */}
      <div className="grid grid-cols-1 gap-3 text-sm">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-green-600" />
          <span className="font-medium">MASTERS BASIC 251013.xlsx</span>
          <span className="text-gray-500">- Calendrier saison 2025-2026</span>
        </div>
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-blue-600" />
          <span className="font-medium">CHRONOLOGIC MASTERS.xlsx</span>
          <span className="text-gray-500">- Résultats avec scores</span>
        </div>
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
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className={`font-medium ${
                  loadResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {loadResult.success ? 'Chargement réussi !' : 'Erreur de chargement'}
                </h4>
                <p className={`text-sm mt-1 ${
                  loadResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {loadResult.message}
                </p>

                {/* Détails des fichiers */}
                {loadResult.results?.files && (
                  <div className="mt-3 space-y-2">
                    {loadResult.results.files.map((file, index) => (
                      <div key={index} className="border border-gray-200 rounded p-3 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{file.filename}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            file.status === 'success' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {file.status}
                          </span>
                        </div>
                        
                        {file.stats && (
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div>Total lignes: {file.stats.totalRows}</div>
                            <div>Matchs valides: {file.stats.validMatches}</div>
                            <div className="text-green-600">Insérés: {file.stats.inserted}</div>
                            <div className="text-yellow-600">Ignorés: {file.stats.skipped}</div>
                          </div>
                        )}
                        
                        {file.message && (
                          <p className="text-xs text-gray-600 mt-2">{file.message}</p>
                        )}
                      </div>
                    ))}
                    
                    <div className="text-center text-sm font-medium text-blue-700 pt-2 border-t">
                      Total de {loadResult.results.totalInserted} matchs chargés
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
