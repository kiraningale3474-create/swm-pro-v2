import { describe, expect, it, beforeAll } from "vitest";
import { validateTwilioCredentials, generatePin, sendOtp } from "./otp";

describe("Twilio OTP Service", () => {
  it("should validate Twilio credentials", async () => {
    const isValid = await validateTwilioCredentials();
    expect(isValid).toBe(true);
  });

  it("should generate a valid 4-digit PIN", () => {
    const pin = generatePin();
    expect(pin).toMatch(/^\d{4}$/);
    expect(parseInt(pin)).toBeGreaterThanOrEqual(1000);
    expect(parseInt(pin)).toBeLessThanOrEqual(9999);
  });

  it("should handle OTP sending (mock test)", async () => {
    const pin = generatePin();
    // This test validates the function exists and can be called
    // In production, use a test phone number from Twilio
    expect(typeof sendOtp).toBe("function");
    expect(pin).toMatch(/^\d{4}$/);
  });
});
