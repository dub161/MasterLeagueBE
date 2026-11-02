
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Trash2, ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TeamLogo {
  id: string;
  teamName: string;
  cloudStoragePath: string;
  originalFileName: string;
  uploadedAt: string;
  updatedAt: string;
  signedUrl?: string;
}

export default function TeamLogosManagerPage() {
  const { toast } = useToast();
  const [teams, setTeams] = useState<string[]>([]);
  const [logos, setLogos] = useState<TeamLogo[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [isLoadingLogos, setIsLoadingLogos] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<string>("");

  // Charger les équipes
  useEffect(() => {
    fetchTeams();
    fetchLogos();
  }, []);

  const fetchTeams = async () => {
    try {
      setIsLoadingTeams(true);
      const response = await fetch("/api/teams");
      const data = await response.json();
      setTeams(data.teams || []);
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les équipes",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const fetchLogos = async () => {
    try {
      setIsLoadingLogos(true);
      const response = await fetch("/api/team-logos");
      const data = await response.json();
      
      // Charger les URLs signées pour chaque logo
      const logosWithUrls = await Promise.all(
        (data.logos || []).map(async (logo: TeamLogo) => {
          try {
            const urlResponse = await fetch(`/api/team-logos/${encodeURIComponent(logo.teamName)}`);
            const urlData = await urlResponse.json();
            return { ...logo, signedUrl: urlData.logo?.signedUrl };
          } catch (error) {
            console.error(`Error fetching signed URL for ${logo.teamName}:`, error);
            return logo;
          }
        })
      );
      
      setLogos(logosWithUrls);
    } catch (error) {
      console.error("Error fetching logos:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les logos",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLogos(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Fichier invalide",
          description: "Seules les images (JPEG, PNG, GIF, WebP) sont acceptées",
          variant: "destructive",
        });
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille maximale est de 5 MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      
      // Créer une preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedTeam || !selectedFile) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez sélectionner une équipe et un fichier",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🚀 Starting upload process...');
      console.log(`📋 Team: ${selectedTeam}, File: ${selectedFile.name}, Size: ${selectedFile.size} bytes`);
      
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("teamName", selectedTeam);

      console.log('📤 Sending request to /api/team-logos/upload');
      const startTime = Date.now();

      const response = await fetch("/api/team-logos/upload", {
        method: "POST",
        body: formData,
      });

      const elapsedTime = Date.now() - startTime;
      console.log(`⏱️ Request completed in ${elapsedTime}ms`);
      console.log(`📊 Response status: ${response.status}`);

      const data = await response.json();
      console.log('📥 Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      console.log('✅ Upload successful!');
      toast({
        title: "Succès",
        description: data.message,
      });

      // Reset form
      setSelectedTeam("");
      setSelectedFile(null);
      setPreviewUrl("");
      
      // Reload logos
      console.log('🔄 Reloading logos list...');
      await fetchLogos();
    } catch (error) {
      console.error("❌ Error uploading logo:", error);
      console.error("Error details:", error instanceof Error ? error.message : "Unknown error");
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'uploader le logo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      console.log('🏁 Upload process finished');
    }
  };

  const confirmDelete = (teamName: string) => {
    setTeamToDelete(teamName);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!teamToDelete) return;

    try {
      const response = await fetch(`/api/team-logos/${encodeURIComponent(teamToDelete)}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Delete failed");
      }

      toast({
        title: "Succès",
        description: data.message,
      });

      // Reload logos
      await fetchLogos();
    } catch (error) {
      console.error("Error deleting logo:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer le logo",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setTeamToDelete("");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1e3a5f] mb-2">
          Gestion des Logos d'Équipes
        </h1>
        <p className="text-gray-600">
          Téléchargez et gérez les logos pour chaque équipe
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Télécharger un logo
            </CardTitle>
            <CardDescription>
              Sélectionnez une équipe et téléchargez son logo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-select">Équipe</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger id="team-select">
                  <SelectValue placeholder="Sélectionner une équipe" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingTeams ? (
                    <SelectItem value="loading">Chargement...</SelectItem>
                  ) : (
                    teams.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-upload">Fichier image</Label>
              <Input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <p className="text-xs text-gray-500">
                Formats acceptés: JPEG, PNG, GIF, WebP (max 5 MB)
              </p>
            </div>

            {previewUrl && (
              <div className="space-y-2">
                <Label>Aperçu</Label>
                <div className="relative w-32 h-32 mx-auto bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedTeam || !selectedFile || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Téléchargement...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Télécharger le logo
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-[#1e3a5f]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1e3a5f]">
              <ImageIcon className="h-5 w-5" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-700">
              <p className="font-semibold mb-2">Comment ça marche :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Les équipes proviennent des fichiers Excel chargés</li>
                <li>Sélectionnez une équipe dans la liste</li>
                <li>Téléchargez une image pour cette équipe</li>
                <li>Le logo sera automatiquement affiché dans les résultats</li>
                <li>Vous pouvez mettre à jour ou supprimer un logo à tout moment</li>
              </ul>
            </div>
            <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-[#1e3a5f] mb-1">
                Statistiques
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {logos.length}
              </p>
              <p className="text-xs text-gray-600">
                logo{logos.length !== 1 ? 's' : ''} configuré{logos.length !== 1 ? 's' : ''}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logos List */}
      <Card>
        <CardHeader>
          <CardTitle>Logos configurés</CardTitle>
          <CardDescription>
            Liste de tous les logos actuellement configurés
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingLogos ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f]" />
            </div>
          ) : logos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucun logo configuré pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {logos.map((logo) => (
                <Card key={logo.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="relative w-24 h-24 mx-auto bg-gray-100 rounded-lg overflow-hidden">
                        {logo.signedUrl ? (
                          <Image
                            src={logo.signedUrl}
                            alt={logo.teamName}
                            fill
                            className="object-contain"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-[#1e3a5f]">
                          {logo.teamName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {logo.originalFileName}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => confirmDelete(logo.teamName)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le logo de l'équipe <strong>{teamToDelete}</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
