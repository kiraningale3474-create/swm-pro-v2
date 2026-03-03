import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import {
  checkDrainageOverlap,
  createBuffer,
  isPointInBuffer,
} from "../../lib/postgis-utils";

const prisma = new PrismaClient();

export const worklogsRouter = router({
  /**
   * Create a new worklog
   */
  createWorklog: publicProcedure
    .input(
      z.object({
        worker_id: z.number().int(),
        module: z.enum(["DOOR_TO_DOOR", "SWEEPING", "DRAINAGE", "DEPOT"]),
        trail: z.string().optional(),
        photo_url: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const worklog = await prisma.workLog.create({
          data: {
            worker_id: input.worker_id,
            module: input.module,
            trail: input.trail,
            photo_url: input.photo_url,
            status: "PENDING",
          },
        });

        return {
          success: true,
          message: "Worklog created",
          worklog,
        };
      } catch (error) {
        console.error("Error creating worklog:", error);
        return {
          success: false,
          message: "Failed to create worklog",
        };
      }
    }),

  /**
   * Update worklog status
   */
  updateWorklogStatus: publicProcedure
    .input(
      z.object({
        id: z.number().int(),
        status: z.enum(["PENDING", "COMPLETED", "AUTO_COMPLETED"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const worklog = await prisma.workLog.update({
          where: { id: input.id },
          data: { status: input.status },
        });

        return {
          success: true,
          message: "Status updated",
          worklog,
        };
      } catch (error) {
        console.error("Error updating worklog:", error);
        return {
          success: false,
          message: "Failed to update worklog",
        };
      }
    }),

  /**
   * Check drainage overlap and auto-complete if >90%
   */
  checkDrainageCompletion: publicProcedure
    .input(
      z.object({
        worklog_id: z.number().int(),
        drainage_line_wkt: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const worklog = await prisma.workLog.findUnique({
          where: { id: input.worklog_id },
        });

        if (!worklog || worklog.module !== "DRAINAGE" || !worklog.trail) {
          return {
            success: false,
            message: "Invalid worklog or no trail data",
          };
        }

        // Create 5m buffer around drainage line
        const buffer = await createBuffer(input.drainage_line_wkt, 5);

        // Check overlap
        const hasOverlap = await checkDrainageOverlap(worklog.trail, buffer);

        if (hasOverlap) {
          // Auto-complete
          const updated = await prisma.workLog.update({
            where: { id: input.worklog_id },
            data: { status: "AUTO_COMPLETED" },
          });

          return {
            success: true,
            message: "Drainage task auto-completed (>90% overlap)",
            worklog: updated,
            autoCompleted: true,
          };
        }

        return {
          success: true,
          message: "Overlap < 90%, manual completion required",
          autoCompleted: false,
        };
      } catch (error) {
        console.error("Error checking drainage:", error);
        return {
          success: false,
          message: "Failed to check drainage completion",
        };
      }
    }),

  /**
   * Get worklogs for a worker
   */
  getWorkerWorklogs: publicProcedure
    .input(z.object({ worker_id: z.number().int() }))
    .query(async ({ input }) => {
      try {
        const worklogs = await prisma.workLog.findMany({
          where: { worker_id: input.worker_id },
          orderBy: { timestamp: "desc" },
        });

        return {
          success: true,
          worklogs,
        };
      } catch (error) {
        console.error("Error fetching worklogs:", error);
        return {
          success: false,
          worklogs: [],
        };
      }
    }),

  /**
   * Get all worklogs (admin)
   */
  getAllWorklogs: publicProcedure.query(async () => {
    try {
      const worklogs = await prisma.workLog.findMany({
        include: { worker: true },
        orderBy: { timestamp: "desc" },
      });

      return {
        success: true,
        worklogs,
      };
    } catch (error) {
      console.error("Error fetching worklogs:", error);
      return {
        success: false,
        worklogs: [],
      };
    }
  }),

  /**
   * Increment trip count for DEPOT module
   */
  incrementTripCount: publicProcedure
    .input(z.object({ worklog_id: z.number().int() }))
    .mutation(async ({ input }) => {
      try {
        const worklog = await prisma.workLog.findUnique({
          where: { id: input.worklog_id },
        });

        if (!worklog || worklog.module !== "DEPOT") {
          return {
            success: false,
            message: "Invalid worklog or not a DEPOT module",
          };
        }

        const updated = await prisma.workLog.update({
          where: { id: input.worklog_id },
          data: { tripCount: worklog.tripCount + 1 },
        });

        return {
          success: true,
          message: "Trip count incremented",
          worklog: updated,
        };
      } catch (error) {
        console.error("Error incrementing trip count:", error);
        return {
          success: false,
          message: "Failed to increment trip count",
        };
      }
    }),
});
