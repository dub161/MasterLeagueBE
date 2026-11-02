
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Récupérer tous les logos d'équipes
export async function GET(request: NextRequest) {
  try {
    const logos = await prisma.teamLogo.findMany({
      orderBy: { teamName: 'asc' },
    });

    return NextResponse.json({ logos });
  } catch (error) {
    console.error('Error fetching team logos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team logos' },
      { status: 500 }
    );
  }
}
