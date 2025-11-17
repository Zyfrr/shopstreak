// app/api/users/reset-password-otp-verify/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_OTP from '@/models/SS_OTP';
import { ApiResponse } from '@/lib/utils';
import { z } from 'zod';
import crypto from 'crypto';

const verifyResetOTPSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits')
});

export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const validatedData = verifyResetOTPSchema.parse(body);
    const { email, otp } = validatedData;

    console.log('🔍 Verifying OTP for password reset:', { email, otp });

    // Verify OTP
    const otpVerification = await SS_OTP.verifyOTP(email, otp, 'password_reset');
    
    if (!otpVerification.success) {
      console.log('❌ Invalid OTP for password reset:', otpVerification.message);
      return NextResponse.json(
        ApiResponse.error(otpVerification.message),
        { status: 400 }
      );
    }

    console.log('✅ OTP verified successfully for password reset');

    // Generate reset token (for enhanced security)
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // In a real application, you would store this token in the database with an expiry
    // For now, we'll return it directly

    return NextResponse.json(
      ApiResponse.success(
        { 
          resetToken,
          message: 'OTP verified successfully'
        },
        'OTP verified successfully. You can now reset your password.'
      )
    );

  } catch (error) {
    console.error('❌ OTP verification error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        ApiResponse.validationError(error.errors),
        { status: 400 }
      );
    }

    return NextResponse.json(
      ApiResponse.error('Internal server error: ' + error.message),
      { status: 500 }
    );
  }
}