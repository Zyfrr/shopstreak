import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_User from '@/models/SS_User';
import { PasswordUtils, ApiResponse } from '@/lib/utils';
import { z } from 'zod';

const setPasswordSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const validatedData = setPasswordSchema.parse(body);
    const { email, password } = validatedData;

    console.log('🔑 Setting password for user:', email);

    // Verify user exists - FIND BY EMAIL, NOT ID
    const user = await SS_User.findOne({ SS_USER_EMAIL: email });
    if (!user) {
      return NextResponse.json(
        ApiResponse.error('User not found'),
        { status: 404 }
      );
    }

    // Hash password
    const hashedPassword = await PasswordUtils.hashPassword(password);

    // Update user - USE USER._id FROM THE FOUND USER
    await SS_User.findByIdAndUpdate(user._id, {
      SS_USER_PASSWORD: hashedPassword,
      SS_MODIFIED_DATE: new Date()
    });

    console.log('✅ Password created successfully for:', email);

    // Generate login token
    const jwt = await import('jsonwebtoken');
    const accessToken = jwt.sign(
      {
        userId: user._id,
        email: user.SS_USER_EMAIL,
        role: user.SS_USER_ROLE
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return success response
    return NextResponse.json(
      ApiResponse.success(
        { 
          userId: user._id,
          accessToken,
          user: {
            id: user._id,
            email: user.SS_USER_EMAIL,
            role: user.SS_USER_ROLE,
            onboardingStatus: user.SS_ONBOARDING_STATUS
          }
        },
        'Password created successfully!'
      )
    );

  } catch (error) {
    console.error('❌ Set password error:', error);

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