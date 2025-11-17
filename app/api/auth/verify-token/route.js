// app/api/auth/verify-token/route.js
import { NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/utils';
import jwt from 'jsonwebtoken';
import SS_User from '@/models/SS_User';
import dbConnect from '@/lib/dbConnect';

export async function GET(request) {
  try {
    await dbConnect();
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        ApiResponse.error('Token required'),
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists
    const user = await SS_User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        ApiResponse.error('User not found'),
        { status: 401 }
      );
    }

    return NextResponse.json(
      ApiResponse.success(
        {
          user: {
            id: user._id.toString(),
            email: user.SS_USER_EMAIL,
            role: user.SS_USER_ROLE,
            onboardingStatus: user.SS_ONBOARDING_STATUS
          }
        },
        'Token is valid'
      )
    );

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      ApiResponse.error('Invalid token'),
      { status: 401 }
    );
  }
}