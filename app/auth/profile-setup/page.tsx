// app/auth/profile-setup/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, User, MapPin, Search, ArrowLeft, ArrowRight } from "lucide-react";
import { Logo } from "@/components/shared/logo";

interface ProfileData {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  gender: string;
  address: {
    streetAddress: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    addressType: string;
    isDefault: boolean;
  };
}

type SetupStep = "personal" | "address";

export default function ProfileSetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<SetupStep>("personal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    mobileNumber: "",
    gender: "male",
    address: {
      streetAddress: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      addressType: "home",
      isDefault: true
    }
  });

  // Fetch address details from pincode
  const fetchPincodeDetails = useCallback(async (pincode: string) => {
    if (pincode.length !== 6) return;

    setIsFetchingPincode(true);
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      
      if (data[0]?.Status === "Success" && data[0]?.PostOffice?.[0]) {
        const postOffice = data[0].PostOffice[0];
        setProfileData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            city: postOffice.District || postOffice.Block || "",
            state: postOffice.State || "",
            country: postOffice.Country || "India"
          }
        }));
        
        toast.success("Address details auto-filled!");
      } else {
        toast.error("Invalid pincode");
      }
    } catch (error) {
      console.error('Pincode API error:', error);
      toast.error("Failed to fetch address details");
    } finally {
      setIsFetchingPincode(false);
    }
  }, []);

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const userDataStr = localStorage.getItem('userData');
        
        console.log('🔍 Profile Setup - Checking auth...', { 
          hasToken: !!token, 
          hasUserData: !!userDataStr 
        });

        if (!token) {
          console.log('❌ No token found, redirecting to login');
          router.push('/auth/login');
          return;
        }

        // Check localStorage first for quick access
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          console.log('📋 User data from localStorage:', userData);
          
          if (userData.onboardingStatus === 'completed') {
            console.log('✅ Profile already completed, redirecting to home');
            router.push('/');
            return;
          }
          
          if (userData.onboardingStatus === 'profile_setup') {
            console.log('✅ User needs profile setup, allowing access');
            setIsLoading(false);
            return;
          }
        }

        // Verify token with backend
        console.log('🔐 Verifying token with backend...');
        const response = await fetch('/api/auth/verify-token', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.log('❌ Token verification failed, redirecting to login');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('userData');
          router.push('/auth/login');
          return;
        }

        const result = await response.json();
        const user = result.data?.user;
        
        console.log('👤 User data from token verification:', user);

        if (!user) {
          console.log('❌ No user data from token verification');
          router.push('/auth/login');
          return;
        }

        // Update localStorage with fresh user data
        localStorage.setItem('userData', JSON.stringify(user));

        if (user.onboardingStatus === 'completed') {
          console.log('✅ Profile already completed, redirecting to home');
          router.push('/');
          return;
        }

        if (user.onboardingStatus !== 'profile_setup') {
          console.log('❌ User not in profile_setup status:', user.onboardingStatus);
          
          if (user.onboardingStatus === 'email_verified') {
            console.log('🔑 User needs to set password');
            router.push('/auth/create-password');
            return;
          } else {
            console.log('📧 User needs email verification');
            router.push('/auth/verify-email');
            return;
          }
        }

        console.log('✅ User can proceed with profile setup');
        setIsLoading(false);

      } catch (error) {
        console.error('❌ Auth check error:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userData');
        router.push('/auth/login');
      }
    };

    checkAuthAndProfile();
  }, [router]);

  // Auto-fetch pincode details
  useEffect(() => {
    if (profileData.address.postalCode.length === 6) {
      const timer = setTimeout(() => {
        fetchPincodeDetails(profileData.address.postalCode);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [profileData.address.postalCode, fetchPincodeDetails]);

  const validatePersonalInfo = () => {
    const newErrors: Record<string, string> = {};

    if (!profileData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!profileData.lastName.trim()) newErrors.lastName = "Last name is required";
    
    if (!profileData.mobileNumber.trim()) {
      newErrors.mobileNumber = "Mobile number is required";
    } else if (!/^[6-9]\d{9}$/.test(profileData.mobileNumber)) {
      newErrors.mobileNumber = "Please enter valid mobile number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAddress = () => {
    const newErrors: Record<string, string> = {};

    if (!profileData.address.streetAddress.trim()) newErrors.streetAddress = "Street address is required";
    if (!profileData.address.city.trim()) newErrors.city = "City is required";
    if (!profileData.address.state.trim()) newErrors.state = "State is required";
    
    if (!profileData.address.postalCode.trim()) {
      newErrors.postalCode = "Pincode is required";
    } else if (!/^\d{6}$/.test(profileData.address.postalCode)) {
      newErrors.postalCode = "Please enter valid 6-digit pincode";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validatePersonalInfo()) {
      setCurrentStep("address");
      setErrors({});
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep("personal");
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAddress()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/users/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData),
      });

      const result = await response.json();

      if (result.success) {
        // Update user data in localStorage
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const updatedUserData = {
          ...userData,
          onboardingStatus: 'completed',
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          mobileNumber: profileData.mobileNumber,
          profileCompleted: true
        };
        
        localStorage.setItem('userData', JSON.stringify(updatedUserData));

        toast.success("Profile completed successfully!");
        
        // Redirect to home after a short delay
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        toast.error(result.message || "Failed to save profile");
      }
    } catch (error) {
      console.error('Profile setup error:', error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateProfileField = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const updateAddressField = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  const handleManualPincodeSearch = () => {
    if (profileData.address.postalCode.length === 6) {
      fetchPincodeDetails(profileData.address.postalCode);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-4">
              {/* Progress Steps */}
              <div className="flex items-center gap-2 text-sm">
                <div className={`flex items-center gap-2 ${currentStep === "personal" ? "text-primary" : "text-muted-foreground"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    currentStep === "personal" ? "bg-primary text-white" : "bg-muted"
                  }`}>
                    1
                  </div>
                  <span className="hidden sm:inline">Personal</span>
                </div>
                <div className="w-8 h-px bg-border"></div>
                <div className={`flex items-center gap-2 ${currentStep === "address" ? "text-primary" : "text-muted-foreground"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    currentStep === "address" ? "bg-primary text-white" : "bg-muted"
                  }`}>
                    2
                  </div>
                  <span className="hidden sm:inline">Address</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              {currentStep === "personal" ? (
                <User className="w-6 h-6 text-primary" />
              ) : (
                <MapPin className="w-6 h-6 text-primary" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {currentStep === "personal" ? "Personal Information" : "Delivery Address"}
            </h1>
            <p className="text-muted-foreground">
              {currentStep === "personal" 
                ? "Tell us about yourself" 
                : "Where should we deliver your orders?"}
            </p>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Personal Information Step */}
                {currentStep === "personal" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm">First Name *</Label>
                        <Input
                          id="firstName"
                          value={profileData.firstName}
                          onChange={(e) => updateProfileField("firstName", e.target.value)}
                          placeholder="First name"
                          className="h-10"
                        />
                        {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={profileData.lastName}
                          onChange={(e) => updateProfileField("lastName", e.target.value)}
                          placeholder="Last name"
                          className="h-10"
                        />
                        {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mobileNumber" className="text-sm">Mobile Number *</Label>
                      <Input
                        id="mobileNumber"
                        value={profileData.mobileNumber}
                        onChange={(e) => updateProfileField("mobileNumber", e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10-digit mobile number"
                        className="h-10"
                        maxLength={10}
                      />
                      {errors.mobileNumber && <p className="text-xs text-destructive">{errors.mobileNumber}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-sm">Gender</Label>
                      <Select 
                        value={profileData.gender} 
                        onValueChange={(value) => updateProfileField("gender", value)}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="button"
                      onClick={handleNextStep}
                      className="w-full h-11 text-base font-semibold"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}

                {/* Address Step */}
                {currentStep === "address" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="streetAddress" className="text-sm">Street Address *</Label>
                      <Input
                        id="streetAddress"
                        value={profileData.address.streetAddress}
                        onChange={(e) => updateAddressField("streetAddress", e.target.value)}
                        placeholder="House no, Building, Street"
                        className="h-10"
                      />
                      {errors.streetAddress && <p className="text-xs text-destructive">{errors.streetAddress}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postalCode" className="text-sm">Pincode *</Label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Input
                            id="postalCode"
                            value={profileData.address.postalCode}
                            onChange={(e) => updateAddressField("postalCode", e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="6-digit pincode"
                            className="h-10 pr-16"
                            maxLength={6}
                          />
                          {isFetchingPincode && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleManualPincodeSearch}
                          disabled={profileData.address.postalCode.length !== 6 || isFetchingPincode}
                          className="h-10 px-3"
                        >
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                      {errors.postalCode && <p className="text-xs text-destructive">{errors.postalCode}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm">City *</Label>
                        <Input
                          id="city"
                          value={profileData.address.city}
                          onChange={(e) => updateAddressField("city", e.target.value)}
                          placeholder="City"
                          className="h-10"
                        />
                        {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-sm">State *</Label>
                        <Input
                          id="state"
                          value={profileData.address.state}
                          onChange={(e) => updateAddressField("state", e.target.value)}
                          placeholder="State"
                          className="h-10"
                        />
                        {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-sm">Country</Label>
                        <Input
                          id="country"
                          value={profileData.address.country}
                          disabled
                          className="h-10 bg-muted"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="addressType" className="text-sm">Address Type</Label>
                        <Select 
                          value={profileData.address.addressType} 
                          onValueChange={(value) => updateAddressField("addressType", value)}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="home">Home</SelectItem>
                            <SelectItem value="work">Work</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePreviousStep}
                        className="flex-1 h-11"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 h-11 text-base font-semibold"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          "Complete Profile"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}