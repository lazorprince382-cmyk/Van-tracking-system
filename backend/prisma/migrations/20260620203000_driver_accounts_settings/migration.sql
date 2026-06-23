ALTER TABLE "Organization" ADD COLUMN "phone" TEXT,
ADD COLUMN "address" TEXT,
ADD COLUMN "contactEmail" TEXT,
ADD COLUMN "schoolStartTime" TEXT DEFAULT '08:00',
ADD COLUMN "pickupGraceMinutes" INTEGER NOT NULL DEFAULT 15;

ALTER TABLE "User" ADD COLUMN "fullName" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "assignedVanId" TEXT;

CREATE INDEX "User_assignedVanId_idx" ON "User"("assignedVanId");
ALTER TABLE "User" ADD CONSTRAINT "User_assignedVanId_fkey" FOREIGN KEY ("assignedVanId") REFERENCES "Van"("id") ON DELETE SET NULL ON UPDATE CASCADE;
