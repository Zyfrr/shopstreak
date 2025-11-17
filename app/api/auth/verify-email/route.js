// app/api/auth/verify-email/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_User from '@/models/SS_User';
import SS_Customer from '@/models/SS_Customer';
import SS_OTP from '@/models/SS_OTP';
import { ApiResponse } from '@/lib/utils';
import { z } from 'zod';

const verifyEmailSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  email: z.string().email('Please provide a valid email address'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits')
});

export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const validatedData = verifyEmailSchema.parse(body);
    const { userId, email, otp } = validatedData;

    console.log('🔐 Verifying email for user:', userId);

    // Verify user exists
    const user = await SS_User.findById(userId);
    if (!user) {
      return NextResponse.json(
        ApiResponse.error('User account not found. Please start the signup process again.'),
        { status: 404 }
      );
    }

    if (user.SS_USER_EMAIL !== email.toLowerCase()) {
      return NextResponse.json(
        ApiResponse.error('Email does not match the account record.'),
        { status: 400 }
      );
    }

    // Verify OTP
    const otpResult = await SS_OTP.verifyOTP(email, otp, 'email_verification');
    if (!otpResult.success) {
      return NextResponse.json(
        ApiResponse.error(otpResult.message),
        { status: 400 }
      );
    }

    console.log('✅ OTP verified successfully');

    // Check if customer profile exists
    const customerProfile = await SS_Customer.findOne({ SS_USER_ID: userId });
    
    let onboardingStatus = 'completed';
    
    // If no customer profile exists, user needs to complete profile setup
    if (!customerProfile) {
      onboardingStatus = 'profile_setup';
      console.log('📋 User needs profile setup');
    }

    // Update user - mark email as verified and set appropriate onboarding status
    await SS_User.findByIdAndUpdate(userId, {
      SS_EMAIL_VERIFIED: true,
      SS_ONBOARDING_STATUS: onboardingStatus,
      SS_MODIFIED_DATE: new Date()
    });

    console.log('✅ User email verified. Onboarding status:', onboardingStatus);

    // Generate tokens for immediate login
    const jwt = await import('jsonwebtoken');
    
    const accessToken = jwt.sign(
      {
        userId: userId,
        email: user.SS_USER_EMAIL,
        role: user.SS_USER_ROLE
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      {
        userId: userId,
        type: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Store refresh token
    await SS_User.findByIdAndUpdate(userId, {
      SS_REFRESH_TOKEN: refreshToken
    });

    return NextResponse.json(
      ApiResponse.success(
        {
          userId,
          user: {
            id: userId,
            email: user.SS_USER_EMAIL,
            role: user.SS_USER_ROLE,
            onboardingStatus: onboardingStatus,
            needsProfileSetup: !customerProfile
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: 24 * 60 * 60
          }
        },
        onboardingStatus === 'profile_setup' 
          ? 'Email verified! Please complete your profile.' 
          : 'Email verified successfully!'
      )
    );

  } catch (error) {
    console.error('❌ Email verification error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        ApiResponse.validationError(error.errors),
        { status: 400 }
      );
    }

    if (error.name === 'CastError') {
      return NextResponse.json(
        ApiResponse.error('Invalid user ID format.'),
        { status: 400 }
      );
    }

    return NextResponse.json(
      ApiResponse.error('Unable to verify email. Please try again.'),
      { status: 500 }
    );
  }
}