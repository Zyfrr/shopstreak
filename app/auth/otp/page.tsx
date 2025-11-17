"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { ChevronRight } from "lucide-react";

export default function OTPPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const storedPhone = sessionStorage.getItem("authPhone");


    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^[0-9]*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
  e.preventDefault();
  const otpString = otp.join("");

  if (otpString.length !== 6) {
    setError("Please enter all 6 digits");
    return;
  }

  setLoading(true);

  // ✅ Simulate verification (accept any 6-digit number)
  setTimeout(() => {

    router.push("/"); // ✅ Go to home page
    setLoading(false);
  }, 1000);
};


  const handleResend = () => {
    setTimer(60);
    setCanResend(false);
    setError("");
    // In real app, resend OTP via API
    console.log("OTP resent to", phone);
  };

  return (
    <div className="bg-background min-h-screen flex flex-col">

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Verify OTP</h1>
            <p className="text-muted-foreground text-sm">
              We've sent a 6-digit code to <br />
              <span className="font-semibold text-foreground">+91 {phone}</span>
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-4 text-center">
                Enter OTP
              </label>
              <div className="flex gap-2 justify-center mb-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold bg-input border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                ))}
              </div>
              {error && (
                <p className="text-destructive text-sm text-center">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || otp.some((d) => !d)}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading ? "Verifying..." : "Verify OTP"}
              {!loading && <ChevronRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 text-center">
            {canResend ? (
              <button
                onClick={handleResend}
                className="text-primary font-semibold hover:underline text-sm"
              >
                Resend OTP
              </button>
            ) : (
              <p className="text-muted-foreground text-sm">
                Resend OTP in{" "}
                <span className="font-semibold text-foreground">{timer}s</span>
              </p>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-xs">
              Wrong number?{" "}
              <button
                onClick={() => router.push("/auth/login")}
                className="text-primary font-semibold hover:underline"
              >
                Go back
              </button>
            </p>
          </div>

          <div className="mt-8 p-4 bg-accent/10 border border-accent rounded-lg text-xs text-foreground">
            <p className="font-semibold mb-2">Test OTP: 123456</p>
            <p className="text-muted-foreground">
              Use this code to test the verification flow
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
