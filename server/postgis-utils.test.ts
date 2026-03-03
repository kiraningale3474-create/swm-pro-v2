import { describe, expect, it } from "vitest";
import {
  createPointWKT,
  createLineStringWKT,
  parsePointWKT,
} from "../lib/postgis-utils";

describe("PostGIS Utilities", () => {
  describe("WKT Geometry Helpers", () => {
    it("should create a valid point WKT", () => {
      const point = createPointWKT(40.7128, -74.006);
      expect(point).toBe("POINT(-74.006 40.7128)");
    });

    it("should create a valid LineString WKT", () => {
      const coordinates: [number, number][] = [
        [40.7128, -74.006],
        [40.758, -73.9855],
        [40.7614, -73.9776],
      ];
      const lineString = createLineStringWKT(coordinates);
      expect(lineString).toContain("LINESTRING");
      expect(lineString).toContain("-74.006 40.7128");
      expect(lineString).toContain("-73.9855 40.758");
    });

    it("should parse a point WKT correctly", () => {
      const pointWKT = "POINT(-74.006 40.7128)";
      const { lat, lng } = parsePointWKT(pointWKT);
      expect(lat).toBe(40.7128);
      expect(lng).toBe(-74.006);
    });

    it("should throw error for invalid point WKT", () => {
      expect(() => parsePointWKT("INVALID(1 2)")).toThrow();
    });
  });

  describe("Spatial Calculations", () => {
    it("should validate point WKT format", () => {
      const point = createPointWKT(51.5074, -0.1278);
      expect(point).toMatch(/^POINT\(-?[\d.]+\s-?[\d.]+\)$/);
    });

    it("should validate LineString WKT format", () => {
      const coordinates: [number, number][] = [
        [51.5074, -0.1278],
        [51.5174, -0.1378],
      ];
      const lineString = createLineStringWKT(coordinates);
      expect(lineString).toMatch(/^LINESTRING\(/);
      expect(lineString).toContain(",");
    });
  });
});
