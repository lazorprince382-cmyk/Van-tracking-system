CREATE TABLE "VanCamera" (
  "id" TEXT NOT NULL,
  "vanId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "position" TEXT NOT NULL,
  "streamType" TEXT NOT NULL,
  "streamUrl" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VanCamera_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "VanCamera_vanId_idx" ON "VanCamera"("vanId");
ALTER TABLE "VanCamera" ADD CONSTRAINT "VanCamera_vanId_fkey" FOREIGN KEY ("vanId") REFERENCES "Van"("id") ON DELETE CASCADE ON UPDATE CASCADE;
