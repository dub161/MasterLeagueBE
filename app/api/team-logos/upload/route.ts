
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { uploadFile, deleteFile } from '@/lib/s3';

// Configurer la route pour accepter les fichiers
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST - Upload un logo pour une équipe
export async function POST(request: NextRequest) {
  try {
    console.log('📥 Upload request received');
    
    const formData = await request.formData();
    console.log('✅ FormData parsed successfully');
    
    const file = formData.get('file') as File;
    const teamName = formData.get('teamName') as string;
    
    console.log(`📋 Team: ${teamName}, File: ${file?.name}, Size: ${file?.size} bytes`);

    if (!file || !teamName) {
      console.error('❌ Missing file or team name');
      return NextResponse.json(
        { error: 'File and team name are required' },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      console.error(`❌ Invalid file type: ${file.type}`);
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error(`❌ File too large: ${file.size} bytes`);
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Convertir en Buffer
    console.log('🔄 Converting file to buffer...');
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log('✅ Buffer created successfully');

    // Upload vers S3
    console.log('☁️ Uploading to S3...');
    const cloudStoragePath = await uploadFile(buffer, file.name);
    console.log(`✅ Uploaded to S3: ${cloudStoragePath}`);

    // Vérifier si un logo existe déjà pour cette équipe
    console.log('🔍 Checking for existing logo...');
    const existingLogo = await prisma.teamLogo.findUnique({
      where: { teamName },
    });

    if (existingLogo) {
      console.log('🔄 Updating existing logo...');
      // Supprimer l'ancien logo de S3
      try {
        await deleteFile(existingLogo.cloudStoragePath);
        console.log('✅ Old logo deleted from S3');
      } catch (error) {
        console.error('⚠️ Error deleting old logo from S3:', error);
      }

      // Mettre à jour le logo
      const updatedLogo = await prisma.teamLogo.update({
        where: { teamName },
        data: {
          cloudStoragePath,
          originalFileName: file.name,
        },
      });

      console.log('✅ Logo updated successfully in database');
      return NextResponse.json({ 
        message: 'Logo updated successfully',
        logo: updatedLogo 
      });
    } else {
      console.log('➕ Creating new logo entry...');
      // Créer un nouveau logo
      const newLogo = await prisma.teamLogo.create({
        data: {
          teamName,
          cloudStoragePath,
          originalFileName: file.name,
        },
      });

      console.log('✅ Logo uploaded successfully and saved to database');
      return NextResponse.json({ 
        message: 'Logo uploaded successfully',
        logo: newLogo 
      });
    }
  } catch (error) {
    console.error('❌ Error uploading logo:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Failed to upload logo',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
