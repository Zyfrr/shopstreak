// app/api/auth/logout/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_User from '@/models/SS_User';
import { ApiResponse } from '@/lib/utils';

export async function POST(request) {
  try {
    await dbConnect();
    
    const authHeader = request.headers.get('authorization');
    
    // If no auth header, still allow logout (clear client-side data)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        ApiResponse.success(null, 'Logged out successfully')
      );
    }

    const token = authHeader.substring(7);
    const jwt = await import('jsonwebtoken');
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Revoke refresh token if user exists
      await SS_User.updateOne(
        { _id: decoded.userId },
        { SS_REFRESH_TOKEN: null }
      );

      console.log('✅ User logged out:', decoded.userId);
    } catch (tokenError) {
      // Token is invalid/expired, but still allow logout
      console.log('⚠️ Token invalid during logout, proceeding...');
    }

    return NextResponse.json(
      ApiResponse.success(null, 'Logged out successfully')
    );

  } catch (error) {
    console.error('❌ Logout error:', error);
    return NextResponse.json(
      ApiResponse.success(null, 'Logged out successfully')
    );
  }
}