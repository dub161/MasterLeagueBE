
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const files = await prisma.uploadedFile.findMany({
      orderBy: {
        uploadedAt: 'desc'
      },
      select: {
        id: true,
        originalName: true,
        fileSize: true,
        uploadedAt: true,
        isLoaded: true,
        loadedAt: true,
        matchCount: true
      }
    });
    
    return NextResponse.json({
      success: true,
      files
    });
    
  } catch (error) {
    console.error('Erreur récupération fichiers:', error);
    return NextResponse.json({
      error: 'Erreur lors de la récupération des fichiers',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
