
"use client";

import { useState, useEffect } from "react";
import { Settings, Plus, Trash2, Edit, Save, X, Home } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface TeamAlias {
  id: string;
  displayName: string;
  originalNames: string[];
  saison: string;
  createdAt: string;
  updatedAt: string;
}

export default function TeamManagementPage() {
  const [saison, setSaison] = useState<string>("");
  const [availableSeasons, setAvailableSeasons] = useState<string[]>([]);
  const [aliases, setAliases] = useState<TeamAlias[]>([]);
  const [allTeamNames, setAllTeamNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Formulaire
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formOriginalNames, setFormOriginalNames] = useState<string[]>([]);
  const [newOriginalName, setNewOriginalName] = useState("");

  // Charger les saisons disponibles
  const loadAvailableSeasons = async () => {
    try {
      const response = await fetch('/api/filters');
      const data = await response.json();
      if (data.success && data.filters?.saisons && data.filters.saisons.length > 0) {
        setAvailableSeasons(data.filters.saisons);
        // Initialiser avec la première saison si aucune n'est sélectionnée
        if (!saison) {
          setSaison(data.filters.saisons[0]);
        }
      }
    } catch (error) {
      console.error('Error loading seasons:', error);
    }
  };

  // Charger les alias
  const loadAliases = async () => {
    if (!saison) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/team-aliases?saison=${saison}`);
      const data = await response.json();
      if (data.success) {
        setAliases(data.aliases || []);
      }
    } catch (error) {
      console.error('Error loading aliases:', error);
      toast.error('Erreur lors du chargement des alias');
    } finally {
      setLoading(false);
    }
  };

  // Charger tous les noms d'équipes
  const loadTeamNames = async () => {
    if (!saison) return;
    try {
      const response = await fetch(`/api/team-names?saison=${saison}`);
      const data = await response.json();
      if (data.success) {
        setAllTeamNames(data.teams || []);
      }
    } catch (error) {
      console.error('Error loading team names:', error);
    }
  };

  // Charger les saisons au montage
  useEffect(() => {
    loadAvailableSeasons();
  }, []);

  // Charger les données quand la saison change
  useEffect(() => {
    if (saison) {
      loadAliases();
      loadTeamNames();
    }
  }, [saison]);

  const handleAddOriginalName = () => {
    if (newOriginalName && !formOriginalNames.includes(newOriginalName)) {
      setFormOriginalNames([...formOriginalNames, newOriginalName]);
      setNewOriginalName("");
    }
  };

  const handleRemoveOriginalName = (name: string) => {
    setFormOriginalNames(formOriginalNames.filter(n => n !== name));
  };

  const handleSaveAlias = async () => {
    if (!formDisplayName || formOriginalNames.length === 0) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      const url = editingId ? '/api/team-aliases' : '/api/team-aliases';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          displayName: formDisplayName,
          originalNames: formOriginalNames,
          saison
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(editingId ? 'Alias mis à jour' : 'Alias créé');
        setShowAddDialog(false);
        setEditingId(null);
        setFormDisplayName("");
        setFormOriginalNames([]);
        loadAliases();
      } else {
        toast.error(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving alias:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleEditAlias = (alias: TeamAlias) => {
    setEditingId(alias.id);
    setFormDisplayName(alias.displayName);
    setFormOriginalNames(alias.originalNames);
    setShowAddDialog(true);
  };

  const handleDeleteAlias = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet alias ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/team-aliases?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Alias supprimé');
        loadAliases();
      } else {
        toast.error(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting alias:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormDisplayName("");
    setFormOriginalNames([]);
    setNewOriginalName("");
  };

  // Appliquer les alias rétroactivement
  const handleApplyRetroactive = async () => {
    try {
      const response = await fetch('/api/team-aliases/apply-retroactive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saison })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Cache rafraîchi ! Les alias seront appliqués lors de la prochaine consultation.');
      } else {
        toast.error(data.error || 'Erreur lors du rafraîchissement');
      }
    } catch (error) {
      console.error('Error applying retroactive:', error);
      toast.error('Erreur lors du rafraîchissement du cache');
    }
  };

  // Trouver les noms d'équipes non encore mappés
  const unmappedTeams = allTeamNames.filter(name => 
    !aliases.some(alias => alias.originalNames.includes(name))
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Bouton retour */}
      <div className="mb-6">
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            Retour à l'accueil
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Settings className="h-12 w-12 text-orange-600 mr-3" />
          <h1 className="text-4xl font-bold text-gray-900">
            Gestion des <span className="text-orange-600">Équipes</span>
          </h1>
        </div>
        <p className="text-lg text-gray-600">
          Harmonisez les noms d'équipes qui apparaissent dans les résultats, classements et filtres
        </p>
      </div>

      {/* Sélection de saison */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Saison</CardTitle>
          <CardDescription>
            Les alias sont automatiquement appliqués à tous les matchs, résultats et classements de la saison sélectionnée. 
            Cliquez sur &quot;Rafraîchir le cache&quot; après avoir modifié des alias pour voir les changements immédiatement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <Select value={saison} onValueChange={setSaison}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Sélectionner une saison..." />
              </SelectTrigger>
              <SelectContent>
                {availableSeasons.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Dialog open={showAddDialog} onOpenChange={(open) => {
              setShowAddDialog(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nouvel Alias
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? 'Modifier l\'alias' : 'Créer un nouvel alias'}
                  </DialogTitle>
                  <DialogDescription>
                    Regroupez plusieurs noms d'équipes sous un seul nom d'affichage
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="displayName">Nom d'affichage</Label>
                    <Input
                      id="displayName"
                      value={formDisplayName}
                      onChange={(e) => setFormDisplayName(e.target.value)}
                      placeholder="Ex: REBOND OTTIGNIES"
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Ce nom apparaîtra dans tous les filtres et classements
                    </p>
                  </div>

                  <div>
                    <Label>Noms originaux</Label>
                    <div className="flex gap-2 mt-1">
                      <Select value={newOriginalName} onValueChange={setNewOriginalName}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un nom..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allTeamNames
                            .filter(name => !formOriginalNames.includes(name))
                            .map(name => (
                              <SelectItem key={name} value={name}>
                                {name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={handleAddOriginalName} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      {formOriginalNames.map(name => (
                        <div key={name} className="flex items-center justify-between bg-gray-100 rounded p-2">
                          <span className="text-sm">{name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveOriginalName(name)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => {
                      setShowAddDialog(false);
                      resetForm();
                    }}>
                      Annuler
                    </Button>
                    <Button onClick={handleSaveAlias}>
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              variant="outline" 
              onClick={handleApplyRetroactive}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Rafraîchir le cache
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des alias */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Alias configurés ({aliases.length})</CardTitle>
          <CardDescription>
            Ces regroupements sont actifs pour la saison {saison}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-600">Chargement...</div>
          ) : aliases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun alias configuré pour cette saison
            </div>
          ) : (
            <div className="space-y-4">
              {aliases.map(alias => (
                <div key={alias.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-orange-600">
                        {alias.displayName}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Regroupe {alias.originalNames.length} nom{alias.originalNames.length > 1 ? 's' : ''}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {alias.originalNames.map(name => (
                          <span
                            key={name}
                            className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAlias(alias)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAlias(alias.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Noms non mappés */}
      {unmappedTeams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Équipes sans alias ({unmappedTeams.length})</CardTitle>
            <CardDescription>
              Ces noms d'équipes n'ont pas encore été regroupés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {unmappedTeams.map(name => (
                <div key={name} className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm">
                  {name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
