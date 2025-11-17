// app/api/users/resend-otp/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_OTP from '@/models/SS_OTP';
import SS_User from '@/models/SS_User';
import { EmailService } from '@/lib/emailService';
import { ApiResponse } from '@/lib/utils';
import { z } from 'zod';

const resendOTPSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  type: z.enum(['email_verification', 'password_reset']).default('email_verification')
});

export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const validatedData = resendOTPSchema.parse(body);
    const { email, type } = validatedData;

    console.log('🔄 Resending OTP for:', email, 'type:', type);

    // Verify user exists for email verification
    if (type === 'email_verification') {
      const user = await SS_User.findOne({ SS_USER_EMAIL: email.toLowerCase() });
      if (!user) {
        return NextResponse.json(
          ApiResponse.error('User not found with this email'),
          { status: 404 }
        );
      }
    }

    // Generate new OTP
    const otp = await SS_OTP.createOTP(email, type);
    console.log('✅ New OTP generated:', otp);

    // Send OTP email
    const emailResult = await EmailService.sendOTP(email, otp, type, true);

    let message = 'OTP sent successfully to your email';
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
    console.error('❌ Resend OTP error:', error);

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