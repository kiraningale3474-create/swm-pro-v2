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
    .input(z.object({ mobile: z.string().regex(/^\+?[1-9]\d{1,14}$/) }))
    .mutation(async ({ input }) => {
      try {
        const pin = generatePin();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

        // Store OTP
        otpStore.set(input.mobile, { pin, expiresAt });

        // Send via Twilio
        const sent = await sendOtp(input.mobile, pin);

        if (!sent) {
          return {
            success: false,
            message: "Failed to send OTP. Please try again.",
          };
        }

        return {
          success: true,
          message: "OTP sent successfully",
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
        pin: z.string().regex(/^\d{4}$/),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const storedOtp = otpStore.get(input.mobile);

        // Check if OTP exists and is not expired
        if (!storedOtp || storedOtp.expiresAt < Date.now()) {
          return {
            success: false,
            message: "OTP expired. Please request a new one.",
          };
        }

        // Verify PIN
        if (storedOtp.pin !== input.pin) {
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
              name: `Worker ${input.mobile}`,
              pin: input.pin,
              role: "WORKER",
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
        const pin = generatePin();
        const expiresAt = Date.now() + 5 * 60 * 1000;

        otpStore.set(input.mobile, { pin, expiresAt });

        const sent = await sendOtp(input.mobile, pin);

        if (!sent) {
          return {
            success: false,
            message: "Failed to resend OTP",
          };
        }

        return {
          success: true,
          message: "OTP resent successfully",
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
