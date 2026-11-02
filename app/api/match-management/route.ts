export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDisplayName } from "@/lib/team-normalizer";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const saison = searchParams.get("saison");
    const division = searchParams.get("division");
    const team = searchParams.get("team");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    if (saison) {
      where.saison = saison;
    }

    if (division) {
      where.division = division;
    }

    if (team) {
      where.OR = [
        { equipedomicile: { contains: team, mode: "insensitive" } },
        { equipeexterieur: { contains: team, mode: "insensitive" } },
      ];
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo);
      }
    }

    const totalCount = await prisma.match.count({ where });
    const totalPages = Math.ceil(totalCount / limit);

    const matches = await prisma.match.findMany({
      where,
      orderBy: [{ date: "desc" }, { heure: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get display names for teams
    const matchesWithDisplayNames = await Promise.all(
      matches.map(async (match) => {
        const homeDisplayName = await getDisplayName(match.equipedomicile, match.saison);
        const awayDisplayName = await getDisplayName(match.equipeexterieur, match.saison);
        return {
          ...match,
          homeDisplayName,
          awayDisplayName,
        };
      })
    );

    // Get available divisions for filters
    const divisions = await prisma.match.findMany({
      where: saison ? { saison } : {},
      select: { division: true },
      distinct: ["division"],
      orderBy: { division: "asc" },
    });

    return NextResponse.json({
      success: true,
      matches: matchesWithDisplayNames,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
      divisions: divisions.map((d) => d.division),
    });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des matchs" },
      { status: 500 }
    );
  }
}
