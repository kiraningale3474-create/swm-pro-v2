import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { subdivideIntoWards } from "../../lib/postgis-utils";

const prisma = new PrismaClient();

export const wardsRouter = router({
  /**
   * Create wards by subdividing a polygon
   */
  createWardsFromPolygon: publicProcedure
    .input(
      z.object({
        polygonWKT: z.string(),
        baseWardNo: z.number().int().positive().default(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const wardPolygons = await subdivideIntoWards(input.polygonWKT);

        const createdWards = [];
        for (let i = 0; i < wardPolygons.length; i++) {
          const ward = await prisma.ward.create({
            data: {
              ward_no: input.baseWardNo + i,
              boundary: wardPolygons[i],
              qr_data: `WARD_${input.baseWardNo + i}_${Date.now()}`,
            },
          });
          createdWards.push(ward);
        }

        return {
          success: true,
          message: `Created ${createdWards.length} wards`,
          wards: createdWards,
        };
      } catch (error) {
        console.error("Error creating wards:", error);
        return {
          success: false,
          message: "Failed to create wards",
        };
      }
    }),

  /**
   * Get all wards
   */
  getWards: publicProcedure.query(async () => {
    try {
      const wards = await prisma.ward.findMany({
        orderBy: { ward_no: "asc" },
      });
      return {
        success: true,
        wards,
      };
    } catch (error) {
      console.error("Error fetching wards:", error);
      return {
        success: false,
        wards: [],
      };
    }
  }),

  /**
   * Get ward by ID
   */
  getWard: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      try {
        const ward = await prisma.ward.findUnique({
          where: { id: input.id },
        });
        return {
          success: !!ward,
          ward,
        };
      } catch (error) {
        console.error("Error fetching ward:", error);
        return {
          success: false,
          ward: null,
        };
      }
    }),

  /**
   * Delete ward
   */
  deleteWard: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      try {
        await prisma.ward.delete({
          where: { id: input.id },
        });
        return {
          success: true,
          message: "Ward deleted successfully",
        };
      } catch (error) {
        console.error("Error deleting ward:", error);
        return {
          success: false,
          message: "Failed to delete ward",
        };
      }
    }),
});
