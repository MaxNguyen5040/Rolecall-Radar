-- CreateEnum
CREATE TYPE "Ats" AS ENUM ('GREENHOUSE', 'LEVER', 'ASHBY');

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "ats" "Ats" NOT NULL,
    "boardToken" TEXT NOT NULL,
    "region" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Posting" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "url" TEXT NOT NULL,
    "isRemote" BOOLEAN,
    "sourcePostedAt" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matched" BOOLEAN NOT NULL DEFAULT false,
    "alertedAt" TIMESTAMP(3),

    CONSTRAINT "Posting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollRun" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "ok" BOOLEAN NOT NULL DEFAULT false,
    "newCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "PollRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_ats_boardToken_key" ON "Company"("ats", "boardToken");

-- CreateIndex
CREATE INDEX "Posting_firstSeenAt_idx" ON "Posting"("firstSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "Posting_companyId_externalId_key" ON "Posting"("companyId", "externalId");

-- AddForeignKey
ALTER TABLE "Posting" ADD CONSTRAINT "Posting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollRun" ADD CONSTRAINT "PollRun_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
