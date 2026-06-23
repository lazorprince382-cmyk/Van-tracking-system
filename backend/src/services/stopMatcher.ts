import { prisma } from "../prisma";
import { haversineDistanceMeters } from "../lib/geo";

export async function findNearestStopPlace(params: {
  organizationId: string;
  lat: number;
  lon: number;
  radiusMeters: number;
}) {
  const { organizationId, lat, lon, radiusMeters } = params;

  // Fast first-pass filter by bounding box before precise haversine.
  const latDelta = radiusMeters / 111_320;
  const lonDelta = radiusMeters / (111_320 * Math.cos((lat * Math.PI) / 180));

  const candidates = await prisma.stopPlace.findMany({
    where: {
      organizationId,
      lat: { gte: lat - latDelta, lte: lat + latDelta },
      lon: { gte: lon - lonDelta, lte: lon + lonDelta },
    },
    select: { id: true, name: true, lat: true, lon: true },
  });

  let best: { id: string; name: string; distanceMeters: number } | null = null;
  for (const c of candidates) {
    const dist = haversineDistanceMeters(lat, lon, c.lat, c.lon);
    if (dist <= radiusMeters && (!best || dist < best.distanceMeters)) {
      best = { id: c.id, name: c.name, distanceMeters: dist };
    }
  }

  return best;
}

