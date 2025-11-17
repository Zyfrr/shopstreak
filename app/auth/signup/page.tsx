// app/auth/signup/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { toast } from "sonner";

type SignupStep = "email" | "otp" | "password";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>("email");
  const [email, setEmail] = useState("");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [userId, setUserId] = useState("");

  // Timer for OTP resend
  React.useEffect(() => {
    if (step !== "otp") return;

    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, step]);

  // Step 1: Send OTP
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setErrors({ email: "Email is required" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: "Please enter a valid email address" });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      console.log("Signup response:", result);

      if (result.success) {
        setUserId(result.data.userId);
        setStep("otp");
        setTimeLeft(30);
        setCanResend(false);

        if (result.data.otp) {
          toast.info(`Development OTP: ${result.data.otp}`, {
            duration: 10000,
          });
        }

        toast.success("OTP sent to your email!");
      } else {
        setErrors({ email: result.message || "Failed to send OTP" });
        toast.error(result.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setErrors({ email: "Network error. Please try again." });
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced OTP input handlers with paste support
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();

    // Check if pasted data is a 6-digit number
    if (/^\d{6}$/.test(pastedData)) {
      const otpArray = pastedData.split("").slice(0, 6);
      setOtpValues(otpArray);

      // Focus the last input
      setTimeout(() => {
        const lastInput = document.getElementById(`otp-5`);
        lastInput?.focus();
      }, 0);
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = otpValues.join("");

    if (otp.length !== 6) {
      setErrors({ otp: "Please enter all 6 digits" });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          email,
          otp,
        }),
      });

      const result = await response.json();
      console.log("OTP verification response:", result);

      if (result.success) {
        const verifiedUserId = result.data.user?.id || userId;

        localStorage.setItem("tempUserId", verifiedUserId);
        localStorage.setItem("tempUserEmail", email);

        setStep("password");
        toast.success("Email verified! Please set your password.");
      } else {
        setErrors({ otp: result.message || "OTP verification failed" });
        toast.error(result.message || "OTP verification failed");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      setErrors({ otp: "Network error. Please try again." });
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/users/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          type: "email_verification",
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTimeLeft(30);
        setCanResend(false);
        setOtpValues(["", "", "", "", "", ""]);
        toast.success("OTP resent successfully!");

        if (result.data?.developmentOTP) {
          toast.info(`Development OTP: ${result.data.developmentOTP}`, {
            duration: 10000,
          });
        }
      } else {
        toast.error(result.message || "Failed to resend OTP");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Set Password - FIXED NAVIGATION
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Password validation
    const newErrors: Record<string, string> = {};

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)
    ) {
      newErrors.password =
        "Password must contain uppercase, lowercase, number and special character";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const tempUserId = localStorage.getItem("tempUserId") || userId;
      const tempUserEmail = localStorage.getItem("tempUserEmail") || email;

      console.log("Creating password for:", { tempUserId, tempUserEmail });

      const response = await fetch("/api/users/create-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: tempUserId,
          email: tempUserEmail,
          password,
          confirmPassword,
        }),
      });

      const result = await response.json();
      console.log("Password creation response:", result);

      if (result.success) {
        // Store tokens and user data
        if (result.data.accessToken) {
          localStorage.setItem("accessToken", result.data.accessToken);
        }
        if (result.data.refreshToken) {
          localStorage.setItem("refreshToken", result.data.refreshToken);
        }
        if (result.data.user) {
          localStorage.setItem("userData", JSON.stringify(result.data.user));
          console.log(
            "User data stored with onboardingStatus:",
            result.data.user.onboardingStatus
          );
        }

        // Clear temp data
        localStorage.removeItem("tempUserId");
        localStorage.removeItem("tempUserEmail");

        toast.success(
          "Account created successfully! Redirecting to profile setup..."
        );

        // Check if user needs profile setup
        const userOnboardingStatus = result.data.user?.onboardingStatus;
        console.log("User onboarding status:", userOnboardingStatus);

        if (userOnboardingStatus === "profile_setup") {
          // Use window.location for guaranteed navigation
          console.log("Navigating to profile setup page...");
          window.location.href = "/auth/profile-setup";
        } else {
          console.log(
            "User onboarding status is not profile_setup, going to home"
          );
          window.location.href = "/";
        }
      } else {
        const errorMsg = result.message || "Failed to set password";
        setErrors({ password: errorMsg });
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Set password error:", error);
      setErrors({ password: "Network error. Please try again." });
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = step === "email" ? 33 : step === "otp" ? 66 : 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Bar */}
      <div className="w-full h-1 bg-border">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Logo size="lg" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {step === "email"
                  ? "Create Account"
                  : step === "otp"
                  ? "Verify Email"
                  : "Set Password"}
              </h1>
              <p className="text-muted-foreground mt-2">
                Step {step === "email" ? 1 : step === "otp" ? 2 : 3} of 3
              </p>
            </div>
          </div>
          {/* Email Step */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.email}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          )}
          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code sent to
                    <br />
                    <strong>{email}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    You can paste the entire OTP code
                  </p>
                </div>

                <div className="flex gap-2 justify-center">
                  {otpValues.map((value, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={value}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      className="w-12 h-12 text-center text-lg font-semibold border-2 border-border rounded-lg focus:border-primary focus:outline-none transition-colors"
                    />
                  ))}
                </div>

                {errors.otp && (
                  <p className="text-sm text-destructive text-center">
                    {errors.otp}
                  </p>
                )}

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {canResend ? (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isLoading}
                        className="text-primary font-semibold hover:underline"
                      >
                        Resend OTP
                      </button>
                    ) : (
                      `Resend OTP in 00:${timeLeft.toString().padStart(2, "0")}`
                    )}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || otpValues.some((v) => !v)}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify OTP
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep("email")}
                className="w-full text-primary hover:underline text-sm font-medium"
              >
                Change email
              </button>
            </form>
          )}
          {/* Password Step */}
          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Create Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
