import { publicProcedure, router } from "../../_core/trpc";
import { z } from "zod";
import { generatePin, sendOtp } from "../../otp";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Store OTPs in memory (in production, use Redis or database)
const otpStore = new Map<string, { pin: string; expiresAt: number }>();

export const authOtpRouter = router({
  /**
   * Send OTP to a phone number
   */
  sendOtp: publicProcedure
    .input(z.object({ mobile: z.string() }))
    .mutation(async ({ input }) => {
      try {
        // Use static OTP 123456 as requested
        const pin = "123456";
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

        // Store OTP
        otpStore.set(input.mobile, { pin, expiresAt });

        // Skip Twilio and return success for static OTP
        console.log(`[OTP] Static OTP 123456 set for ${input.mobile}`);

        return {
          success: true,
          message: "OTP sent successfully (Static: 123456)",
          expiresIn: 300, // 5 minutes in seconds
        };
      } catch (error) {
        console.error("Error sending OTP:", error);
        return {
          success: false,
          message: "An error occurred while sending OTP",
        };
      }
    }),

  /**
   * Verify OTP and login user
   */
  verifyOtp: publicProcedure
    .input(
      z.object({
        mobile: z.string(),
        pin: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const storedOtp = otpStore.get(input.mobile);

        // Check if OTP exists and is not expired
        if (!storedOtp || storedOtp.expiresAt < Date.now()) {
          // Allow 123456 even if not in store for easier testing
          if (input.pin !== "123456") {
            return {
              success: false,
              message: "OTP expired or invalid. Please request a new one.",
            };
          }
        }

        // Verify PIN
        if (input.pin !== "123456" && storedOtp?.pin !== input.pin) {
          return {
            success: false,
            message: "Invalid OTP. Please try again.",
          };
        }

        // Clear used OTP
        otpStore.delete(input.mobile);

        // Find or create user
        let user = await prisma.user.findUnique({
          where: { mobile: input.mobile },
        });

        if (!user) {
          // Create new user with default role WORKER
          user = await prisma.user.create({
            data: {
              mobile: input.mobile,
              name: input.mobile === "9876543210" ? "Dummy User" : `Worker ${input.mobile}`,
              role: "WORKER",
              pin: "0000", // Default PIN as per schema requirement
            },
          });
        }

        return {
          success: true,
          message: "Login successful",
          user: {
            id: user.id,
            mobile: user.mobile,
            name: user.name,
            role: user.role,
          },
        };
      } catch (error) {
        console.error("Error verifying OTP:", error);
        return {
          success: false,
          message: "An error occurred during verification",
        };
      }
    }),

  /**
   * Resend OTP
   */
  resendOtp: publicProcedure
    .input(z.object({ mobile: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const pin = "123456";
        const expiresAt = Date.now() + 5 * 60 * 1000;

        otpStore.set(input.mobile, { pin, expiresAt });

        return {
          success: true,
          message: "OTP resent successfully (Static: 123456)",
          expiresIn: 300,
        };
      } catch (error) {
        console.error("Error resending OTP:", error);
        return {
          success: false,
          message: "An error occurred",
        };
      }
    }),
});
