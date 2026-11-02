export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Fetch single match
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: params.id },
    });

    if (!match) {
      return NextResponse.json(
        { success: false, error: "Match non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, match });
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération du match" },
      { status: 500 }
    );
  }
}

// PUT - Update match
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.equipedomicile || !body.equipeexterieur || !body.date || !body.division || !body.saison) {
      return NextResponse.json(
        { success: false, error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    const existingMatch = await prisma.match.findUnique({
      where: { id: params.id },
    });

    if (!existingMatch) {
      return NextResponse.json(
        { success: false, error: "Match non trouvé" },
        { status: 404 }
      );
    }

    const updatedMatch = await prisma.match.update({
      where: { id: params.id },
      data: {
        semaine: body.semaine || null,
        jour: body.jour || null,
        periode: body.periode || null,
        date: new Date(body.date),
        division: body.division,
        heure: body.heure || null,
        equipedomicile: body.equipedomicile,
        equipeexterieur: body.equipeexterieur,
        handicapeInitialDomicile: body.handicapeInitialDomicile || null,
        handicapeInitialExterieur: body.handicapeInitialExterieur || null,
        scoredomicile: body.scoredomicile !== null && body.scoredomicile !== "" ? parseInt(body.scoredomicile) : null,
        scoreexterieur: body.scoreexterieur !== null && body.scoreexterieur !== "" ? parseInt(body.scoreexterieur) : null,
        lieu: body.lieu || null,
        adresse: body.adresse || null,
        ville: body.ville || null,
        saison: body.saison,
      },
    });

    return NextResponse.json({ 
      success: true, 
      match: updatedMatch,
      message: "Match mis à jour avec succès" 
    });
  } catch (error) {
    console.error("Error updating match:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour du match" },
      { status: 500 }
    );
  }
}

// DELETE - Delete match
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingMatch = await prisma.match.findUnique({
      where: { id: params.id },
    });

    if (!existingMatch) {
      return NextResponse.json(
        { success: false, error: "Match non trouvé" },
        { status: 404 }
      );
    }

    await prisma.match.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Match supprimé avec succès" 
    });
  } catch (error) {
    console.error("Error deleting match:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la suppression du match" },
      { status: 500 }
    );
  }
}
