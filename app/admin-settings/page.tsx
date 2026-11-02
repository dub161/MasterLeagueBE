'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Home,
  Lock,
  Upload,
  Image,
  Users,
  Languages,
  FileText,
  Trash2,
  ClipboardEdit,
  Rocket,
  Trophy,
  Mail,
} from 'lucide-react';
import { useLocale } from '@/lib/i18n/locale-context';
import { FileManager } from '@/components/file-manager';
import { UploadSection } from '@/components/upload-section';
import { GmailImportSection } from '@/components/gmail-import-section';
import { ClearDatabaseSection } from '@/components/clear-database-section';
import { LoadTestFilesSection } from '@/components/load-test-files-section';

export default function AdminSettingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLocale();
  const router = useRouter();

  // Check if already authenticated in session
  useEffect(() => {
    const auth = sessionStorage.getItem('adminAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem('adminAuth', 'true');
        setIsAuthenticated(true);
        setPassword('');
      } else {
        setError(data.error || 'Mot de passe incorrect');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
    setPassword('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-md mx-auto mt-20">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Accès Administration</CardTitle>
              <CardDescription>
                Veuillez entrer le mot de passe pour accéder aux paramètres
                d'administration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Entrez le mot de passe"
                    className="w-full"
                    disabled={isLoading}
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !password}
                >
                  {isLoading ? 'Connexion...' : 'Se connecter'}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <Link href="/">
                  <Button variant="ghost" className="text-sm">
                    <Home className="w-4 h-4 mr-2" />
                    {t('common.backToHome')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Paramètres d'Administration
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Gestion des équipes, fichiers et données
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  {t('common.backToHome')}
                </Button>
              </Link>
              <Button variant="destructive" onClick={handleLogout}>
                <Lock className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Accès rapide</CardTitle>
            <CardDescription>
              Liens vers les pages de gestion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/team-logos-manager">
                <Button
                  variant="outline"
                  className="w-full h-24 flex flex-col gap-2"
                >
                  <Image className="w-6 h-6" />
                  <span>Logos d'équipes</span>
                </Button>
              </Link>

              <Link href="/team-management">
                <Button
                  variant="outline"
                  className="w-full h-24 flex flex-col gap-2"
                >
                  <Users className="w-6 h-6" />
                  <span>Alias d'équipes</span>
                </Button>
              </Link>

              <Link href="/match-management">
                <Button
                  variant="outline"
                  className="w-full h-24 flex flex-col gap-2"
                >
                  <ClipboardEdit className="w-6 h-6" />
                  <span>Gestion des matchs</span>
                </Button>
              </Link>

              <Link href="/language-settings">
                <Button
                  variant="outline"
                  className="w-full h-24 flex flex-col gap-2"
                >
                  <Languages className="w-6 h-6" />
                  <span>Paramètres de langue</span>
                </Button>
              </Link>

              <Link href="/championship-standings">
                <Button
                  variant="outline"
                  className="w-full h-24 flex flex-col gap-2"
                >
                  <FileText className="w-6 h-6" />
                  <span>Classements</span>
                </Button>
              </Link>

              <Link href="/playoff-config">
                <Button
                  variant="outline"
                  className="w-full h-24 flex flex-col gap-2"
                >
                  <Trophy className="w-6 h-6" />
                  <span>Config Play-offs</span>
                </Button>
              </Link>

              <Link href="/release-notes">
                <Button
                  variant="outline"
                  className="w-full h-24 flex flex-col gap-2"
                >
                  <Rocket className="w-6 h-6" />
                  <span>Release Notes</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Upload Excel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Chargement des données Excel
            </CardTitle>
            <CardDescription>
              Téléversez un fichier Excel contenant les matchs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadSection onFileUploaded={() => setRefreshKey((k) => k + 1)} />
          </CardContent>
        </Card>

        {/* Import depuis Gmail */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Récupérer un fichier depuis Gmail
            </CardTitle>
            <CardDescription>
              Rafraîchissez vos e-mails et sélectionnez une pièce jointe Excel à importer. Le fichier apparaîtra ci-dessous pour vérification et chargement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GmailImportSection onImported={() => setRefreshKey((k) => k + 1)} />
          </CardContent>
        </Card>

        {/* File Manager */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Fichiers téléchargés
            </CardTitle>
            <CardDescription>
              Gestion des fichiers Excel et images
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileManager refreshSignal={refreshKey} />
          </CardContent>
        </Card>

        {/* Load Test Files */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Charger les fichiers de test
            </CardTitle>
            <CardDescription>
              Charger rapidement les fichiers Excel de test pour développement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoadTestFilesSection />
          </CardContent>
        </Card>

        {/* Clear Database */}
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Trash2 className="w-5 h-5" />
              Nettoyage de la base de données
            </CardTitle>
            <CardDescription className="text-red-600">
              Attention : cette action supprime toutes les données
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClearDatabaseSection />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
