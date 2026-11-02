"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Mail,
  RefreshCw,
  Download,
  Loader2,
  Paperclip,
  AlertTriangle,
  Inbox,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";

interface GmailAttachment {
  part: string;
  filename: string;
  size: number;
}

interface GmailMessage {
  uid: number;
  subject: string;
  date: string | null;
  from: string;
  attachments: GmailAttachment[];
}

interface ListResponse {
  success: boolean;
  configured: boolean;
  sender: string;
  emails: GmailMessage[];
  error?: string;
}

interface GmailImportSectionProps {
  onImported?: () => void;
}

export function GmailImportSection({ onImported }: GmailImportSectionProps) {
  const [isFetching, setIsFetching] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [sender, setSender] = useState<string>("");
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importingKey, setImportingKey] = useState<string | null>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleRefresh = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const res = await fetch("/api/gmail/list");
      const data: ListResponse = await res.json();
      setConfigured(data.configured);
      setSender(data.sender || "");

      if (!res.ok || !data.success) {
        setEmails([]);
        setError(data.error || "Erreur lors de la récupération des e-mails.");
        toast({
          title: "❌ Erreur Gmail",
          description: data.error || "Impossible de récupérer les e-mails.",
          variant: "destructive",
          duration: 6000,
        });
      } else {
        setEmails(data.emails || []);
        if (data.configured) {
          toast({
            title: "✉️ E-mails actualisés",
            description: `${data.emails.length} e-mail(s) avec pièce jointe Excel trouvé(s).`,
            duration: 4000,
          });
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de connexion.");
      toast({
        title: "❌ Erreur",
        description: "Impossible de contacter le service Gmail.",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
      setHasFetched(true);
    }
  };

  const handleImport = async (uid: number, att: GmailAttachment) => {
    const key = `${uid}:${att.part}`;
    setImportingKey(key);
    try {
      const res = await fetch("/api/gmail/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, part: att.part }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast({
          title: "✅ Fichier récupéré",
          description: data.message,
          duration: 6000,
        });
        if (onImported) onImported();
      } else {
        throw new Error(data.error || "Échec de la récupération du fichier.");
      }
    } catch (e) {
      toast({
        title: "❌ Erreur",
        description: e instanceof Error ? e.message : "Impossible de récupérer le fichier.",
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setImportingKey(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <Mail className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-medium text-gray-800">Récupérer depuis Gmail</p>
            <p className="text-xs text-gray-500 break-words">
              {sender
                ? `Expéditeur(s) suivi(s) : ${sender.split(',').map(s => s.trim()).join(', ')}`
                : "E-mails avec pièce jointe Excel (.xlsx)"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isFetching}
          className="w-full sm:w-auto shrink-0"
        >
          {isFetching ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Actualisation...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-1" />
              Rafraîchir les e-mails
            </>
          )}
        </Button>
      </div>

      {/* Non configuré */}
      {configured === false && (
        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Connexion Gmail non configurée</p>
                <p className="mt-1 text-yellow-700">
                  La récupération automatique n'est pas encore activée. Vous pouvez
                  toujours déposer un fichier manuellement ci-dessus.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Erreur */}
      {error && configured !== false && (
        <Card className="border-l-4 border-l-red-500 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste vide après recherche */}
      {hasFetched && configured === true && !error && emails.length === 0 && (
        <div className="text-center py-6 text-sm text-gray-500">
          <Inbox className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          Aucun e-mail avec pièce jointe Excel trouvé.
        </div>
      )}

      {/* Liste des e-mails */}
      {emails.length > 0 && (
        <div className="space-y-2">
          {emails.map((email) => (
            <Card key={email.uid} className="border-gray-200">
              <CardContent className="py-3">
                <div className="min-w-0">
                  {email.date && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="inline-flex items-center rounded-md bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                        {format(new Date(email.date), "d MMM yyyy", { locale: fr })}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({formatDistanceToNow(new Date(email.date), { addSuffix: true, locale: fr })})
                      </span>
                    </div>
                  )}
                  <p className="font-medium text-gray-900 break-words">
                    {email.subject}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 break-words">
                    {email.from}
                  </p>
                </div>

                <div className="mt-2 space-y-1.5">
                  {email.attachments.map((att) => {
                    const key = `${email.uid}:${att.part}`;
                    return (
                      <div
                        key={key}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md bg-gray-50 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-700 break-all">
                            {att.filename}
                          </span>
                          {att.size > 0 && (
                            <span className="text-xs text-gray-400 shrink-0">
                              ({formatFileSize(att.size)})
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleImport(email.uid, att)}
                          disabled={importingKey === key}
                          className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto shrink-0"
                        >
                          {importingKey === key ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Récupération...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-1" />
                              Récupérer ce fichier
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
