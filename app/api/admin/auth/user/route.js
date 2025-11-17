// app/api/admin/auth/user/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_User from '@/models/SS_User';
import SS_Admin from '@/models/SS_Admin';
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

    // Verify this is an admin token
    if (decoded.type !== 'admin') {
      return NextResponse.json(
        ApiResponse.error('Admin access required'),
        { status: 403 }
      );
    }

    // Get user and admin data
    const user = await SS_User.findById(decoded.userId);
    const admin = await SS_Admin.findOne({ SS_USER_ID: decoded.userId });

    if (!user || !admin) {
      return NextResponse.json(
        ApiResponse.error('Admin user not found'),
        { status: 404 }
      );
    }

    const responseData = {
      user: {
        id: user._id,
        email: user.SS_USER_EMAIL,
        role: 'admin',
        authProvider: user.SS_AUTH_PROVIDER,
        emailVerified: user.SS_EMAIL_VERIFIED,
        createdAt: user.SS_CREATED_DATE,
      },
      admin: {
        role: admin.SS_ADMIN_ROLE,
        permissions: admin.SS_PERMISSIONS,
        lastLogin: admin.SS_LAST_LOGIN,
        activeStatus: admin.SS_ACTIVE_STATUS
      }
    };

    return NextResponse.json(
      ApiResponse.success(responseData),
      { status: 200 }
    );

  } catch (error) {
    console.error('Admin user fetch error:', error);
    return NextResponse.json(
      ApiResponse.error('Unable to fetch admin data'),
      { status: 500 }
    );
  }
}