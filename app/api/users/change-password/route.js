// app/api/users/change-password/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_User from '@/models/SS_User';
import { PasswordUtils, ApiResponse } from '@/lib/utils';
import { z } from 'zod';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ["confirmPassword"],
});

export async function POST(request) {
  try {
    await dbConnect();
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        ApiResponse.error('Authentication required'),
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const jwt = await import('jsonwebtoken');
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verified for user:', decoded.userId);
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      return NextResponse.json(
        ApiResponse.error('Invalid token'),
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('📨 Request body received');
    
    const validatedData = changePasswordSchema.parse(body);
    const { currentPassword, newPassword } = validatedData;

    console.log('🔑 Changing password for user:', decoded.userId);

    // Get user with all fields
    const user = await SS_User.findById(decoded.userId);
    
    if (!user) {
      console.log('❌ User not found:', decoded.userId);
      return NextResponse.json(
        ApiResponse.error('User not found'),
        { status: 404 }
      );
    }

    // Debug user information
    console.log('👤 User details:', {
      id: user._id,
      email: user.SS_USER_EMAIL,
      authProvider: user.SS_AUTH_PROVIDER,
      hasPassword: !!user.SS_USER_PASSWORD,
      passwordLength: user.SS_USER_PASSWORD?.length,
      onboardingStatus: user.SS_ONBOARDING_STATUS
    });

    // Check if user has a password (social login users might not have one)
    if (!user.SS_USER_PASSWORD) {
      console.log('❌ User does not have a password set');
      return NextResponse.json(
        ApiResponse.error('Your account does not have a password set. Please use "Forgot Password" to set one.'),
        { status: 400 }
      );
    }

    // Check if user is using social login
    if (user.SS_AUTH_PROVIDER === 'google' && !user.SS_USER_PASSWORD) {
      console.log('❌ Google auth user trying to change password');
      return NextResponse.json(
        ApiResponse.error('Your account uses Google Sign-In. Please use Google to sign in or use "Forgot Password" to set a password.'),
        { status: 400 }
      );
    }

    console.log('🔍 Verifying current password...');
    
    // Verify current password with detailed logging
    const isCurrentPasswordValid = await PasswordUtils.comparePassword(
      currentPassword, 
      user.SS_USER_PASSWORD
    );

    console.log('✅ Password verification completed, result:', isCurrentPasswordValid);

    if (!isCurrentPasswordValid) {
      console.log('❌ Current password verification failed');
      return NextResponse.json(
        ApiResponse.error('The current password you entered is incorrect.'),
        { status: 401 }
      );
    }

    // Check if new password is same as current password
    const isSamePassword = await PasswordUtils.comparePassword(newPassword, user.SS_USER_PASSWORD);
    if (isSamePassword) {
      console.log('❌ New password is same as current password');
      return NextResponse.json(
        ApiResponse.error('New password cannot be the same as your current password.'),
        { status: 400 }
      );
    }

    // Hash new password
    console.log('🔐 Hashing new password...');
    const hashedPassword = await PasswordUtils.hashPassword(newPassword);

    // Update user password
    await SS_User.findByIdAndUpdate(decoded.userId, {
      SS_USER_PASSWORD: hashedPassword,
      SS_MODIFIED_DATE: new Date()
    });

    console.log('✅ Password changed successfully for user:', decoded.userId);

    return NextResponse.json(
      ApiResponse.success(
        null,
        'Password updated successfully! You can now use your new password to sign in.'
      )
    );

  } catch (error) {
    console.error('❌ Change password error:', error);

    if (error.name === 'ZodError') {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      console.log('❌ Validation errors:', errorMessages);
      return NextResponse.json(
        ApiResponse.validationError(error.errors),
        { status: 400 }
      );
    }

    return NextResponse.json(
      ApiResponse.error('An unexpected error occurred. Please try again later.'),
      { status: 500 }
    );
  }
}