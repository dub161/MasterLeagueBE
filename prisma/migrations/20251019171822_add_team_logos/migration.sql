-- CreateTable
CREATE TABLE "TeamLogo" (
    "id" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "cloudStoragePath" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamLogo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamLogo_teamName_key" ON "TeamLogo"("teamName");

-- CreateIndex
CREATE INDEX "TeamLogo_teamName_idx" ON "TeamLogo"("teamName");
