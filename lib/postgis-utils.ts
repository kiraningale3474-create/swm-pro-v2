import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Subdivide a polygon into 10 equal spatial wards using PostGIS ST_Subdivide
 * @param polygonWKT - Well-Known Text representation of the polygon
 * @returns Array of 10 ward polygons in WKT format
 */
export async function subdivideIntoWards(polygonWKT: string): Promise<string[]> {
  try {
    const result = await prisma.$queryRaw<
      Array<{ geom: string }>
    >`
      SELECT ST_AsText(geom) as geom
      FROM ST_Subdivide(ST_GeomFromText(${polygonWKT}, 4326), 8) as geom
      LIMIT 10
    `;

    return result.map((row) => row.geom);
  } catch (error) {
    console.error("Error subdividing polygon:", error);
    throw error;
  }
}

/**
 * Calculate spatial overlap percentage between two geometries
 * @param geom1WKT - First geometry in WKT format
 * @param geom2WKT - Second geometry in WKT format
 * @returns Overlap percentage (0-100)
 */
export async function calculateOverlapPercentage(
  geom1WKT: string,
  geom2WKT: string
): Promise<number> {
  try {
    const result = await prisma.$queryRaw<
      Array<{ overlap_percent: number }>
    >`
      SELECT 
        (ST_Area(ST_Intersection(
          ST_GeomFromText(${geom1WKT}, 4326),
          ST_GeomFromText(${geom2WKT}, 4326)
        )) / ST_Area(ST_GeomFromText(${geom1WKT}, 4326))) * 100 as overlap_percent
    `;

    return result[0]?.overlap_percent ?? 0;
  } catch (error) {
    console.error("Error calculating overlap:", error);
    throw error;
  }
}

/**
 * Check if a point is within a buffer zone around a line
 * @param pointWKT - Point geometry in WKT format
 * @param lineWKT - Line geometry in WKT format
 * @param bufferMeters - Buffer distance in meters
 * @returns True if point is within buffer
 */
export async function isPointInBuffer(
  pointWKT: string,
  lineWKT: string,
  bufferMeters: number
): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw<
      Array<{ is_within: boolean }>
    >`
      SELECT ST_DWithin(
        ST_GeomFromText(${pointWKT}, 4326)::geography,
        ST_GeomFromText(${lineWKT}, 4326)::geography,
        ${bufferMeters}
      ) as is_within
    `;

    return result[0]?.is_within ?? false;
  } catch (error) {
    console.error("Error checking point in buffer:", error);
    throw error;
  }
}

/**
 * Check if a point is within a geofence (circular area)
 * @param pointWKT - Point geometry in WKT format
 * @param centerWKT - Center point of geofence in WKT format
 * @param radiusMeters - Radius of geofence in meters
 * @returns True if point is within geofence
 */
export async function isPointInGeofence(
  pointWKT: string,
  centerWKT: string,
  radiusMeters: number
): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw<
      Array<{ is_within: boolean }>
    >`
      SELECT ST_DWithin(
        ST_GeomFromText(${pointWKT}, 4326)::geography,
        ST_GeomFromText(${centerWKT}, 4326)::geography,
        ${radiusMeters}
      ) as is_within
    `;

    return result[0]?.is_within ?? false;
  } catch (error) {
    console.error("Error checking point in geofence:", error);
    throw error;
  }
}

/**
 * Calculate distance between two points in meters
 * @param point1WKT - First point in WKT format
 * @param point2WKT - Second point in WKT format
 * @returns Distance in meters
 */
export async function calculateDistance(
  point1WKT: string,
  point2WKT: string
): Promise<number> {
  try {
    const result = await prisma.$queryRaw<
      Array<{ distance: number }>
    >`
      SELECT ST_Distance(
        ST_GeomFromText(${point1WKT}, 4326)::geography,
        ST_GeomFromText(${point2WKT}, 4326)::geography
      ) as distance
    `;

    return result[0]?.distance ?? 0;
  } catch (error) {
    console.error("Error calculating distance:", error);
    throw error;
  }
}

/**
 * Create a buffer zone around a line
 * @param lineWKT - Line geometry in WKT format
 * @param bufferMeters - Buffer distance in meters
 * @returns Buffered geometry in WKT format
 */
export async function createBuffer(
  lineWKT: string,
  bufferMeters: number
): Promise<string> {
  try {
    const result = await prisma.$queryRaw<
      Array<{ buffer_geom: string }>
    >`
      SELECT ST_AsText(ST_Buffer(
        ST_GeomFromText(${lineWKT}, 4326)::geography,
        ${bufferMeters}
      )::geometry) as buffer_geom
    `;

    return result[0]?.buffer_geom ?? "";
  } catch (error) {
    console.error("Error creating buffer:", error);
    throw error;
  }
}

/**
 * Check if a LineString trail overlaps with a buffer zone by >90%
 * @param trailWKT - LineString trail in WKT format
 * @param bufferWKT - Buffer polygon in WKT format
 * @returns True if overlap > 90%
 */
export async function checkDrainageOverlap(
  trailWKT: string,
  bufferWKT: string
): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw<
      Array<{ overlap_percent: number }>
    >`
      SELECT 
        (ST_Length(ST_Intersection(
          ST_GeomFromText(${trailWKT}, 4326),
          ST_GeomFromText(${bufferWKT}, 4326)
        )) / ST_Length(ST_GeomFromText(${trailWKT}, 4326))) * 100 as overlap_percent
    `;

    const overlapPercent = result[0]?.overlap_percent ?? 0;
    return overlapPercent >= 90;
  } catch (error) {
    console.error("Error checking drainage overlap:", error);
    throw error;
  }
}

/**
 * Get all points within a geofence that have dwell time > threshold
 * @param centerWKT - Center point of geofence in WKT format
 * @param radiusMeters - Radius of geofence in meters
 * @param dwellThresholdSeconds - Minimum dwell time in seconds
 * @returns Array of worker IDs with sufficient dwell time
 */
export async function getWorkersInGeofenceWithDwell(
  centerWKT: string,
  radiusMeters: number,
  dwellThresholdSeconds: number
): Promise<number[]> {
  try {
    const result = await prisma.$queryRaw<
      Array<{ worker_id: number }>
    >`
      SELECT DISTINCT worker_id
      FROM geofence_logs
      WHERE ST_DWithin(
        location::geography,
        ST_GeomFromText(${centerWKT}, 4326)::geography,
        ${radiusMeters}
      )
      AND dwell_time >= ${dwellThresholdSeconds}
    `;

    return result.map((row) => row.worker_id);
  } catch (error) {
    console.error("Error getting workers in geofence:", error);
    throw error;
  }
}

/**
 * Create a point geometry from latitude and longitude
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Point geometry in WKT format
 */
export function createPointWKT(lat: number, lng: number): string {
  return `POINT(${lng} ${lat})`;
}

/**
 * Create a LineString from an array of [lat, lng] coordinates
 * @param coordinates - Array of [lat, lng] pairs
 * @returns LineString geometry in WKT format
 */
export function createLineStringWKT(coordinates: [number, number][]): string {
  const points = coordinates.map(([lat, lng]) => `${lng} ${lat}`).join(", ");
  return `LINESTRING(${points})`;
}

/**
 * Parse WKT point to get coordinates
 * @param pointWKT - Point in WKT format
 * @returns Object with lat and lng
 */
export function parsePointWKT(pointWKT: string): { lat: number; lng: number } {
  const match = pointWKT.match(/POINT\(([^ ]+) ([^ ]+)\)/);
  if (!match) throw new Error("Invalid point WKT format");
  return {
    lng: parseFloat(match[1]),
    lat: parseFloat(match[2]),
  };
}
