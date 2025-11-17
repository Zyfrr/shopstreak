// app/account/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Loader2,
  Bell,
  Shield,
  CreditCard,
  Plus,
  HelpCircle,
  FileText,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  ArrowLeft as BackIcon,
} from "lucide-react";
import { useAuth } from "@/components/contexts/auth-context";

type ForgotPasswordStep = "initial" | "email" | "otp" | "password";

// Custom hook for mobile detection
function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

// Main Settings Page Component
export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>("");
  const { user, refreshUser } = useAuth();
  const isMobile = useMobileDetection();

  // Navigation items
  const navItems = [
    { id: "notifications", icon: Bell, label: "Notifications" },
    { id: "security", icon: Shield, label: "Security" },
    { id: "payments", icon: CreditCard, label: "Payments" },
    { id: "help", icon: HelpCircle, label: "Help & Support" },
    { id: "legal", icon: FileText, label: "Legal & Privacy" },
  ];

  // Determine what to show based on device and active section
  const showMobileNavigation = isMobile && !activeSection;
  const showMobileContent = isMobile && activeSection;
  const showDesktopLayout = !isMobile;

  // Set default active section for desktop
  useEffect(() => {
    if (!isMobile && !activeSection) {
      setActiveSection("");
    }
  }, [isMobile, activeSection]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error loading settings:", error);
        toast.error("Failed to load settings");
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-4">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Mobile Header */}
        {isMobile && (
          <div className="lg:hidden mb-6">
            <div className="flex items-center gap-4">
              {activeSection && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setActiveSection("")}
                  className="flex-shrink-0"
                >
                  <BackIcon className="w-5 h-5" />
                </Button>
              )}
              <h1 className="text-2xl font-bold">
                {activeSection
                  ? navItems.find((item) => item.id === activeSection)?.label ||
                    "Settings"
                  : "Settings"}
              </h1>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Navigation */}
          {showDesktopLayout && (
            <div className="lg:w-80 flex-shrink-0">
              <div className="sticky top-6">
                <h1 className="text-2xl font-bold mb-6">Settings</h1>
                <nav className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                          activeSection === item.id
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-foreground hover:bg-muted hover:shadow-sm"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          )}

          {/* Mobile Navigation - Only show when no active section */}
          {showMobileNavigation && (
            <div className="lg:hidden w-full">
              <nav className="space-y-3">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className="w-full flex items-center gap-4 px-4 py-4 text-left rounded-xl border border-border bg-background hover:bg-muted transition-all duration-200"
                    >
                      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">
                          {item.label}
                        </h3>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Content Area - Only show when there's an active section */}
          {(showDesktopLayout || showMobileContent) && (
            <div className="flex-1 min-w-0">
              <div className="bg-card border border-border rounded-xl shadow-sm">
                <div className="p-4 md:p-6 lg:p-8">
                  {/* Desktop Section Header */}
                  {showDesktopLayout && (
                    <div className="mb-6">
                      <h2 className="text-xl font-bold">
                        {navItems.find((item) => item.id === activeSection)
                          ?.label || "Notifications"}
                      </h2>
                      <p className="text-muted-foreground mt-2">
                        {getSectionDescription(activeSection)}
                      </p>
                    </div>
                  )}

                  {/* Render Active Section */}
                  <SettingsContent
                    activeSection={activeSection}
                    user={user}
                    refreshUser={refreshUser}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function for section descriptions
function getSectionDescription(section: string): string {
  switch (section) {
    case "notifications":
      return "Manage how you receive notifications and updates";
    case "security":
      return "Manage your password and privacy settings";
    case "payments":
      return "Manage your payment methods and billing preferences";
    case "help":
      return "Get help and contact our support team";
    case "legal":
      return "Review our privacy policy and legal information";
    default:
      return "Manage how you receive notifications and updates";
  }
}

// Main Content Router
function SettingsContent({
  activeSection,
  user,
  refreshUser,
}: {
  activeSection: string;
  user: any;
  refreshUser: () => Promise<void>;
}) {
  switch (activeSection) {
    case "security":
      return <SecuritySection user={user} refreshUser={refreshUser} />;
    case "payments":
      return <PaymentsSection />;
    case "help":
      return <HelpSection />;
    case "legal":
      return <LegalSection />;
    default:
      return <NotificationsSection />;
  }
}

// Notifications Section
function NotificationsSection() {
  const [settings, setSettings] = useState({
    email: true,
    sms: false,
    promotions: true,
    orderUpdates: true,
    priceAlerts: false,
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const notificationItems = [
    {
      key: "email",
      label: "Email Notifications",
      description:
        "Receive order updates, promotions, and important account information via email",
    },
    {
      key: "sms",
      label: "SMS Notifications",
      description:
        "Get text alerts for orders, delivery updates, and security alerts",
    },
    {
      key: "promotions",
      label: "Promotional Offers",
      description: "Receive deals, discounts, new arrivals, and special offers",
    },
    {
      key: "orderUpdates",
      label: "Order Updates",
      description: "Shipping and delivery notifications for your orders",
    },
    {
      key: "priceAlerts",
      label: "Price Alerts",
      description: "Get notified when items on your wishlist go on sale",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Communication Preferences</h3>
          <div className="grid gap-3">
            {notificationItems.slice(0, 3).map((item) => (
              <NotificationToggle
                key={item.key}
                label={item.label}
                description={item.description}
                checked={settings[item.key as keyof typeof settings]}
                onCheckedChange={(checked) =>
                  handleNotificationChange(item.key, checked)
                }
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Order Updates</h3>
          <div className="grid gap-3">
            {notificationItems.slice(3).map((item) => (
              <NotificationToggle
                key={item.key}
                label={item.label}
                description={item.description}
                checked={settings[item.key as keyof typeof settings]}
                onCheckedChange={(checked) =>
                  handleNotificationChange(item.key, checked)
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Notification Toggle Component
function NotificationToggle({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 md:p-4 rounded-lg border border-border bg-background">
      <div className="flex-1 pr-4">
        <Label className="font-medium text-base">{label}</Label>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300 flex-shrink-0"
      />
    </div>
  );
}

// Security Section Component
function SecuritySection({
  user,
  refreshUser,
}: {
  user: any;
  refreshUser: () => Promise<void>;
}) {
  const [forgotPasswordStep, setForgotPasswordStep] =
    useState<ForgotPasswordStep>("initial");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email] = useState(user?.email || "");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {}
  );
  const [timeLeft, setTimeLeft] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [privacySettings, setPrivacySettings] = useState({
    searchVisibility: true,
    dataSharing: false,
  });
  const { checkPasswordStatus } = useAuth();

  const [passwordStatus, setPasswordStatus] = useState({
    hasPassword: false,
    canCreatePassword: true,
    canResetPassword: false,
  });

  // Check password status
  useEffect(() => {
    const checkCurrentPasswordStatus = async () => {
      try {
        const hasPassword = await checkPasswordStatus();
        setPasswordStatus({
          hasPassword,
          canCreatePassword: !hasPassword,
          canResetPassword: hasPassword,
        });
      } catch (error) {
        console.error("Error checking password status:", error);
      }
    };

    checkCurrentPasswordStatus();
  }, [user, checkPasswordStatus]);

  const { canCreatePassword, canResetPassword } = passwordStatus;

  // Timer for OTP resend
  useEffect(() => {
    if (forgotPasswordStep !== "otp") return;

    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, forgotPasswordStep]);

  // Reset timer when step changes to OTP
  useEffect(() => {
    if (forgotPasswordStep === "otp") {
      setTimeLeft(30);
      setCanResend(false);
    }
  }, [forgotPasswordStep]);

  const validatePassword = (password: string) => {
    if (password.length < 8)
      return "Password must be at least 8 characters long";
    if (!/(?=.*[a-z])/.test(password))
      return "Password must contain at least one lowercase letter";
    if (!/(?=.*[A-Z])/.test(password))
      return "Password must contain at least one uppercase letter";
    if (!/(?=.*\d)/.test(password))
      return "Password must contain at least one number";
    if (!/(?=.*[@$!%*?&])/.test(password))
      return "Password must contain at least one special character (@$!%*?&)";
    return "";
  };

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

  const startPasswordFlow = async () => {
    const currentHasPassword = await checkPasswordStatus();
    const currentCanCreatePassword = !currentHasPassword;

    if (currentCanCreatePassword) {
      handleEmailSubmit();
    } else {
      setForgotPasswordStep("email");
    }
  };

  const handleEmailSubmit = async () => {
    setIsSubmitting(true);
    setPasswordErrors({});

    try {
      const endpoint = "/api/users/forgot-password";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        setForgotPasswordStep("otp");
        setTimeLeft(30);
        setCanResend(false);

        if (result.data?.otp) {
          toast.info(`Development OTP: ${result.data.otp}`, {
            duration: 10000,
          });
        }

        toast.success("OTP sent to your email!");
      } else {
        setPasswordErrors({ submit: result.message || "Failed to send OTP" });
        toast.error(result.message || "Failed to send OTP");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Network error";
      setPasswordErrors({ submit: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = otpValues.join("");

    if (!otp || otp.length !== 6) {
      setPasswordErrors({ otp: "Please enter a valid 6-digit OTP" });
      return;
    }

    setIsSubmitting(true);
    setPasswordErrors({});

    try {
      const response = await fetch("/api/users/reset-password-otp-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const result = await response.json();

      if (result.success) {
        setForgotPasswordStep("password");
        setResetToken(result.data?.resetToken || `reset_token_${Date.now()}`);
        toast.success("OTP verified successfully!");
      } else {
        setPasswordErrors({ otp: result.message || "Invalid OTP" });
        toast.error(result.message || "OTP verification failed");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Verification failed";
      setPasswordErrors({ otp: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!password) {
      newErrors.password = "Password is required";
    } else {
      const passwordValidation = validatePassword(password);
      if (passwordValidation) newErrors.password = passwordValidation;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setPasswordErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setPasswordErrors({});

    try {
      const finalHasPassword = await checkPasswordStatus();
      const finalCanCreatePassword = !finalHasPassword;

      const endpoint = finalCanCreatePassword
        ? "/api/users/create-password"
        : "/api/users/reset-password";
      const requestBody = finalCanCreatePassword
        ? { email, password, confirmPassword }
        : { email, newPassword: password, confirmPassword, resetToken };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success) {
        if (finalCanCreatePassword) {
          toast.success("🎉 Password created successfully!");
          setPasswordStatus({
            hasPassword: true,
            canCreatePassword: false,
            canResetPassword: true,
          });
        } else {
          toast.success("✅ Password reset successfully!");
        }

        await refreshUser();
        resetPasswordFlow();
      } else {
        setPasswordErrors({
          submit: result.message || "Failed to set password",
        });
        toast.error(result.message || "Failed to set password");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Network error";
      setPasswordErrors({ submit: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPasswordFlow = () => {
    setForgotPasswordStep("initial");
    setPasswordErrors({});
    setOtpValues(["", "", "", "", "", ""]);
    setPassword("");
    setConfirmPassword("");
  };

  const handlePrivacyChange = (key: string, value: boolean) => {
    setPrivacySettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Password Management */}
      <div className="p-4 md:p-6 rounded-lg border border-border bg-background">
        <h3 className="font-semibold text-lg mb-4">Password Management</h3>

        {passwordErrors.submit && (
          <div className="mb-4 p-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
            {passwordErrors.submit}
          </div>
        )}

        {forgotPasswordStep === "initial" && (
          <div className="space-y-4">
            <div className="text-center">
              <Lock className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-3 md:mb-4 opacity-60" />
              <p className="text-muted-foreground mb-4 text-sm md:text-base">
                {canCreatePassword
                  ? "Create a password for your account to enable email sign-in"
                  : "Reset your password if you've forgotten it or want to change it"}
              </p>
            </div>

            <Button
              onClick={startPasswordFlow}
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  {canCreatePassword ? "Create Password" : "Reset Password"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              You'll receive an OTP to verify your identity before{" "}
              {canCreatePassword ? "creating" : "resetting"} your password
            </p>
          </div>
        )}

        {forgotPasswordStep === "email" && (
          <PasswordEmailStep
            email={email}
            isSubmitting={isSubmitting}
            onSubmit={handleEmailSubmit}
            onCancel={resetPasswordFlow}
            isEditable={canResetPassword}
          />
        )}

        {forgotPasswordStep === "otp" && (
          <PasswordOtpStep
            email={email}
            otpValues={otpValues}
            onOtpChange={handleOtpChange}
            onOtpPaste={handleOtpPaste}
            isSubmitting={isSubmitting}
            onSubmit={handleOtpSubmit}
            onCancel={resetPasswordFlow}
            timeLeft={timeLeft}
            canResend={canResend}
            onResend={handleEmailSubmit}
            passwordErrors={passwordErrors}
          />
        )}

        {forgotPasswordStep === "password" && (
          <PasswordSetStep
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            isSubmitting={isSubmitting}
            onSubmit={handlePasswordSubmit}
            onBack={() => setForgotPasswordStep("otp")}
            passwordErrors={passwordErrors}
            canCreatePassword={canCreatePassword}
          />
        )}
      </div>

      {/* Privacy Settings */}
      <div className="p-4 md:p-6 rounded-lg border border-border bg-background">
        <h3 className="font-semibold text-lg mb-4">Privacy Settings</h3>
        <div className="space-y-4">
          <PrivacyToggle
            label="Search Visibility"
            description="Allow your profile to appear in search results"
            checked={privacySettings.searchVisibility}
            onCheckedChange={(checked) =>
              handlePrivacyChange("searchVisibility", checked)
            }
          />
          <PrivacyToggle
            label="Data Sharing"
            description="Help improve our services with anonymous usage data"
            checked={privacySettings.dataSharing}
            onCheckedChange={(checked) =>
              handlePrivacyChange("dataSharing", checked)
            }
          />
        </div>
      </div>
    </div>
  );
}

// Reusable Privacy Toggle Component
function PrivacyToggle({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1 pr-4">
        <Label className="font-medium text-base">{label}</Label>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300 flex-shrink-0"
      />
    </div>
  );
}

// Password Step Components
function PasswordEmailStep({
  email,
  isSubmitting,
  onSubmit,
  onCancel,
  isEditable = true,
}: any) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email" className="text-sm font-medium mb-2">
          Your Email{" "}
          {!isEditable && (
            <span className="text-muted-foreground">(Cannot be changed)</span>
          )}
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            value={email}
            className="w-full pl-10 bg-muted"
            disabled={true}
            readOnly={true}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-destructive mt-1">{errors.email}</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 min-h-[44px] text-sm sm:text-base hover:bg-muted hover:text-foreground transition-colors"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 min-h-[44px] text-sm sm:text-base"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          {isSubmitting ? "Sending..." : "Send OTP"}
          {!isSubmitting && (
            <ArrowRight className="w-4 h-4 ml-2 hidden sm:block" />
          )}
        </Button>
      </div>
    </form>
  );
}

function PasswordOtpStep({
  email,
  otpValues,
  onOtpChange,
  onOtpPaste,
  isSubmitting,
  onSubmit,
  onCancel,
  timeLeft,
  canResend,
  onResend,
  passwordErrors,
}: any) {
  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Handle input change with better validation
  const handleInputChange = (index: number, value: string) => {
    if (/^\d*$/.test(value)) {
      onOtpChange(index, value);

      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code sent to
            <br />
            <strong>{email}</strong>
          </p>
        </div>

        <div className="flex gap-2 justify-center" onPaste={onOtpPaste}>
          {otpValues.map((value: string, index: number) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={value}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              onFocus={(e) => e.target.select()}
              className="w-10 h-10 md:w-12 md:h-12 text-center text-lg font-semibold border-2 border-border rounded-lg focus:border-primary focus:outline-none transition-colors bg-background"
              disabled={isSubmitting}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        {passwordErrors.otp && (
          <p className="text-sm text-destructive text-center">
            {passwordErrors.otp}
          </p>
        )}

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {canResend ? (
              <button
                type="button"
                onClick={onResend}
                disabled={isSubmitting}
                className="text-primary font-semibold hover:underline disabled:opacity-50"
              >
                {isSubmitting ? "Resending..." : "Resend OTP"}
              </button>
            ) : (
              `Resend OTP in 00:${timeLeft.toString().padStart(2, "0")}`
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-row items-center gap-2 w-full">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 h-9 text-sm hover:bg-muted hover:text-foreground transition-colors"
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting || otpValues.some((v: string) => !v)}
          className="flex-1 h-9 text-sm"
        >
          <>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}

            {isSubmitting ? "Verifying..." : "Verify"}

            {!isSubmitting ? <CheckCircle2 className="w-4 h-4 ml-2" /> : null}
          </>
        </Button>
      </div>
    </form>
  );
}

function PasswordSetStep({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  isSubmitting,
  onSubmit,
  onBack,
  passwordErrors,
  canCreatePassword,
}: any) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="password" className="text-sm font-medium mb-2">
            {canCreatePassword ? "Create New Password" : "New Password"}
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters with uppercase, lowercase, number & special character"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition p-1"
              disabled={isSubmitting}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {passwordErrors.password && (
            <p className="text-sm text-destructive mt-1">
              {passwordErrors.password}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword" className="text-sm font-medium mb-2">
            Confirm Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-10"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition p-1"
              disabled={isSubmitting}
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {passwordErrors.confirmPassword && (
            <p className="text-sm text-destructive mt-1">
              {passwordErrors.confirmPassword}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 min-h-[44px] text-sm sm:text-base hover:bg-muted hover:text-foreground transition-colors"
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 min-h-[44px] text-sm sm:text-base"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          {isSubmitting
            ? canCreatePassword
              ? "Creating..."
              : "Resetting..."
            : canCreatePassword
            ? "Create Password"
            : "Reset Password"}
          {!isSubmitting && (
            <ArrowRight className="w-4 h-4 ml-2 hidden sm:block" />
          )}
        </Button>
      </div>
    </form>
  );
}

// Payments Section
function PaymentsSection() {
  return (
    <div className="space-y-6">
      <div className="p-6 md:p-8 rounded-lg border border-border bg-background text-center">
        <CreditCard className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground mx-auto mb-4 opacity-60" />
        <h3 className="text-lg font-semibold mb-2">No Payment Methods</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm md:text-base">
          Add your payment methods for faster and more secure checkout
          experience
        </p>
        <Button className="gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Add Payment Method
        </Button>
      </div>

      <div className="p-4 md:p-6 rounded-lg border border-border bg-background">
        <h3 className="font-semibold text-lg mb-4">Billing Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Billing Address:</span>
            <span>Not set</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax Information:</span>
            <span>Not provided</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Invoice Preferences:</span>
            <span>Email</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Help Section
function HelpSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    toast.success("Message sent successfully!");
  };

  const contactMethods = [
    {
      icon: Phone,
      title: "Call Us",
      content: "+91 9791509443",
      href: "tel:+919791509443",
      description: "Available 24/7 for support",
    },
    {
      icon: Mail,
      title: "Email Us",
      content: "shopstreak18@gmail.com",
      href: "https://mail.google.com/mail/?view=cm&fs=1&to=shopstreak18@gmail.com",
      description: "Opens Gmail to send us an email",
    },
    {
      icon: FileText,
      title: "Visit Us",
      content: "Chennai, India",
      href: "https://www.google.com/maps/place/Chennai,+India",
      description: "Head office location",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {contactMethods.map((method, index) => {
          const Icon = method.icon;
          return (
            <a
              key={index}
              href={method.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-background border border-border rounded-lg p-4 md:p-6 text-center hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <h3 className="text-base md:text-lg font-bold mb-2">
                {method.title}
              </h3>
              <p className="text-foreground font-semibold mb-1 text-sm md:text-base">
                {method.content}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">
                {method.description}
              </p>
            </a>
          );
        })}
      </div>

      <div className="bg-background border border-border rounded-lg p-4 md:p-6 lg:p-8">
        <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
          Send us a Message
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-3 py-2 md:px-4 md:py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="w-full px-3 py-2 md:px-4 md:py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 md:px-4 md:py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-3 py-2 md:px-4 md:py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select a subject</option>
                <option value="order">Order Issue</option>
                <option value="delivery">Delivery Inquiry</option>
                <option value="product">Product Question</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Tell us how we can help..."
              rows={4}
              className="w-full px-3 py-2 md:px-4 md:py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}

// Legal Section
function LegalSection() {
  const sections = [
    {
      title: "1. Introduction",
      content:
        "ShopStreak ('we', 'us', 'our') is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our services.",
    },
    {
      title: "2. Information We Collect",
      content: (
        <div className="space-y-3">
          <p>
            <strong className="text-foreground">Personal Information:</strong>{" "}
            Includes your name, email address, contact number, and shipping
            details.
          </p>
          <p>
            <strong className="text-foreground">Order Information:</strong>{" "}
            Details about your orders, purchase history, and delivery
            preferences.
          </p>
          <p>
            <strong className="text-foreground">Browsing Data:</strong> We
            collect analytics and cookie-based data to enhance your experience
            on our website.
          </p>
        </div>
      ),
    },
    {
      title: "3. How We Use Your Information",
      content: (
        <ul className="list-disc list-inside space-y-2 ml-2 md:ml-4">
          <li>To process and fulfill orders efficiently</li>
          <li>To communicate updates about your account or purchases</li>
          <li>To improve website functionality and customer experience</li>
          <li>To send promotional content (with your consent)</li>
          <li>To comply with applicable laws and regulations</li>
        </ul>
      ),
    },
    {
      title: "4. Data Security",
      content:
        "We employ advanced security protocols to protect your personal data from unauthorized access, misuse, or disclosure. Sensitive payment information is processed through secure, encrypted gateways.",
    },
    {
      title: "5. Your Rights",
      content:
        "You have the right to access, correct, or request deletion of your personal information. You may also opt out of marketing communications at any time by contacting our support team.",
    },
    {
      title: "6. Contact Us",
      content: (
        <p>
          For any privacy-related concerns or requests, please reach out to us
          at{" "}
          <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=shopstreak18@gmail.com"
            className="text-primary font-medium hover:underline"
          >
            shopstreak18@gmail.com
          </a>{" "}
          or call us at{" "}
          <span className="font-medium text-foreground">
            <a href="tel:+919791509443">+91 9791509443</a>
          </span>
          .
        </p>
      ),
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      {sections.map((section, index) => (
        <section
          key={index}
          className="bg-background border border-border rounded-xl p-4 md:p-6 lg:p-8"
        >
          <h2 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4 text-primary">
            {section.title}
          </h2>
          <div className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {section.content}
          </div>
        </section>
      ))}

      <div className="p-4 md:p-6 bg-muted rounded-lg text-center">
        <p className="text-xs md:text-sm text-muted-foreground">
          Last updated: January 2024. ShopStreak reserves the right to update
          this Privacy Policy at any time. Changes will take effect immediately
          upon posting.
        </p>
      </div>
    </div>
  );
}