
"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface UploadResult {
  success: boolean;
  message: string;
  file?: {
    id: string;
    name: string;
    size: number;
    uploadedAt: string;
  };
  error?: string;
  details?: string;
}

interface UploadSectionProps {
  onFileUploaded?: () => void;
}

export function UploadSection({ onFileUploaded }: UploadSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      toast.error('Seuls les fichiers .xlsx sont acceptés');
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-excel', {
        method: 'POST',
        body: formData,
      });

      const result: UploadResult = await response.json();
      setUploadResult(result);

      if (result.success) {
        toast.success(result.message);
        // Appeler le callback pour rafraîchir la liste des fichiers
        if (onFileUploaded) {
          onFileUploaded();
        }
      } else {
        toast.error(result.error || 'Erreur lors de l\'upload');
      }
    } catch (error) {
      const errorResult: UploadResult = {
        success: false,
        message: 'Erreur de connexion',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
      setUploadResult(errorResult);
      toast.error('Erreur lors de l\'upload du fichier');
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  }, [onFileUploaded]);

  return (
    <div className="space-y-4">
      {/* Zone d'upload */}
      <div className="relative">
        <input
          type="file"
          accept=".xlsx"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          disabled={isUploading}
        />
        <Card className={`border-2 border-dashed transition-colors ${
          isUploading 
            ? 'border-blue-300 bg-blue-50' 
            : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'
        }`}>
          <CardContent className="flex flex-col items-center justify-center py-12">
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-blue-600 font-medium">Upload en cours...</p>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Cliquez pour sélectionner un fichier Excel
                  </p>
                  <p className="text-sm text-gray-500">
                    Formats supportés: .xlsx uniquement
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Résultat de l'upload */}
      {uploadResult && (
        <Card className={`border-l-4 ${
          uploadResult.success 
            ? 'border-l-green-500 bg-green-50' 
            : 'border-l-red-500 bg-red-50'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              {uploadResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className={`font-medium ${
                  uploadResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {uploadResult.success ? 'Upload réussi !' : 'Erreur d\'upload'}
                </h4>
                <p className={`text-sm mt-1 ${
                  uploadResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {uploadResult.message}
                </p>

                {/* Info fichier uploadé */}
                {uploadResult.file && (
                  <p className="text-sm mt-2 text-green-700">
                    Le fichier est maintenant disponible dans la liste ci-dessous. Cliquez sur "Charger" pour importer les données.
                  </p>
                )}

                {/* Message d'erreur simple */}
                {uploadResult.error && (
                  <p className="text-sm mt-2 text-red-600">
                    {uploadResult.details}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 mb-2">
                Structure attendue du fichier Excel
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Colonnes: Semaine, Jour, Période, Date, Division, Heure</li>
                <li>• Équipe Domicile, Équipe Extérieur, Score Domicile, Score Extérieur</li>
                <li>• Lieu, Adresse, Ville, Saison</li>
                <li>• Les dates (années), les divisions et les noms d'équipes sont automatiquement corrigés à chaque chargement</li>
              </ul>
              <p className="text-sm text-blue-700 mt-3 font-medium">
                ℹ️ Les fichiers sont d'abord uploadés. Avant le chargement, utilisez « Vérifier la cohérence » pour contrôler les données, puis « Charger » pour les importer dans la base.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
