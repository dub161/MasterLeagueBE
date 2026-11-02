
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const fileId = params.fileId;
    
    // Récupérer les métadonnées du fichier
    const uploadedFile = await prisma.uploadedFile.findUnique({
      where: { id: fileId }
    });
    
    if (!uploadedFile) {
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
    }
    
    // Supprimer le fichier de S3
    await deleteFile(uploadedFile.cloudStoragePath);
    
    // Supprimer les métadonnées de la base de données
    await prisma.uploadedFile.delete({
      where: { id: fileId }
    });
    
    return NextResponse.json({
      success: true,
      message: `Fichier "${uploadedFile.originalName}" supprimé avec succès`
    });
    
  } catch (error) {
    console.error('Erreur suppression fichier:', error);
    return NextResponse.json({
      error: 'Erreur lors de la suppression du fichier',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
