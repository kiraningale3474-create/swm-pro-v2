import React, { useState } from "react";
import { Phone, Lock, ArrowRight } from "lucide-react";

export default function WorkerLogin() {
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expiresIn, setExpiresIn] = useState(0);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // TODO: Call API to send OTP
      // const response = await trpc.auth.otp.sendOtp.mutate({ mobile });
      // if (response.success) {
      //   setStep("otp");
      //   setExpiresIn(response.expiresIn);
      // } else {
      //   setError(response.message);
      // }
      setStep("otp");
      setExpiresIn(300);
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // TODO: Call API to verify OTP
      // const response = await trpc.auth.otp.verifyOtp.mutate({ mobile, pin: otp });
      // if (response.success) {
      //   // Redirect to worker dashboard
      //   window.location.href = "/worker/dashboard";
      // } else {
      //   setError(response.message);
      // }
    } catch (err) {
      setError("Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SWM PRO</h1>
          <p className="text-gray-600">Worker Login</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[20px] p-8 backdrop-blur-md border border-blue-100 shadow-lg">
          {step === "mobile" ? (
            <form onSubmit={handleSendOtp}>
              <div className="mb-6">
                <label className="block text-gray-900 font-medium mb-3">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 w-5 h-5 text-blue-600" />
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "Sending..." : "Send OTP"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <div className="mb-6">
                <label className="block text-gray-900 font-medium mb-3">
                  Verification Code
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Enter the 4-digit code sent to {mobile}
                </p>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-blue-600" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.slice(0, 4))}
                    placeholder="0000"
                    maxLength={4}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-center text-2xl tracking-widest"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}

              <div className="mb-6 text-center text-sm text-gray-600">
                Code expires in {expiresIn} seconds
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 4}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "Verifying..." : "Verify & Login"}
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("mobile");
                  setOtp("");
                  setError("");
                }}
                className="w-full mt-3 bg-gray-100 text-gray-900 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Change Phone Number
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-6">
          Secure login with OTP verification
        </p>
      </div>
    </div>
  );
}
