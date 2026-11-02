
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { uploadFile } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }
    
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      return NextResponse.json({ error: 'Seuls les fichiers .xlsx sont acceptés' }, { status: 400 });
    }
    
    // Convertir en Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Uploader vers S3
    const cloudStoragePath = await uploadFile(buffer, file.name);
    
    // Sauvegarder les métadonnées en base de données
    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        originalName: file.name,
        cloudStoragePath: cloudStoragePath,
        fileSize: file.size,
        isLoaded: false
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `Fichier "${file.name}" uploadé avec succès. Vous pouvez maintenant le charger dans la base de données.`,
      file: {
        id: uploadedFile.id,
        name: uploadedFile.originalName,
        size: uploadedFile.fileSize,
        uploadedAt: uploadedFile.uploadedAt
      }
    });
    
  } catch (error) {
    console.error('Erreur upload Excel:', error);
    return NextResponse.json({
      error: 'Erreur lors de l\'upload du fichier',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
