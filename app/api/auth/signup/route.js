import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_User from '@/models/SS_User';
import SS_OTP from '@/models/SS_OTP';
import { EmailService } from '@/lib/emailService';
import { ApiResponse } from '@/lib/utils';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.string().email('Please provide a valid email address')
});

export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const validatedData = emailSchema.parse(body);
    const { email } = validatedData;

    console.log('📧 Init signup for:', email);

    // Check if user already exists
    const existingUser = await SS_User.findOne({ SS_USER_EMAIL: email.toLowerCase() });
    let userId;

    if (existingUser) {
      // If user exists but hasn't completed onboarding, allow resuming
      if (existingUser.SS_ONBOARDING_STATUS !== 'completed') {
        userId = existingUser._id.toString();
        console.log('🔄 Resuming onboarding for existing user:', userId);
      } else {
        return NextResponse.json(
          ApiResponse.error('An account with this email already exists. Please sign in instead.'),
          { status: 409 }
        );
      }
    } else {
      // Create new user without password (will be set later)
      const user = new SS_User({
        SS_USER_EMAIL: email.toLowerCase(),
        SS_AUTH_PROVIDER: 'email',
        SS_ONBOARDING_STATUS: 'pending',
        SS_EMAIL_VERIFIED: false,
        SS_USER_ROLE: 'customer',
        SS_USER_STATUS: 'active'
      });

      await user.save();
      userId = user._id.toString();
      console.log('✅ User created with ID:', userId);
    }

    // Generate and send OTP
    const otp = await SS_OTP.createOTP(email, 'email_verification');
    console.log('✅ OTP generated:', otp);

    // Send verification email
    const emailResult = await EmailService.sendOTP(email, otp, 'email_verification');

    let message = 'Verification code sent to your email.';
    let responseData = { 
      userId,
      onboardingStatus: 'pending',
      email: email
    };

    // Include OTP in development mode for testing
    if (emailResult.development || process.env.NODE_ENV === 'development') {
      responseData.otp = otp;
      if (emailResult.development) {
        message += ' (Development mode - check console for OTP)';
      }
    }

    if (!emailResult.success && !emailResult.development) {
      console.log('⚠️ Email service issue:', emailResult.error);
      // Still continue with signup process
      responseData.otp = otp;
      message += ' (Email service temporarily unavailable - use development OTP)';
    }

    console.log('✅ Signup process completed for:', email);

    return NextResponse.json(
      ApiResponse.success(responseData, message),
      { status: 201 }
    );

  } catch (error) {
    console.error('❌ Signup error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        ApiResponse.validationError(error.errors),
        { status: 400 }
      );
    }

    if (error.message.includes('Please wait')) {
      return NextResponse.json(
        ApiResponse.error(error.message),
        { status: 429 }
      );
    }

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        ApiResponse.error('An account with this email already exists.'),
        { status: 409 }
      );
    }

    return NextResponse.json(
      ApiResponse.error('Unable to process signup request. Please try again.'),
      { status: 500 }
    );
  }
}