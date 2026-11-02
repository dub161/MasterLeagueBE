-- CreateTable
CREATE TABLE "TeamAlias" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "originalNames" TEXT[],
    "saison" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamAlias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamAlias_saison_idx" ON "TeamAlias"("saison");

-- CreateIndex
CREATE UNIQUE INDEX "TeamAlias_displayName_saison_key" ON "TeamAlias"("displayName", "saison");
