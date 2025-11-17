import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_User from '@/models/SS_User';
import SS_Customer from '@/models/SS_Customer';
import SS_Order from '@/models/SS_Order';
import SS_Product from '@/models/SS_Product';
import SS_Review from '@/models/SS_Review';
import mongoose from 'mongoose';
import { verifyAdmin } from '@/middleware/admin-auth';

// GET single customer details with complete data
export async function GET(request, { params }) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = await params;

    console.log('👤 Fetching customer details for:', id);

    // Get user data
    const user = await SS_User.findById(id)
      .select('SS_USER_EMAIL SS_USER_STATUS SS_CREATED_DATE SS_ONBOARDING_STATUS SS_COMMUNICATION_PREF')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get customer profile
    const customerProfile = await SS_Customer.findOne({ SS_USER_ID: id }).lean();

    // Get all customer orders with product details
    const orders = await SS_Order.find({ SS_CUSTOMER_ID: id })
      .populate({
        path: 'SS_ORDER_ITEMS.SS_PRODUCT_ID',
        model: SS_Product,
        select: 'SS_CUSTOMER_VISIBLE.SS_PRODUCT_TITLE SS_CUSTOMER_VISIBLE.SS_MAIN_IMAGE'
      })
      .sort({ SS_CREATED_DATE: -1 })
      .lean();

    // Get customer reviews
    const reviews = await SS_Review.find({ SS_USER_ID: id })
      .populate({
        path: 'SS_PRODUCT_ID',
        model: SS_Product,
        select: 'SS_CUSTOMER_VISIBLE.SS_PRODUCT_TITLE SS_CUSTOMER_VISIBLE.SS_MAIN_IMAGE'
      })
      .sort({ SS_CREATED_DATE: -1 })
      .lean();

    // Calculate comprehensive stats
    const totalOrders = orders.length;
    const totalSpent = orders
      .filter(order => order.SS_PAYMENT_STATUS === 'paid')
      .reduce((sum, order) => sum + (order.SS_ORDER_SUMMARY?.SS_TOTAL_AMOUNT || 0), 0);

    const successfulOrders = orders.filter(order => 
      order.SS_ORDER_STATUS === 'delivered' && order.SS_PAYMENT_STATUS === 'paid'
    ).length;

    const pendingOrders = orders.filter(order => 
      ['pending', 'confirmed', 'processing', 'shipped'].includes(order.SS_ORDER_STATUS)
    ).length;

    const cancelledOrders = orders.filter(order => 
      order.SS_ORDER_STATUS === 'cancelled'
    ).length;

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Get favorite categories - FIXED: Use mongoose.Types.ObjectId properly
    let categoryStats = [];
    try {
      categoryStats = await SS_Order.aggregate([
        { $match: { SS_CUSTOMER_ID: new mongoose.Types.ObjectId(id) } },
        { $unwind: '$SS_ORDER_ITEMS' },
        {
          $lookup: {
            from: 'ss_products',
            localField: 'SS_ORDER_ITEMS.SS_PRODUCT_ID',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $lookup: {
            from: 'ss_categories',
            localField: 'product.SS_ADMIN_VISIBLE.SS_CATEGORY',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: '$category' },
        {
          $group: {
            _id: '$category.SS_CATEGORY_NAME',
            totalSpent: { $sum: '$SS_ORDER_ITEMS.SS_TOTAL_PRICE' },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 5 }
      ]);
    } catch (categoryError) {
      console.error('Error fetching category stats:', categoryError.message);
      // Continue without category stats
    }

    // Monthly spending analysis - FIXED: Use mongoose.Types.ObjectId properly
    let monthlySpending = [];
    try {
      monthlySpending = await SS_Order.aggregate([
        { 
          $match: { 
            SS_CUSTOMER_ID: new mongoose.Types.ObjectId(id),
            SS_PAYMENT_STATUS: 'paid'
          } 
        },
        {
          $group: {
            _id: {
              year: { $year: '$SS_CREATED_DATE' },
              month: { $month: '$SS_CREATED_DATE' }
            },
            totalSpent: { $sum: '$SS_ORDER_SUMMARY.SS_TOTAL_AMOUNT' },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ]);
    } catch (monthlyError) {
      console.error('Error fetching monthly spending:', monthlyError.message);
      // Continue without monthly spending data
    }

    const transformedCustomer = {
      id: user._id.toString(),
      email: user.SS_USER_EMAIL,
      status: user.SS_USER_STATUS,
      joinDate: user.SS_CREATED_DATE,
      onboardingStatus: user.SS_ONBOARDING_STATUS,
      communicationPreferences: user.SS_COMMUNICATION_PREF || {
        email: true,
        sms: false,
        push: true
      },
      profile: customerProfile ? {
        firstName: customerProfile.SS_FIRST_NAME,
        lastName: customerProfile.SS_LAST_NAME,
        fullName: `${customerProfile.SS_FIRST_NAME || ''} ${customerProfile.SS_LAST_NAME || ''}`.trim(),
        mobile: customerProfile.SS_MOBILE_NUMBER,
        gender: customerProfile.SS_GENDER,
        dateOfBirth: customerProfile.SS_DATE_OF_BIRTH,
        addresses: customerProfile.SS_ADDRESSES || [],
        profileCompleted: !!customerProfile.SS_PROFILE_COMPLETED_DATE,
        lastProfileUpdate: customerProfile.SS_LAST_PROFILE_UPDATE
      } : null,
      stats: {
        totalOrders,
        totalSpent,
        successfulOrders,
        pendingOrders,
        cancelledOrders,
        averageOrderValue,
        totalReviews: reviews.length,
        averageRating: reviews.length > 0 
          ? reviews.reduce((sum, review) => sum + review.SS_RATING, 0) / reviews.length 
          : 0
      },
      orders: orders.map(order => ({
        id: order._id.toString(),
        orderNumber: order.SS_ORDER_NUMBER,
        date: order.SS_CREATED_DATE,
        status: order.SS_ORDER_STATUS,
        paymentStatus: order.SS_PAYMENT_STATUS,
        totalAmount: order.SS_ORDER_SUMMARY?.SS_TOTAL_AMOUNT || 0,
        items: order.SS_ORDER_ITEMS?.map(item => ({
          id: item.SS_PRODUCT_ID?._id?.toString(),
          name: item.SS_PRODUCT_NAME || 'Unknown Product',
          price: item.SS_UNIT_PRICE || 0,
          quantity: item.SS_QUANTITY || 0,
          image: item.SS_PRODUCT_IMAGE || '/placeholder-image.jpg',
          total: item.SS_TOTAL_PRICE || 0
        })) || []
      })),
      reviews: reviews.map(review => ({
        id: review._id.toString(),
        productId: review.SS_PRODUCT_ID?._id?.toString(),
        productName: review.SS_PRODUCT_ID?.SS_CUSTOMER_VISIBLE?.SS_PRODUCT_TITLE || 'Unknown Product',
        rating: review.SS_RATING,
        title: review.SS_REVIEW_TITLE,
        description: review.SS_REVIEW_DESCRIPTION,
        date: review.SS_CREATED_DATE,
        helpfulCount: review.SS_HELPFUL_COUNT,
        isVerified: review.SS_IS_VERIFIED_PURCHASE
      })),
      analytics: {
        favoriteCategories: categoryStats,
        monthlySpending: monthlySpending.map(month => ({
          period: `${month._id.year}-${month._id.month.toString().padStart(2, '0')}`,
          totalSpent: month.totalSpent,
          orderCount: month.orderCount
        }))
      }
    };

    console.log('👤 Customer details fetched successfully:', transformedCustomer.email);

    return NextResponse.json({
      success: true,
      data: {
        customer: transformedCustomer
      }
    });

  } catch (error) {
    console.error('Get admin customer detail error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// UPDATE customer status
export async function PATCH(request, { params }) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = await params;
    const updates = await request.json();

    // Allowed fields to update
    const allowedUpdates = {};
    if (updates.status) {
      allowedUpdates.SS_USER_STATUS = updates.status;
    }

    const user = await SS_User.findByIdAndUpdate(
      id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        customer: {
          id: user._id.toString(),
          status: user.SS_USER_STATUS
        }
      },
      message: 'Customer status updated successfully'
    });

  } catch (error) {
    console.error('Update admin customer error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}