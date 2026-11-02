import { ImapFlow } from "imapflow";

/**
 * Intégration Gmail (lecture seule via IMAP).
 * Se connecte avec un "mot de passe d'application" Google stocké côté serveur.
 * Ne lit QUE les e-mails de l'expéditeur autorisé et ne récupère QUE les
 * pièces jointes Excel (.xlsx).
 */

const GMAIL_HOST = "imap.gmail.com";
const GMAIL_PORT = 993;

export interface GmailAttachment {
  part: string;
  filename: string;
  size: number;
}

export interface GmailMessage {
  uid: number;
  subject: string;
  date: string | null;
  from: string;
  attachments: GmailAttachment[];
}

export function getGmailConfig() {
  const senderRaw = process.env.GMAIL_SENDER_FILTER || "";
  // Support liste d'expéditeurs séparés par virgule
  const senders = senderRaw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return {
    user: process.env.GMAIL_USER || "",
    pass: process.env.GMAIL_APP_PASSWORD || "",
    sender: senderRaw,
    senders,
  };
}

/** Vérifie si une adresse fait partie des expéditeurs autorisés */
function isSenderAllowed(address: string, senders: string[]): boolean {
  if (senders.length === 0) return true; // pas de filtre → tout est autorisé
  return senders.includes(address.toLowerCase());
}

export function isGmailConfigured(): boolean {
  const { user, pass } = getGmailConfig();
  return Boolean(user && pass);
}

function createClient() {
  const { user, pass } = getGmailConfig();
  return new ImapFlow({
    host: GMAIL_HOST,
    port: GMAIL_PORT,
    secure: true,
    auth: { user, pass },
    logger: false,
    // Délais raisonnables pour éviter les connexions suspendues
    socketTimeout: 30000,
  });
}

/** Détecte si une pièce jointe est un fichier Excel .xlsx */
function isXlsx(filename: string | undefined | null): boolean {
  if (!filename) return false;
  return filename.toLowerCase().trim().endsWith(".xlsx");
}

/** Parcourt récursivement la structure MIME pour collecter les PJ .xlsx */
function collectAttachments(node: any, acc: GmailAttachment[]): void {
  if (!node) return;

  const disposition = (node.disposition || "").toLowerCase();
  const dispFilename = node.dispositionParameters?.filename;
  const paramName = node.parameters?.name;
  const filename = dispFilename || paramName;

  const looksAttachment = disposition === "attachment" || Boolean(filename);

  if (looksAttachment && isXlsx(filename) && node.part) {
    acc.push({
      part: String(node.part),
      filename: String(filename),
      size: typeof node.size === "number" ? node.size : 0,
    });
  }

  if (Array.isArray(node.childNodes)) {
    for (const child of node.childNodes) {
      collectAttachments(child, acc);
    }
  }
}

function envelopeFrom(envelope: any): string {
  const from = envelope?.from?.[0];
  if (!from) return "";
  const addr = from.address || "";
  const name = from.name || "";
  return name ? `${name} <${addr}>` : addr;
}

/**
 * Liste les e-mails récents de l'expéditeur autorisé qui contiennent au moins
 * une pièce jointe .xlsx. Trie du plus récent au plus ancien.
 */
export async function listSenderXlsxEmails(limit = 25): Promise<GmailMessage[]> {
  const { senders } = getGmailConfig();
  const client = createClient();
  const results: GmailMessage[] = [];

  await client.connect();
  const lock = await client.getMailboxLock("INBOX");
  try {
    // Rechercher les e-mails de chaque expéditeur autorisé, ou tous
    let uids: number[] = [];
    if (senders.length > 0) {
      for (const s of senders) {
        const found = (await client.search({ from: s }, { uid: true })) || [];
        uids.push(...found);
      }
      // Dédupliquer et trier par uid
      uids = [...new Set(uids)].sort((a, b) => a - b);
    } else {
      uids = (await client.search({ all: true }, { uid: true })) || [];
    }
    if (!uids.length) return [];

    // Garder les plus récents (uids croissants = plus récents en dernier)
    const recent = uids.slice(-Math.max(limit * 2, limit));

    for await (const msg of client.fetch(
      recent,
      { uid: true, envelope: true, bodyStructure: true },
      { uid: true }
    )) {
      const attachments: GmailAttachment[] = [];
      collectAttachments(msg.bodyStructure, attachments);
      if (attachments.length === 0) continue;

      results.push({
        uid: msg.uid,
        subject: msg.envelope?.subject || "(sans objet)",
        date: msg.envelope?.date ? new Date(msg.envelope.date).toISOString() : null,
        from: envelopeFrom(msg.envelope),
        attachments,
      });
    }
  } finally {
    lock.release();
    await client.logout().catch(() => {});
  }

  // Trier du plus récent au plus ancien et limiter
  results.sort((a, b) => {
    const ta = a.date ? Date.parse(a.date) : 0;
    const tb = b.date ? Date.parse(b.date) : 0;
    return tb - ta;
  });
  return results.slice(0, limit);
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * Télécharge une pièce jointe précise (identifiée par uid + part) et renvoie
 * son contenu + nom de fichier. Vérifie que l'e-mail provient bien de
 * l'expéditeur autorisé et que la PJ est un .xlsx.
 */
export async function fetchAttachment(
  uid: number,
  part: string
): Promise<{ buffer: Buffer; filename: string }> {
  const { senders } = getGmailConfig();
  const client = createClient();

  await client.connect();
  const lock = await client.getMailboxLock("INBOX");
  try {
    // Vérifier l'expéditeur + retrouver le nom de fichier de la part demandée
    let filename = `gmail-${uid}.xlsx`;
    let allowed = false;
    let found = false;

    for await (const msg of client.fetch(
      [uid],
      { uid: true, envelope: true, bodyStructure: true },
      { uid: true }
    )) {
      const fromAddr = (msg.envelope?.from?.[0]?.address || "").toLowerCase();
      if (isSenderAllowed(fromAddr, senders)) allowed = true;

      const attachments: GmailAttachment[] = [];
      collectAttachments(msg.bodyStructure, attachments);
      const match = attachments.find((a) => a.part === String(part));
      if (match) {
        filename = match.filename;
        found = true;
      }
    }

    if (!allowed) {
      throw new Error("E-mail non autorisé (expéditeur non reconnu).");
    }
    if (!found) {
      throw new Error("Pièce jointe introuvable dans l'e-mail.");
    }
    if (!isXlsx(filename)) {
      throw new Error("La pièce jointe n'est pas un fichier .xlsx.");
    }

    const download = await client.download(String(uid), String(part), { uid: true });
    if (!download?.content) {
      throw new Error("Impossible de télécharger la pièce jointe.");
    }
    const buffer = await streamToBuffer(download.content);
    return { buffer, filename };
  } finally {
    lock.release();
    await client.logout().catch(() => {});
  }
}

/** Message d'erreur lisible pour l'utilisateur à partir d'une erreur IMAP */
export function humanizeGmailError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();
  if (
    lower.includes("invalid credentials") ||
    lower.includes("authentication failed") ||
    lower.includes("auth") ||
    lower.includes("login")
  ) {
    return "Échec de l'authentification Gmail. Vérifiez l'adresse et le mot de passe d'application (validation en 2 étapes requise).";
  }
  if (lower.includes("timeout") || lower.includes("econn") || lower.includes("network")) {
    return "Connexion à Gmail impossible pour le moment. Réessayez dans un instant.";
  }
  return msg;
}
