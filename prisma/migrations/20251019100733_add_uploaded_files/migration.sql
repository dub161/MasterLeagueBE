-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "semaine" TEXT,
    "jour" TEXT,
    "periode" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "division" TEXT NOT NULL,
    "heure" TEXT,
    "equipedomicile" TEXT NOT NULL,
    "equipeexterieur" TEXT NOT NULL,
    "scoredomicile" INTEGER,
    "scoreexterieur" INTEGER,
    "lieu" TEXT,
    "adresse" TEXT,
    "ville" TEXT,
    "saison" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadedFile" (
    "id" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "cloudStoragePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isLoaded" BOOLEAN NOT NULL DEFAULT false,
    "loadedAt" TIMESTAMP(3),
    "matchCount" INTEGER,

    CONSTRAINT "UploadedFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Match_equipedomicile_idx" ON "Match"("equipedomicile");

-- CreateIndex
CREATE INDEX "Match_equipeexterieur_idx" ON "Match"("equipeexterieur");

-- CreateIndex
CREATE INDEX "Match_division_idx" ON "Match"("division");

-- CreateIndex
CREATE INDEX "Match_saison_idx" ON "Match"("saison");

-- CreateIndex
CREATE INDEX "Match_date_idx" ON "Match"("date");

-- CreateIndex
CREATE INDEX "UploadedFile_uploadedAt_idx" ON "UploadedFile"("uploadedAt");
