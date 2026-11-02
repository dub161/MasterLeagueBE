
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { downloadFile, deleteFile } from '@/lib/s3';

// GET - Récupérer le logo d'une équipe (signed URL)
export async function GET(
  request: NextRequest,
  { params }: { params: { teamName: string } }
) {
  try {
    const teamName = decodeURIComponent(params.teamName);

    const logo = await prisma.teamLogo.findUnique({
      where: { teamName },
    });

    if (!logo) {
      return NextResponse.json(
        { error: 'Logo not found' },
        { status: 404 }
      );
    }

    // Générer une URL signée
    const signedUrl = await downloadFile(logo.cloudStoragePath);

    return NextResponse.json({ 
      logo: {
        ...logo,
        signedUrl,
      }
    });
  } catch (error) {
    console.error('Error fetching team logo:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team logo' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer le logo d'une équipe
export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamName: string } }
) {
  try {
    const teamName = decodeURIComponent(params.teamName);

    const logo = await prisma.teamLogo.findUnique({
      where: { teamName },
    });

    if (!logo) {
      return NextResponse.json(
        { error: 'Logo not found' },
        { status: 404 }
      );
    }

    // Supprimer de S3
    try {
      await deleteFile(logo.cloudStoragePath);
    } catch (error) {
      console.error('Error deleting logo from S3:', error);
    }

    // Supprimer de la base de données
    await prisma.teamLogo.delete({
      where: { teamName },
    });

    return NextResponse.json({ 
      message: 'Logo deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting team logo:', error);
    return NextResponse.json(
      { error: 'Failed to delete team logo' },
      { status: 500 }
    );
  }
}
