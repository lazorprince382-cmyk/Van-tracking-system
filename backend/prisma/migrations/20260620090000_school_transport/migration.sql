CREATE TYPE "ServicePeriod" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

ALTER TABLE "Van" ADD COLUMN "plateNumber" TEXT,
ADD COLUMN "driverName" TEXT,
ADD COLUMN "driverPhone" TEXT,
ADD COLUMN "capacity" INTEGER NOT NULL DEFAULT 14,
ADD COLUMN "routeName" TEXT,
ADD COLUMN "morningDeparture" TEXT,
ADD COLUMN "afternoonDeparture" TEXT,
ADD COLUMN "eveningDeparture" TEXT;

ALTER TABLE "Child" ADD COLUMN "className" TEXT,
ADD COLUMN "parentPhone" TEXT,
ADD COLUMN "residenceRoute" TEXT,
ADD COLUMN "photoData" TEXT;

CREATE TABLE "TransportAssignment" (
  "id" TEXT NOT NULL,
  "childId" TEXT NOT NULL,
  "vanId" TEXT NOT NULL,
  "period" "ServicePeriod" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TransportAssignment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TransportAssignment_childId_period_key" ON "TransportAssignment"("childId", "period");
CREATE INDEX "TransportAssignment_vanId_period_idx" ON "TransportAssignment"("vanId", "period");
ALTER TABLE "TransportAssignment" ADD CONSTRAINT "TransportAssignment_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TransportAssignment" ADD CONSTRAINT "TransportAssignment_vanId_fkey" FOREIGN KEY ("vanId") REFERENCES "Van"("id") ON DELETE CASCADE ON UPDATE CASCADE;
