import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_User from '@/models/SS_User';
import SS_Customer from '@/models/SS_Customer';
import { PasswordUtils, ApiResponse } from '@/lib/utils';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;

    console.log('🔐 Login attempt for:', email);

    // Find user by email
    const user = await SS_User.findOne({ SS_USER_EMAIL: email.toLowerCase() });
    if (!user) {
      console.log('❌ User not found:', email);
      return NextResponse.json(
        ApiResponse.error('Invalid email or password'),
        { status: 401 }
      );
    }

    // Check if account is locked
    if (user.SS_ACCOUNT_LOCKED && user.SS_ACCOUNT_LOCKED_UNTIL > new Date()) {
      console.log('❌ Account locked:', email);
      return NextResponse.json(
        ApiResponse.error('Account temporarily locked. Please try again after 30 minutes.'),
        { status: 423 }
      );
    }

    // Check user status
    if (user.SS_USER_STATUS !== 'active') {
      console.log('❌ User not active:', email);
      return NextResponse.json(
        ApiResponse.error('Your account is not active. Please contact support.'),
        { status: 403 }
      );
    }

    // Check if email is verified
    if (!user.SS_EMAIL_VERIFIED) {
      console.log('❌ Email not verified:', email);
      return NextResponse.json(
        ApiResponse.error('Please verify your email before logging in.'),
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await PasswordUtils.comparePassword(
      password, 
      user.SS_USER_PASSWORD
    );

    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email);
      
      // Increment login attempts
      const newAttempts = (user.SS_LOGIN_ATTEMPTS || 0) + 1;
      const shouldLock = newAttempts >= 5;
      
      await SS_User.findByIdAndUpdate(user._id, {
        SS_LOGIN_ATTEMPTS: newAttempts,
        SS_ACCOUNT_LOCKED: shouldLock,
        SS_ACCOUNT_LOCKED_UNTIL: shouldLock ? new Date(Date.now() + 30 * 60 * 1000) : null
      });

      const attemptsLeft = 5 - newAttempts;
      let message = 'Invalid email or password';
      if (attemptsLeft > 0 && attemptsLeft <= 3) {
        message += `. ${attemptsLeft} attempts remaining.`;
      }
      
      return NextResponse.json(
        ApiResponse.error(message),
        { status: 401 }
      );
    }

    // Reset login attempts on successful login
    await SS_User.findByIdAndUpdate(user._id, {
      SS_LOGIN_ATTEMPTS: 0,
      SS_ACCOUNT_LOCKED: false,
      SS_ACCOUNT_LOCKED_UNTIL: null,
      SS_MODIFIED_DATE: new Date()
    });

    // Get customer profile if exists
    const customerProfile = await SS_Customer.findOne({ SS_USER_ID: user._id });

    // Generate tokens
    const jwt = await import('jsonwebtoken');
    const userId = user._id.toString();
    
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
    await SS_User.findByIdAndUpdate(user._id, {
      SS_REFRESH_TOKEN: refreshToken
    });

    console.log('✅ Login successful for:', email);

    return NextResponse.json(
      ApiResponse.success(
        {
          user: {
            id: userId,
            email: user.SS_USER_EMAIL,
            role: user.SS_USER_ROLE,
            firstName: customerProfile?.SS_FIRST_NAME || null,
            lastName: customerProfile?.SS_LAST_NAME || null,
            mobileNumber: customerProfile?.SS_MOBILE_NUMBER || null,
            onboardingStatus: user.SS_ONBOARDING_STATUS
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: 24 * 60 * 60
          }
        },
        'Login successful'
      )
    );

  } catch (error) {
    console.error('❌ Login error:', error);

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