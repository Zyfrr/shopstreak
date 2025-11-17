"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, CheckCircle2, Loader2, Mail, Lock, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type ForgotPasswordStep = "email" | "otp" | "password";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<ForgotPasswordStep>("email");
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
  const [resetToken, setResetToken] = useState("");

  // Timer for OTP resend
  useEffect(() => {
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

  // Reset timer when step changes to OTP
  useEffect(() => {
    if (step === "otp") {
      setTimeLeft(30);
      setCanResend(false);
    }
  }, [step]);

  // Step 1: Send OTP for password reset
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    const newErrors: Record<string, string> = {};
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      console.log("📧 Sending forgot password request for:", email);

      const response = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const responseText = await response.text();
      console.log("📨 Response status:", response.status);

      // Handle HTML responses (errors)
      if (responseText.trim().startsWith("<!DOCTYPE")) {
        throw new Error("API endpoint not found. Please check the server configuration.");
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ JSON parse error:", parseError);
        throw new Error(`Invalid server response: ${responseText.substring(0, 100)}`);
      }

      if (result.success) {
        console.log("✅ OTP sent successfully");
        setStep("otp");
        setTimeLeft(30);
        setCanResend(false);
        
        // Show development OTP if available
        if (result.data?.otp) {
          toast.info(`Development OTP: ${result.data.otp}`, { duration: 10000 });
          console.log("🔑 Development OTP:", result.data.otp);
        }
        
        toast.success("OTP sent to your email!");
      } else {
        setErrors({ submit: result.message || "Failed to send OTP. Please try again." });
        toast.error(result.message || "Failed to send OTP");
      }
    } catch (error: unknown) {
      console.error("❌ Forgot password error:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Network error. Please try again.";
      setErrors({ submit: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newOtpValues = [
      ...pastedData.split(""),
      ...Array(6 - pastedData.length).fill(""),
    ];
    setOtpValues(newOtpValues);

    setTimeout(() => {
      const lastFilledIndex = newOtpValues.findIndex((val) => !val);
      const focusIndex = lastFilledIndex === -1 ? 5 : Math.max(0, lastFilledIndex - 1);
      const input = document.getElementById(`otp-${focusIndex}`);
      input?.focus();
    }, 0);
  };

  // Step 2: Verify OTP
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = otpValues.join("");

    if (!otp || otp.length !== 6) {
      setErrors({ otp: "Please enter a valid 6-digit OTP" });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      console.log("🔐 Verifying OTP for:", email);

      const response = await fetch('/api/users/reset-password-otp-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
        }),
      });

      const responseText = await response.text();
      console.log("📨 OTP verification response status:", response.status);

      if (responseText.trim().startsWith("<!DOCTYPE")) {
        throw new Error("API endpoint not found. Please check the server configuration.");
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ JSON parse error:", parseError);
        throw new Error(`Invalid server response: ${responseText.substring(0, 100)}`);
      }

      // Handle successful verification
      if (result.success) {
        console.log("✅ OTP verified successfully");
        setStep("password");
        
        // Store reset token if provided
        if (result.data?.resetToken) {
          setResetToken(result.data.resetToken);
          console.log("🔑 Reset token received:", result.data.resetToken);
        } else {
          // Generate fallback token for development
          const fallbackToken = `reset_token_${Date.now()}`;
          setResetToken(fallbackToken);
          console.log("🔑 Using fallback token:", fallbackToken);
        }
        
        toast.success("OTP verified successfully!");
      } else {
        setErrors({ otp: result.message || "Invalid OTP. Please try again." });
        toast.error(result.message || "OTP verification failed");
      }
    } catch (error: unknown) {
      console.error("❌ OTP verification failed:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Verification failed. Please try again.";
      setErrors({ otp: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/users/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          type: 'password_reset'
        }),
      });

      const responseText = await response.text();

      if (responseText.trim().startsWith("<!DOCTYPE")) {
        throw new Error("API endpoint not found. Please check the server configuration.");
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ JSON parse error:", parseError);
        throw new Error(`Invalid server response: ${responseText.substring(0, 100)}`);
      }

      if (result.success) {
        setTimeLeft(30);
        setCanResend(false);
        setOtpValues(["", "", "", "", "", ""]);
        
        if (result.data?.developmentOTP) {
          toast.info(`Development OTP: ${result.data.developmentOTP}`, { duration: 10000 });
        }
        
        toast.success("OTP resent successfully!");
      } else {
        setErrors({ submit: result.message || "Failed to resend OTP" });
        toast.error(result.message || "Failed to resend OTP");
      }
    } catch (error: unknown) {
      console.error("❌ Resend OTP error:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Network error. Please try again.";
      setErrors({ submit: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Set new password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
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
      console.log("🔄 Resetting password for:", email);

      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          newPassword: password,
          confirmPassword,
          resetToken: resetToken,
        }),
      });

      const responseText = await response.text();

      if (responseText.trim().startsWith("<!DOCTYPE")) {
        throw new Error("API endpoint not found. Please check the server configuration.");
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ JSON parse error:", parseError);
        throw new Error(`Invalid server response: ${responseText.substring(0, 100)}`);
      }

      if (result.success) {
        console.log("✅ Password reset successfully");
        toast.success("Password reset successfully!");
        
        // Redirect to login page with success message
        setTimeout(() => {
          router.push("/auth/login?message=password_reset_success");
        }, 2000);
      } else {
        setErrors({ submit: result.message || "Failed to reset password. Please try again." });
        toast.error(result.message || "Failed to reset password");
      }
    } catch (error: unknown) {
      console.error("❌ Password reset failed:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Network error. Please try again.";
      setErrors({ submit: errorMessage });
      toast.error(errorMessage);
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
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="flex justify-center">
              <Logo size="lg" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold">
                {step === "email" ? "Reset Password" : 
                 step === "otp" ? "Verify OTP" : 
                 "Set New Password"}
              </CardTitle>
              <CardDescription>
                Step {step === "email" ? 1 : step === "otp" ? 2 : 3} of 3
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {errors.submit && (
              <div className="mb-4 p-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                {errors.submit}
              </div>
            )}

            {/* Email Step */}
            {step === "email" && (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Registered Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                </div>

                <Button
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
                </Button>

                <div className="text-center">
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 text-primary font-semibold hover:underline text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Link>
                </div>
              </form>
            )}

            {/* OTP Step */}
            {step === "otp" && (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Enter the 6-digit code sent to<br />
                      <strong>{email}</strong>
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
                        disabled={isLoading}
                      />
                    ))}
                  </div>

                  {errors.otp && <p className="text-sm text-destructive text-center">{errors.otp}</p>}

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {canResend ? (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={isLoading}
                          className="text-primary font-semibold hover:underline"
                        >
                          {isLoading ? "Resending..." : "Resend OTP"}
                        </button>
                      ) : (
                        `Resend OTP in 00:${timeLeft.toString().padStart(2, "0")}`
                      )}
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || otpValues.some(v => !v)}
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
                </Button>

                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="w-full text-primary hover:underline text-sm font-medium text-center"
                  disabled={isLoading}
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
                    <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-10"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition"
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}