// app/api/users/profile/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_User from '@/models/SS_User';
import SS_Customer from '@/models/SS_Customer';
import { ApiResponse } from '@/lib/utils';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

// Schema for profile creation
const profileCreateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  mobileNumber: z.string()
    .min(10, 'Valid mobile number is required')
    .max(15, 'Mobile number too long')
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid Indian mobile number'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  address: z.object({
    streetAddress: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().default('India'),
    addressType: z.enum(['home', 'work', 'other']).default('home'),
    isDefault: z.boolean().default(true)
  })
});

// Enhanced JWT verification function
const verifyToken = async (token) => {
  try {
    const jwt = await import('jsonwebtoken');
    
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not defined');
      throw new Error('JWT_SECRET missing');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified for user:', decoded.userId);
    return decoded;
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    throw error;
  }
};

// POST - Create profile (for profile setup)
export async function POST(request) {
  try {
    await dbConnect();
    
    console.log('🔍 Profile creation request received');
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    console.log('🔍 Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No auth header or invalid format');
      return NextResponse.json(
        ApiResponse.error('Authentication required'),
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    console.log('🔍 Token length:', token.length);

    let decoded;
    try {
      decoded = await verifyToken(token);
    } catch (error) {
      console.error('❌ Token verification error:', error.message);
      return NextResponse.json(
        ApiResponse.error('Invalid or expired token'),
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('🔍 Request body received');

    // Validate request data
    const validatedData = profileCreateSchema.parse(body);
    console.log('✅ Data validation passed');

    console.log('🔄 Creating profile for user:', decoded.userId);

    // Check if user exists
    const user = await SS_User.findById(decoded.userId);
    if (!user) {
      console.log('❌ User not found:', decoded.userId);
      return NextResponse.json(
        ApiResponse.error('User not found'),
        { status: 404 }
      );
    }

    console.log('✅ User found:', user.SS_USER_EMAIL);

    // Check if customer profile already exists
    const existingProfile = await SS_Customer.findOne({ SS_USER_ID: decoded.userId });
    if (existingProfile) {
      console.log('❌ Profile already exists for user:', decoded.userId);
      return NextResponse.json(
        ApiResponse.error('Profile already exists. Use PATCH to update.'),
        { status: 400 }
      );
    }

    // Check if mobile number is already taken
    const existingMobile = await SS_Customer.findOne({ 
      SS_MOBILE_NUMBER: validatedData.mobileNumber 
    });

    if (existingMobile) {
      console.log('❌ Mobile number already exists:', validatedData.mobileNumber);
      return NextResponse.json(
        ApiResponse.error('Mobile number already registered with another account'),
        { status: 409 }
      );
    }

    // Create customer profile
    const customerProfile = new SS_Customer({
      SS_USER_ID: decoded.userId,
      SS_FIRST_NAME: validatedData.firstName,
      SS_LAST_NAME: validatedData.lastName,
      SS_MOBILE_NUMBER: validatedData.mobileNumber,
      SS_GENDER: validatedData.gender || 'prefer_not_to_say',
      SS_PROFILE_COMPLETED_DATE: new Date(),
      SS_LAST_PROFILE_UPDATE: new Date()
    });

    // Add address
    const newAddress = {
      _id: new ObjectId(),
      SS_ADDRESS_TYPE: validatedData.address.addressType,
      SS_FULL_NAME: `${validatedData.firstName} ${validatedData.lastName}`,
      SS_MOBILE_NUMBER: validatedData.mobileNumber,
      SS_STREET_ADDRESS: validatedData.address.streetAddress,
      SS_CITY: validatedData.address.city,
      SS_STATE: validatedData.address.state,
      SS_POSTAL_CODE: validatedData.address.postalCode,
      SS_COUNTRY: validatedData.address.country,
      SS_IS_DEFAULT: true
    };

    customerProfile.SS_ADDRESSES.push(newAddress);
    await customerProfile.save();

    // Update user onboarding status
    await SS_User.findByIdAndUpdate(decoded.userId, {
      SS_ONBOARDING_STATUS: 'completed',
      SS_MODIFIED_DATE: new Date()
    });

    console.log('✅ Profile created successfully for user:', decoded.userId);

    return NextResponse.json(
      ApiResponse.success({
        user: {
          id: decoded.userId,
          email: user.SS_USER_EMAIL,
          role: user.SS_USER_ROLE,
          onboardingStatus: 'completed',
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          mobileNumber: validatedData.mobileNumber
        },
        profile: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          mobileNumber: validatedData.mobileNumber,
          gender: validatedData.gender,
          addresses: customerProfile.SS_ADDRESSES
        }
      }, 'Profile completed successfully'),
      { status: 201 }
    );

  } catch (error) {
    console.error('❌ Profile creation error:', error);

    if (error.name === 'ZodError') {
      console.error('Validation errors:', error.errors);
      return NextResponse.json(
        ApiResponse.validationError(error.errors),
        { status: 400 }
      );
    }

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        ApiResponse.error('Invalid token'),
        { status: 401 }
      );
    }

    if (error.name === 'TokenExpiredError') {
      return NextResponse.json(
        ApiResponse.error('Token expired'),
        { status: 401 }
      );
    }

    return NextResponse.json(
      ApiResponse.error('Unable to save profile. Please try again.'),
      { status: 500 }
    );
  }
}

// GET profile data - Enhanced with better error handling
export async function GET(request) {
  try {
    await dbConnect();
    
    console.log('🔍 Profile GET request received');
    
    const authHeader = request.headers.get('authorization');
    console.log('🔍 Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid auth header');
      return NextResponse.json(
        ApiResponse.error('Authentication required'),
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    console.log('🔍 Token extracted, length:', token.length);

    let decoded;
    try {
      decoded = await verifyToken(token);
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      return NextResponse.json(
        ApiResponse.error('Invalid or expired token'),
        { status: 401 }
      );
    }

    console.log('🔄 Fetching profile for user:', decoded.userId);

    // Get user and customer profile
    const user = await SS_User.findById(decoded.userId);
    const customerProfile = await SS_Customer.findOne({ SS_USER_ID: decoded.userId });

    if (!user) {
      console.log('❌ User not found:', decoded.userId);
      return NextResponse.json(
        ApiResponse.error('User not found'),
        { status: 404 }
      );
    }

    console.log('✅ User found:', user.SS_USER_EMAIL);

    const responseData = {
      user: {
        id: user._id,
        email: user.SS_USER_EMAIL,
        role: user.SS_USER_ROLE,
        onboardingStatus: user.SS_ONBOARDING_STATUS,
        createdAt: user.SS_CREATED_DATE
      }
    };

    if (customerProfile) {
      responseData.profile = {
        firstName: customerProfile.SS_FIRST_NAME,
        lastName: customerProfile.SS_LAST_NAME,
        mobileNumber: customerProfile.SS_MOBILE_NUMBER,
        gender: customerProfile.SS_GENDER,
        dateOfBirth: customerProfile.SS_DATE_OF_BIRTH,
        addresses: customerProfile.SS_ADDRESSES
      };
      console.log('✅ Customer profile found');
    } else {
      console.log('ℹ️ No customer profile found for user');
    }

    return NextResponse.json(
      ApiResponse.success(responseData),
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    return NextResponse.json(
      ApiResponse.error('Unable to fetch profile data'),
      { status: 500 }
    );
  }
}