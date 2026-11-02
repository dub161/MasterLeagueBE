
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { downloadFileAsBuffer } from '@/lib/s3';
import { parseExcelFile } from '@/lib/excel-parser';
import { checkCoherence } from '@/lib/coherence-check';

// Test de cohérence préalable (dry-run) : analyse le fichier SANS écrire en base.
export async function POST(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const fileId = params.fileId;

    const uploadedFile = await prisma.uploadedFile.findUnique({
      where: { id: fileId }
    });

    if (!uploadedFile) {
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
    }

    const buffer = await downloadFileAsBuffer(uploadedFile.cloudStoragePath);
    const parseResult = parseExcelFile(buffer, uploadedFile.originalName);
    const coherence = checkCoherence(parseResult);

    return NextResponse.json({
      success: true,
      coherence,
      parseErrors: parseResult.errors,
    });

  } catch (error) {
    console.error('Erreur test de cohérence:', error);
    return NextResponse.json({
      error: 'Erreur lors du test de cohérence du fichier',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
