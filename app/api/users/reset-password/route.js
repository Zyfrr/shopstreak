// app/api/users/reset-password/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_User from '@/models/SS_User';
import { PasswordUtils, ApiResponse } from '@/lib/utils';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  confirmPassword: z.string(),
  resetToken: z.string().optional() // Made optional for backward compatibility
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);
    const { email, newPassword, resetToken } = validatedData;

    console.log('🔄 Resetting password for:', email);

    // Check if user exists
    const user = await SS_User.findOne({ SS_USER_EMAIL: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        ApiResponse.error('Account not found. Please check your email address.'),
        { status: 400 }
      );
    }

    // Check if user account is active
    if (user.SS_USER_STATUS !== 'active') {
      return NextResponse.json(
        ApiResponse.error('Your account is not active. Please contact support for assistance.'),
        { status: 403 }
      );
    }

    // In production, you would verify the resetToken here
    // For now, we'll proceed if we have either a token or are in development
    if (process.env.NODE_ENV !== 'development' && !resetToken) {
      return NextResponse.json(
        ApiResponse.error('Reset token is required.'),
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await PasswordUtils.hashPassword(newPassword);

    // Update user password
    await SS_User.updateOne(
      { _id: user._id },
      { 
        SS_USER_PASSWORD: hashedPassword,
        SS_MODIFIED_DATE: new Date()
      }
    );

    console.log('✅ Password reset successfully for user:', email);

    return NextResponse.json(
      ApiResponse.success(
        null,
        'Password has been reset successfully! You can now login with your new password.'
      )
    );

  } catch (error) {
    console.error('❌ Reset password error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        ApiResponse.validationError(error.errors),
        { status: 400 }
      );
    }

    return NextResponse.json(
      ApiResponse.error('An unexpected error occurred. Please try again or contact support.'),
      { status: 500 }
    );
  }
}