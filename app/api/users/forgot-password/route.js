// app/api/users/forgot-password/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_User from '@/models/SS_User';
import SS_OTP from '@/models/SS_OTP';
import { EmailService } from '@/lib/emailService';
import { ApiResponse } from '@/lib/utils';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email address')
});

export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);
    const { email } = validatedData;

    console.log('📧 Forgot password request for:', email);

    // Check if user exists
    const user = await SS_User.findOne({ SS_USER_EMAIL: email.toLowerCase() });
    if (!user) {
      // Return success even if user doesn't exist (security best practice)
      return NextResponse.json(
        ApiResponse.success(
          null,
          'If an account exists with this email, you will receive a password reset OTP.'
        )
      );
    }

    // Check if user account is active
    if (user.SS_USER_STATUS !== 'active') {
      return NextResponse.json(
        ApiResponse.error('Your account is not active. Please contact support.'),
        { status: 403 }
      );
    }

    // Generate and send OTP
    const otp = await SS_OTP.createOTP(email, 'password_reset');
    console.log('✅ Password reset OTP generated:', otp);

    // Send email
    const emailResult = await EmailService.sendOTP(email, otp, 'password_reset');

    let message = 'If an account exists with this email, you will receive a password reset OTP.';
    const responseData = {};

    if (!emailResult.success) {
      console.log('⚠️ Email service unavailable:', emailResult.error);
      if (process.env.NODE_ENV === 'development') {
        message += ` Development OTP: ${otp}`;
        responseData.otp = otp;
      }
    }

    return NextResponse.json(
      ApiResponse.success(responseData, message)
    );

  } catch (error) {
    console.error('❌ Forgot password error:', error);

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

    return NextResponse.json(
      ApiResponse.error('Internal server error: ' + error.message),
      { status: 500 }
    );
  }
}