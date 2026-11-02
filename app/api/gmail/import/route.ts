export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadFile } from "@/lib/s3";
import {
  isGmailConfigured,
  fetchAttachment,
  humanizeGmailError,
} from "@/lib/gmail";

export async function POST(request: NextRequest) {
  if (!isGmailConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "La connexion Gmail n'est pas encore configurée.",
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const uid = Number(body?.uid);
    const part = body?.part ? String(body.part) : "";

    if (!uid || !part) {
      return NextResponse.json(
        { success: false, error: "Paramètres manquants (uid, part)." },
        { status: 400 }
      );
    }

    // Récupère la pièce jointe .xlsx depuis Gmail
    const { buffer, filename } = await fetchAttachment(uid, part);

    if (!filename.toLowerCase().endsWith(".xlsx")) {
      return NextResponse.json(
        { success: false, error: "Seuls les fichiers .xlsx sont acceptés." },
        { status: 400 }
      );
    }

    // Stocke le fichier EXACTEMENT comme un upload manuel
    const cloudStoragePath = await uploadFile(buffer, filename);

    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        originalName: filename,
        cloudStoragePath,
        fileSize: buffer.length,
        isLoaded: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Fichier "${filename}" récupéré depuis Gmail. Vous pouvez maintenant le vérifier puis le charger.`,
      file: {
        id: uploadedFile.id,
        name: uploadedFile.originalName,
        size: uploadedFile.fileSize,
        uploadedAt: uploadedFile.uploadedAt,
      },
    });
  } catch (error) {
    console.error("Erreur import Gmail:", error);
    return NextResponse.json(
      {
        success: false,
        error: humanizeGmailError(error),
      },
      { status: 500 }
    );
  }
}
