// app/admin/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Shield, Lock } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'access_denied') {
      setError('Access denied. This email does not have admin privileges.');
    } else if (errorParam === 'invalid_token') {
      setError('Invalid authentication. Please try again.');
    } else if (errorParam === 'google_oauth_failed') {
      setError('Google authentication failed. Please try again.');
    } else if (errorParam === 'server_error') {
      setError('Server error. Please try again later.');
    } else if (errorParam) {
      setError('Authentication failed. Please try again.');
    }

    // Check if already logged in
    const token = localStorage.getItem('adminAccessToken');
    if (token) {
      router.push('/admin');
    }
  }, [searchParams, router]);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    window.location.href = '/api/admin/auth/google';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Admin Portal
              </h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Secure access to ShopStreak administration panel
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-background/95">
          <CardContent className="p-8">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              {/* Security Notice */}
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-full">
                    <Lock className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Restricted Access
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Authorized administrators only
                  </p>
                </div>
              </div>

              {/* Google Login Button */}
              <Button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-12 text-base font-semibold rounded-lg transition-all duration-200 hover:shadow-md border-2 border-border bg-background hover:bg-accent"
                variant="outline"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <FcGoogle className="w-5 h-5" />
                    <span>Continue with Google</span>
                  </div>
                )}
              </Button>

              {/* Authorized Emails Info */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Access limited to authorized organizational emails
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            © 2024 ShopStreak. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}