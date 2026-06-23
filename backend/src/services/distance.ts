import { prisma } from "../prisma";
import { haversineDistanceMeters } from "../lib/geo";

export async function getTripDistanceMeters(tripId: string): Promise<number> {
  const points = await prisma.telemetryPoint.findMany({
    where: { tripId },
    select: { lat: true, lon: true, timestamp: true },
    orderBy: { timestamp: "asc" },
  });

  if (points.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const next = points[i];
    total += haversineDistanceMeters(prev.lat, prev.lon, next.lat, next.lon);
  }
  return total;
}

