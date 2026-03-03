import { describe, expect, it } from "vitest";
import {
  isMockLocation,
  isValidCoordinates,
  calculateDistance,
  isInGeofence,
  isAccuracyAcceptable,
  detectGPSSpoofing,
  generateSessionToken,
  validateSessionToken,
} from "../lib/security-utils";

describe("Security Utilities", () => {
  describe("Mock Location Detection", () => {
    it("should detect mock location with high accuracy", () => {
      const isMocked = isMockLocation(0, "Mozilla/5.0");
      expect(isMocked).toBe(true);
    });

    it("should detect mock location with accuracy > 100m", () => {
      const isMocked = isMockLocation(150, "Mozilla/5.0");
      expect(isMocked).toBe(true);
    });

    it("should not flag normal GPS accuracy", () => {
      const isMocked = isMockLocation(25, "Mozilla/5.0");
      expect(isMocked).toBe(false);
    });
  });

  describe("Coordinate Validation", () => {
    it("should validate correct coordinates", () => {
      expect(isValidCoordinates(40.7128, -74.006)).toBe(true);
      expect(isValidCoordinates(0, 0)).toBe(true);
      expect(isValidCoordinates(90, 180)).toBe(true);
    });

    it("should reject invalid coordinates", () => {
      expect(isValidCoordinates(91, 0)).toBe(false);
      expect(isValidCoordinates(0, 181)).toBe(false);
      expect(isValidCoordinates(-91, 0)).toBe(false);
    });
  });

  describe("Distance Calculation", () => {
    it("should calculate distance between two points", () => {
      // NYC to LA is approximately 3944 km
      const distance = calculateDistance(40.7128, -74.006, 34.0522, -118.2437);
      expect(distance).toBeGreaterThan(3900000); // 3900 km in meters
      expect(distance).toBeLessThan(4000000); // 4000 km in meters
    });

    it("should return 0 for same coordinates", () => {
      const distance = calculateDistance(40.7128, -74.006, 40.7128, -74.006);
      expect(distance).toBeLessThan(1); // Should be very close to 0
    });
  });

  describe("Geofence Check", () => {
    it("should detect point inside geofence", () => {
      // NYC center with 1000m radius
      const inside = isInGeofence(40.7128, -74.006, 40.7128, -74.006, 1000);
      expect(inside).toBe(true);
    });

    it("should detect point outside geofence", () => {
      // NYC to LA is ~3944 km, geofence is 1000m
      const outside = isInGeofence(40.7128, -74.006, 34.0522, -118.2437, 1000);
      expect(outside).toBe(false);
    });
  });

  describe("Accuracy Validation", () => {
    it("should accept accurate GPS", () => {
      expect(isAccuracyAcceptable(25)).toBe(true);
      expect(isAccuracyAcceptable(50)).toBe(true);
    });

    it("should reject poor accuracy", () => {
      expect(isAccuracyAcceptable(150)).toBe(false);
      expect(isAccuracyAcceptable(0)).toBe(false);
    });

    it("should respect custom max accuracy", () => {
      expect(isAccuracyAcceptable(75, 100)).toBe(true);
      expect(isAccuracyAcceptable(150, 100)).toBe(false);
    });
  });

  describe("GPS Spoofing Detection", () => {
    it("should detect mock location spoofing", () => {
      const spoofed = detectGPSSpoofing(0, 10, "Mozilla/5.0");
      expect(spoofed).toBe(true);
    });

    it("should detect unrealistic speed", () => {
      const spoofed = detectGPSSpoofing(25, 150, "Mozilla/5.0");
      expect(spoofed).toBe(true);
    });

    it("should not flag normal GPS", () => {
      const spoofed = detectGPSSpoofing(25, 10, "Mozilla/5.0");
      expect(spoofed).toBe(false);
    });
  });

  describe("Session Token", () => {
    it("should generate valid session token", () => {
      const token = generateSessionToken(123, Date.now());
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("should validate correct session token", () => {
      const timestamp = Date.now();
      const token = generateSessionToken(123, timestamp);
      const valid = validateSessionToken(token, 123);
      expect(valid).toBe(true);
    });

    it("should reject invalid worker ID", () => {
      const token = generateSessionToken(123, Date.now());
      const valid = validateSessionToken(token, 456);
      expect(valid).toBe(false);
    });
  });
});
