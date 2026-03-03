import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const configRouter = router({
  /**
   * Get config
   */
  getConfig: publicProcedure.query(async () => {
    try {
      let config = await prisma.config.findUnique({
        where: { id: 1 },
      });

      if (!config) {
        config = await prisma.config.create({
          data: {
            id: 1,
            photo_mandatory: false,
          },
        });
      }

      return {
        success: true,
        config,
      };
    } catch (error) {
      console.error("Error fetching config:", error);
      return {
        success: false,
        config: null,
      };
    }
  }),

  /**
   * Update config
   */
  updateConfig: publicProcedure
    .input(
      z.object({
        photo_mandatory: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const config = await prisma.config.upsert({
          where: { id: 1 },
          update: {
            ...(input.photo_mandatory !== undefined && {
              photo_mandatory: input.photo_mandatory,
            }),
          },
          create: {
            id: 1,
            photo_mandatory: input.photo_mandatory ?? false,
          },
        });

        return {
          success: true,
          message: "Config updated",
          config,
        };
      } catch (error) {
        console.error("Error updating config:", error);
        return {
          success: false,
          message: "Failed to update config",
        };
      }
    }),
});
