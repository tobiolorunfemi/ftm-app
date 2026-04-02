-- AlterTable
ALTER TABLE "Match" ADD COLUMN "venue" TEXT;
ALTER TABLE "Match" ADD COLUMN "venueLocation" TEXT;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN "assistantCoach" TEXT;
ALTER TABLE "Team" ADD COLUMN "headCoach" TEXT;
ALTER TABLE "Team" ADD COLUMN "logo" TEXT;

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL DEFAULT 'MID',
    "jerseyNumber" INTEGER,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "yellowCards" INTEGER NOT NULL DEFAULT 0,
    "redCards" INTEGER NOT NULL DEFAULT 0,
    "cleanSheets" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "teamId" TEXT NOT NULL,
    CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MatchEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "minute" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT,
    "teamId" TEXT,
    CONSTRAINT "MatchEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MatchEvent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MatchEvent_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrganizerContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "organisation" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "twitter" TEXT,
    "whatsapp" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "tournamentId" TEXT NOT NULL,
    CONSTRAINT "OrganizerContact_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizerContact_tournamentId_key" ON "OrganizerContact"("tournamentId");
