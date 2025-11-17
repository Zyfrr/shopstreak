// app/api/users/address/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_Customer from '@/models/SS_Customer';
import { ApiResponse } from '@/lib/utils';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

// Schema for address operations - FIXED: Use SS_ prefix
const addressSchema = z.object({
  addressId: z.string().optional(),
  SS_FULL_NAME: z.string().min(1, 'Full name is required').optional(),
  SS_MOBILE_NUMBER: z.string().min(10, 'Valid mobile number is required').optional(),
  SS_STREET_ADDRESS: z.string().min(1, 'Street address is required').optional(),
  SS_CITY: z.string().min(1, 'City is required').optional(),
  SS_STATE: z.string().min(1, 'State is required').optional(),
  SS_POSTAL_CODE: z.string().min(1, 'Postal code is required').optional(),
  SS_COUNTRY: z.string().default('India').optional(),
  SS_ADDRESS_TYPE: z.enum(['home', 'work', 'other']).default('home').optional(),
  SS_IS_DEFAULT: z.boolean().default(false).optional(),
  SS_IS_CURRENT: z.boolean().default(false).optional()
});

// Helper function to transform frontend data to backend format
function transformAddressData(body) {
  return {
    SS_FULL_NAME: body.fullName || body.SS_FULL_NAME,
    SS_MOBILE_NUMBER: body.mobileNumber || body.SS_MOBILE_NUMBER,
    SS_STREET_ADDRESS: body.streetAddress || body.SS_STREET_ADDRESS,
    SS_CITY: body.city || body.SS_CITY,
    SS_STATE: body.state || body.SS_STATE,
    SS_POSTAL_CODE: body.postalCode || body.SS_POSTAL_CODE,
    SS_COUNTRY: body.country || body.SS_COUNTRY || 'India',
    SS_ADDRESS_TYPE: body.addressType || body.SS_ADDRESS_TYPE || 'home',
    SS_IS_DEFAULT: body.isDefault !== undefined ? body.isDefault : (body.SS_IS_DEFAULT || false),
    SS_IS_CURRENT: body.isCurrent !== undefined ? body.isCurrent : (body.SS_IS_CURRENT || false)
  };
}

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

    const customerProfile = await SS_Customer.findOne({ SS_USER_ID: decoded.userId });
    
    if (!customerProfile) {
      return NextResponse.json(
        ApiResponse.error('Customer profile not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      ApiResponse.success({
        addresses: customerProfile.SS_ADDRESSES
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Address fetch error:', error);
    return NextResponse.json(
      ApiResponse.error('Unable to fetch addresses'),
      { status: 500 }
    );
  }
}

export async function POST(request) {
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

    const body = await request.json();
    
    // Transform frontend data to backend format
    const transformedData = transformAddressData(body);
    
    // Validate the transformed data
    const validatedData = addressSchema.parse(transformedData);

    const customerProfile = await SS_Customer.findOne({ SS_USER_ID: decoded.userId });
    
    if (!customerProfile) {
      return NextResponse.json(
        ApiResponse.error('Customer profile not found'),
        { status: 404 }
      );
    }

    const newAddress = {
      _id: new ObjectId(),
      SS_ADDRESS_TYPE: validatedData.SS_ADDRESS_TYPE,
      SS_FULL_NAME: validatedData.SS_FULL_NAME,
      SS_MOBILE_NUMBER: validatedData.SS_MOBILE_NUMBER,
      SS_STREET_ADDRESS: validatedData.SS_STREET_ADDRESS,
      SS_CITY: validatedData.SS_CITY,
      SS_STATE: validatedData.SS_STATE,
      SS_POSTAL_CODE: validatedData.SS_POSTAL_CODE,
      SS_COUNTRY: validatedData.SS_COUNTRY,
      SS_IS_DEFAULT: validatedData.SS_IS_DEFAULT,
      SS_IS_CURRENT: customerProfile.SS_ADDRESSES.length === 0 // Set as current if first address
    };

    // If setting as default, remove default from other addresses
    if (validatedData.SS_IS_DEFAULT) {
      customerProfile.SS_ADDRESSES.forEach(addr => {
        addr.SS_IS_DEFAULT = false;
      });
    }

    // If this is the first address or setting as current, remove current from others
    if (newAddress.SS_IS_CURRENT) {
      customerProfile.SS_ADDRESSES.forEach(addr => {
        addr.SS_IS_CURRENT = false;
      });
    }

    customerProfile.SS_ADDRESSES.push(newAddress);
    await customerProfile.save();

    return NextResponse.json(
      ApiResponse.success({
        address: newAddress
      }, 'Address added successfully'),
      { status: 201 }
    );

  } catch (error) {
    console.error('❌ Address creation error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        ApiResponse.validationError(error.errors),
        { status: 400 }
      );
    }

    return NextResponse.json(
      ApiResponse.error('Unable to add address'),
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
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

    const body = await request.json();
    const { addressId, ...updateData } = body;

    if (!addressId) {
      return NextResponse.json(
        ApiResponse.error('Address ID is required'),
        { status: 400 }
      );
    }

    // Transform frontend data to backend format
    const transformedData = transformAddressData(updateData);
    
    // Validate the transformed data
    const validatedUpdates = addressSchema.partial().parse(transformedData);

    const customerProfile = await SS_Customer.findOne({ SS_USER_ID: decoded.userId });
    
    if (!customerProfile) {
      return NextResponse.json(
        ApiResponse.error('Customer profile not found'),
        { status: 404 }
      );
    }

    const addressIndex = customerProfile.SS_ADDRESSES.findIndex(
      addr => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return NextResponse.json(
        ApiResponse.error('Address not found'),
        { status: 404 }
      );
    }

    // Handle current address update
    if (validatedUpdates.SS_IS_CURRENT !== undefined) {
      // If setting as current, remove current from all other addresses
      if (validatedUpdates.SS_IS_CURRENT) {
        customerProfile.SS_ADDRESSES.forEach((addr, index) => {
          addr.SS_IS_CURRENT = index === addressIndex;
        });
      }
    }

    // Handle default address update
    if (validatedUpdates.SS_IS_DEFAULT !== undefined && validatedUpdates.SS_IS_DEFAULT) {
      customerProfile.SS_ADDRESSES.forEach((addr, index) => {
        if (index !== addressIndex) {
          addr.SS_IS_DEFAULT = false;
        }
      });
    }

    // Update address fields
    Object.keys(validatedUpdates).forEach(key => {
      if (validatedUpdates[key] !== undefined) {
        customerProfile.SS_ADDRESSES[addressIndex][key] = validatedUpdates[key];
      }
    });

    await customerProfile.save();

    return NextResponse.json(
      ApiResponse.success({
        address: customerProfile.SS_ADDRESSES[addressIndex]
      }, 'Address updated successfully'),
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Address update error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        ApiResponse.validationError(error.errors),
        { status: 400 }
      );
    }

    return NextResponse.json(
      ApiResponse.error('Unable to update address'),
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
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

    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get('addressId');

    if (!addressId) {
      return NextResponse.json(
        ApiResponse.error('Address ID is required'),
        { status: 400 }
      );
    }

    const customerProfile = await SS_Customer.findOne({ SS_USER_ID: decoded.userId });
    
    if (!customerProfile) {
      return NextResponse.json(
        ApiResponse.error('Customer profile not found'),
        { status: 404 }
      );
    }

    const addressIndex = customerProfile.SS_ADDRESSES.findIndex(
      addr => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return NextResponse.json(
        ApiResponse.error('Address not found'),
        { status: 404 }
      );
    }

    // Check if this is the only address
    if (customerProfile.SS_ADDRESSES.length === 1) {
      return NextResponse.json(
        ApiResponse.error('Cannot delete the only address'),
        { status: 400 }
      );
    }

    const deletedAddress = customerProfile.SS_ADDRESSES.splice(addressIndex, 1)[0];
    
    // If deleted address was current, set another address as current
    if (deletedAddress.SS_IS_CURRENT && customerProfile.SS_ADDRESSES.length > 0) {
      customerProfile.SS_ADDRESSES[0].SS_IS_CURRENT = true;
    }

    await customerProfile.save();

    return NextResponse.json(
      ApiResponse.success({
        deletedAddress
      }, 'Address deleted successfully'),
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Address deletion error:', error);
    return NextResponse.json(
      ApiResponse.error('Unable to delete address'),
      { status: 500 }
    );
  }
}