import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { isPointInGeofence, getWorkersInGeofenceWithDwell } from "../../lib/postgis-utils";

const prisma = new PrismaClient();

// Depot geofence center (example: New York City)
const DEPOT_CENTER_WKT = "POINT(-74.0060 40.7128)";
const GEOFENCE_RADIUS_METERS = 50;
const DWELL_THRESHOLD_SECONDS = 5 * 60; // 5 minutes

export const geofenceRouter = router({
  /**
   * Log worker location for geofence tracking
   */
  logLocation: publicProcedure
    .input(
      z.object({
        worker_id: z.number().int(),
        latitude: z.number(),
        longitude: z.number(),
        dwellTime: z.number().int().default(0),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const pointWKT = `POINT(${input.longitude} ${input.latitude})`;

        // Log the location
        const log = await prisma.geofenceLog.create({
          data: {
            worker_id: input.worker_id,
            location: pointWKT,
            dwellTime: input.dwellTime,
          },
        });

        // Check if worker is in geofence
        const inGeofence = await isPointInGeofence(
          pointWKT,
          DEPOT_CENTER_WKT,
          GEOFENCE_RADIUS_METERS
        );

        return {
          success: true,
          message: "Location logged",
          inGeofence,
          log,
        };
      } catch (error) {
        console.error("Error logging location:", error);
        return {
          success: false,
          message: "Failed to log location",
          inGeofence: false,
        };
      }
    }),

  /**
   * Check if worker is in geofence
   */
  checkGeofence: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const pointWKT = `POINT(${input.longitude} ${input.latitude})`;

        const inGeofence = await isPointInGeofence(
          pointWKT,
          DEPOT_CENTER_WKT,
          GEOFENCE_RADIUS_METERS
        );

        return {
          success: true,
          inGeofence,
        };
      } catch (error) {
        console.error("Error checking geofence:", error);
        return {
          success: false,
          inGeofence: false,
        };
      }
    }),

  /**
   * Get workers with sufficient dwell time in geofence
   */
  getWorkersInGeofence: publicProcedure.query(async () => {
    try {
      const workerIds = await getWorkersInGeofenceWithDwell(
        DEPOT_CENTER_WKT,
        GEOFENCE_RADIUS_METERS,
        DWELL_THRESHOLD_SECONDS
      );

      const workers = await prisma.user.findMany({
        where: { id: { in: workerIds } },
      });

      return {
        success: true,
        workers,
        count: workers.length,
      };
    } catch (error) {
      console.error("Error getting workers in geofence:", error);
      return {
        success: false,
        workers: [],
        count: 0,
      };
    }
  }),

  /**
   * Get geofence logs for a worker
   */
  getWorkerGeofenceLogs: publicProcedure
    .input(z.object({ worker_id: z.number().int() }))
    .query(async ({ input }) => {
      try {
        const logs = await prisma.geofenceLog.findMany({
          where: { worker_id: input.worker_id },
          orderBy: { timestamp: "desc" },
          take: 100,
        });

        return {
          success: true,
          logs,
        };
      } catch (error) {
        console.error("Error fetching geofence logs:", error);
        return {
          success: false,
          logs: [],
        };
      }
    }),

  /**
   * Update depot center coordinates
   */
  updateDepotCenter: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      // In production, store this in database or config
      // For now, this is a placeholder
      return {
        success: true,
        message: "Depot center updated",
        newCenter: {
          latitude: input.latitude,
          longitude: input.longitude,
        },
      };
    }),
});
