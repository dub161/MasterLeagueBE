
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
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

export function ClearDatabaseSection() {
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  const handleClearDatabase = async () => {
    setIsClearing(true);
    
    try {
      const response = await fetch('/api/clear-database', {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({
          title: "✅ Base de données nettoyée",
          description: data.message,
          duration: 5000,
        });
        
        // Recharger la page après 1 seconde pour actualiser l'interface
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error(data.error || 'Erreur lors du nettoyage');
      }
      
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "❌ Erreur",
        description: error instanceof Error ? error.message : "Impossible de nettoyer la base de données",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start space-x-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-yellow-800">
          <p className="font-semibold mb-1">Attention : Action irréversible</p>
          <p>
            Cette action supprimera toutes les données de la base de données (matchs, résultats, etc.). 
            Cette opération ne peut pas être annulée.
          </p>
        </div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="destructive" 
            className="w-full"
            disabled={isClearing}
          >
            {isClearing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Nettoyage en cours...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Nettoyer la base de données
              </>
            )}
          </Button>
        </AlertDialogTrigger>
        
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Êtes-vous sûr de vouloir supprimer <strong>toutes les données</strong> de la base de données ?
              </p>
              <p className="text-red-600 font-semibold">
                Cette action est irréversible et supprimera tous les matchs et résultats.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearDatabase}
              className="bg-red-600 hover:bg-red-700"
            >
              Oui, tout supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
