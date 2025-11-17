// app/auth/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { Logo } from "@/components/shared/logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/components/contexts/auth-context";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  // Handle Google OAuth callback from URL parameters
  useEffect(() => {
    const handleGoogleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const googleSuccess = urlParams.get('google_success');
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      const onboardingStatus = urlParams.get('onboarding_status');
      const error = urlParams.get('error');

      console.log('🔍 Checking Google OAuth callback...');

      if (error) {
        const errorMessage = urlParams.get('message') || error;
        toast.error(`Google login failed: ${errorMessage}`);
        window.history.replaceState({}, '', '/auth/login');
        return;
      }

      if (googleSuccess === 'true' && accessToken && refreshToken) {
        setGoogleLoading(true);
        try {
          console.log('🔄 Processing Google OAuth callback...');
          
          // Store tokens immediately
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);

          // Fetch user profile to get complete data
          const userResponse = await fetch('/api/users/profile', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });

          if (userResponse.ok) {
            const userResult = await userResponse.json();
            const userData = userResult.data?.user;
            
            if (userData) {
              localStorage.setItem('userData', JSON.stringify(userData));
              console.log('✅ User data stored:', userData);

              // Determine if profile setup is needed
              const needsProfileSetup = userData.onboardingStatus === 'profile_setup';

              console.log('🔄 Navigation decision:', { needsProfileSetup });

              // Use window.location for guaranteed navigation
              if (needsProfileSetup) {
                console.log('🚀 Redirecting to profile setup...');
                window.location.href = '/auth/profile-setup';
              } else {
                console.log('🚀 Redirecting to home...');
                window.location.href = '/';
              }
            } else {
              throw new Error('No user data received');
            }
          } else {
            throw new Error('Failed to fetch user profile');
          }
        } catch (error) {
          console.error('❌ Google callback error:', error);
          toast.error('Failed to complete Google login');
        } finally {
          setGoogleLoading(false);
          window.history.replaceState({}, '', '/auth/login');
        }
      }
    };

    handleGoogleCallback();
  }, []);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      console.log('Login response:', result);

      if (result.success) {
        const { user: userData, tokens, customerProfile: profile } = result.data;

        // Store in localStorage
        localStorage.setItem("accessToken", tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);
        localStorage.setItem("userData", JSON.stringify(userData));

        if (profile) {
          localStorage.setItem("customerProfile", JSON.stringify(profile));
        }

        toast.success("Login successful!");
        
        // Get user data to check onboarding status
        const needsProfileSetup = userData.onboardingStatus === 'profile_setup';

        console.log('🔄 Regular login - navigation decision:', { needsProfileSetup });

        // Use window.location for guaranteed navigation
        if (needsProfileSetup) {
          window.location.href = '/auth/profile-setup';
        } else {
          window.location.href = '/';
        }
      } else {
        // Show specific error message from server
        const errorMessage = result.message || "Invalid email or password";
        setErrors({ 
          general: errorMessage,
          email: " ",
          password: " " 
        });
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ general: "Network error. Please try again." });
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Simple Google login using redirect
  const handleGoogleLogin = () => {
    console.log('🚀 Starting Google OAuth redirect...');
    setGoogleLoading(true);
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your ShopStreak account to continue shopping
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Alert */}
          {errors.general && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">
                  {errors.general}
                </p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email || errors.general) setErrors({});
                  }}
                  className={`w-full ${errors.email || errors.general ? 'border-destructive' : ''}`}
                  disabled={isLoading || googleLoading}
                />
                {errors.email && errors.email.trim() && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password || errors.general) setErrors({});
                    }}
                    className={`w-full pr-10 ${errors.password || errors.general ? 'border-destructive' : ''}`}
                    disabled={isLoading || googleLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                    disabled={isLoading || googleLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && errors.password.trim() && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-primary hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading || authLoading || googleLoading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google Login Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={googleLoading || authLoading || isLoading}
            className="w-full border-2 border-gray-300 bg-white hover:bg-gray-50 h-11 text-sm font-medium rounded-lg flex justify-center items-center gap-3 transition-all disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FcGoogle className="w-5 h-5" />
            )}
            Continue with Google
          </Button>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="/auth/signup"
                className="text-primary font-semibold hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}