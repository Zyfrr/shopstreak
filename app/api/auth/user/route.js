// app/api/auth/user/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_User from '@/models/SS_User';
import SS_Customer from '@/models/SS_Customer';
import { ApiResponse } from '@/lib/utils';

export async function GET(request) {
  try {
    await dbConnect();
    
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
    } catch (error) {
      return NextResponse.json(
        ApiResponse.error('Invalid token'),
        { status: 401 }
      );
    }

    // Get user with password field for status check
    const user = await SS_User.findById(decoded.userId).select('+SS_USER_PASSWORD');
    const customerProfile = await SS_Customer.findOne({ SS_USER_ID: decoded.userId });

    if (!user) {
      return NextResponse.json(
        ApiResponse.error('User not found'),
        { status: 404 }
      );
    }

    // Check if user has password
    const hasPassword = user.SS_USER_PASSWORD && 
                       user.SS_USER_PASSWORD.trim() !== "" && 
                       user.SS_USER_PASSWORD !== "exists" &&
                       (user.SS_USER_PASSWORD.startsWith('$2b$') || user.SS_USER_PASSWORD.length > 10);

    const responseData = {
      user: {
        id: user._id,
        email: user.SS_USER_EMAIL,
        role: user.SS_USER_ROLE,
        onboardingStatus: user.SS_ONBOARDING_STATUS,
        authProvider: user.SS_AUTH_PROVIDER,
        emailVerified: user.SS_EMAIL_VERIFIED || false,
        createdAt: user.SS_CREATED_DATE,
        hasPassword
      }
    };

    if (customerProfile) {
      responseData.customerProfile = {
        firstName: customerProfile.SS_FIRST_NAME,
        lastName: customerProfile.SS_LAST_NAME,
        mobileNumber: customerProfile.SS_MOBILE_NUMBER,
        gender: customerProfile.SS_GENDER,
        dateOfBirth: customerProfile.SS_DATE_OF_BIRTH,
        addresses: customerProfile.SS_ADDRESSES
      };
    }

    return NextResponse.json(
      ApiResponse.success(responseData),
      { status: 200 }
    );

  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      ApiResponse.error('Unable to fetch user data'),
      { status: 500 }
    );
  }
}