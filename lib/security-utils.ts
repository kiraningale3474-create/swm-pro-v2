/**
 * Security utilities for GPS validation and mock location detection
 */

/**
 * Check if GPS location is mocked (client-side detection)
 * @param accuracy - GPS accuracy in meters
 * @param userAgent - Browser user agent string
 * @returns true if location appears to be mocked
 */
export function isMockLocation(accuracy: number, userAgent: string): boolean {
  // Real GPS typically has accuracy between 5-50 meters
  // Mock locations often have very high accuracy (0-1 meter) or very low accuracy (>100 meters)
  if (accuracy > 100) {
    return true;
  }

  // Check for common mock location indicators
  // Mock locations often have suspiciously perfect accuracy (0 meters)
  if (accuracy === 0) {
    return true;
  }

  return false;
}

/**
 * Validate GPS coordinates
 * @param latitude - Latitude value
 * @param longitude - Longitude value
 * @returns true if coordinates are valid
 */
export function isValidCoordinates(latitude: number, longitude: number): boolean {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 - First point latitude
 * @param lon1 - First point longitude
 * @param lat2 - Second point latitude
 * @param lon2 - Second point longitude
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if a point is within a geofence
 * @param userLat - User latitude
 * @param userLon - User longitude
 * @param centerLat - Geofence center latitude
 * @param centerLon - Geofence center longitude
 * @param radiusMeters - Geofence radius in meters
 * @returns true if point is within geofence
 */
export function isInGeofence(
  userLat: number,
  userLon: number,
  centerLat: number,
  centerLon: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(userLat, userLon, centerLat, centerLon);
  return distance <= radiusMeters;
}

/**
 * Validate GPS accuracy
 * @param accuracy - GPS accuracy in meters
 * @param maxAccuracy - Maximum acceptable accuracy
 * @returns true if accuracy is acceptable
 */
export function isAccuracyAcceptable(
  accuracy: number,
  maxAccuracy: number = 100
): boolean {
  return accuracy > 0 && accuracy <= maxAccuracy;
}

/**
 * Check for GPS spoofing indicators
 * @param accuracy - GPS accuracy
 * @param speed - Current speed in m/s
 * @param userAgent - Browser user agent
 * @returns true if spoofing is detected
 */
export function detectGPSSpoofing(
  accuracy: number,
  speed: number,
  userAgent: string
): boolean {
  // Check for mock location
  if (isMockLocation(accuracy, userAgent)) {
    return true;
  }

  // Check for unrealistic speed (>100 m/s = 360 km/h)
  if (speed > 100) {
    return true;
  }

  return false;
}

/**
 * Generate a secure session token for GPS tracking
 * @param workerId - Worker ID
 * @param timestamp - Current timestamp
 * @returns Session token
 */
export function generateSessionToken(workerId: number, timestamp: number): string {
  const data = `${workerId}:${timestamp}:${Math.random()}`;
  // In production, use proper cryptographic hashing
  return Buffer.from(data).toString("base64");
}

/**
 * Validate session token
 * @param token - Session token to validate
 * @param workerId - Expected worker ID
 * @returns true if token is valid
 */
export function validateSessionToken(token: string, workerId: number): boolean {
  try {
    const data = Buffer.from(token, "base64").toString();
    const [id] = data.split(":");
    return parseInt(id) === workerId;
  } catch {
    return false;
  }
}
