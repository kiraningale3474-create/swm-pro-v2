import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  throw new Error("Missing Twilio credentials in environment variables");
}

const client = twilio(accountSid, authToken);

/**
 * Generate a random 4-digit PIN
 */
export function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Send OTP via SMS to a phone number
 */
export async function sendOtp(phoneNumber: string, pin: string): Promise<boolean> {
  try {
    if (!twilioPhoneNumber) {
      throw new Error("Twilio phone number not configured");
    }
    await client.messages.create({
      body: `Your SWM PRO verification code is: ${pin}. Do not share this code.`,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });
    return true;
  } catch (error) {
    console.error("Failed to send OTP:", error);
    return false;
  }
}

/**
 * Validate Twilio credentials by making a test API call
 */
export async function validateTwilioCredentials(): Promise<boolean> {
  try {
    if (!accountSid) {
      throw new Error("Twilio account SID not configured");
    }
    const account = await client.api.accounts(accountSid).fetch();
    return account.status === "active";
  } catch (error) {
    console.error("Twilio credentials validation failed:", error);
    return false;
  }
}
