// app/api/products/review/route.js - FIXED VERSION
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import SS_Review from '@/models/SS_Review';
import SS_Product from '@/models/SS_Product';
import SS_Customer from '@/models/SS_Customer';
import { ApiResponse, handleApiError } from '@/lib/utils';
import { JWTMiddleware } from '@/middleware/jwtMiddleware';

// GET - Get all reviews for a product
export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const sortBy = searchParams.get('sortBy') || 'recent';

    console.log('📥 GET Reviews Request:', { productId, page, limit, sortBy });

    if (!productId) {
      return NextResponse.json(
        ApiResponse.error('Product ID is required'), 
        { status: 400 }
      );
    }

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        ApiResponse.error('Invalid product ID'), 
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await SS_Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        ApiResponse.error('Product not found'), 
        { status: 404 }
      );
    }

    // Build sort object
    let sort = {};
    switch (sortBy) {
      case 'recent':
        sort = { SS_CREATED_DATE: -1 };
        break;
      case 'helpful':
        sort = { SS_HELPFUL_COUNT: -1, SS_CREATED_DATE: -1 };
        break;
      case 'rating_high':
        sort = { SS_RATING: -1, SS_CREATED_DATE: -1 };
        break;
      case 'rating_low':
        sort = { SS_RATING: 1, SS_CREATED_DATE: -1 };
        break;
      default:
        sort = { SS_CREATED_DATE: -1 };
    }

    // Get reviews with pagination
    const reviews = await SS_Review.find({ 
      SS_PRODUCT_ID: productId,
      SS_IS_APPROVED: true 
    })
      .populate('SS_USER_ID', 'SS_USER_EMAIL')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    console.log('📊 Found reviews:', reviews.length);

    // Get all reviews for statistics
    const allReviews = await SS_Review.find({ 
      SS_PRODUCT_ID: productId,
      SS_IS_APPROVED: true 
    }).select('SS_RATING').lean();

    // Calculate average rating
    const totalRating = allReviews.reduce((sum, review) => sum + review.SS_RATING, 0);
    const averageRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;

    // Calculate rating distribution
    const distribution = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: allReviews.filter(review => review.SS_RATING === rating).length,
      percentage: allReviews.length > 0 
        ? Math.round((allReviews.filter(review => review.SS_RATING === rating).length / allReviews.length) * 100)
        : 0
    }));

    // Get customer names for all reviews
    const userIds = reviews.map(review => review.SS_USER_ID?._id).filter(id => id);
    const customers = await SS_Customer.find({ 
      SS_USER_ID: { $in: userIds } 
    }).select('SS_USER_ID SS_FIRST_NAME SS_LAST_NAME').lean();

    // Create a map of user IDs to customer names
    const customerMap = {};
    customers.forEach(customer => {
      customerMap[customer.SS_USER_ID.toString()] = 
        `${customer.SS_FIRST_NAME || ''} ${customer.SS_LAST_NAME || ''}`.trim();
    });

    // Transform reviews for frontend
    const transformedReviews = reviews.map(review => {
      const userId = review.SS_USER_ID?._id?.toString();
      const userName = customerMap[userId] || 'Anonymous';

      console.log('🔍 Raw Review Data:', {
        id: review._id,
        title: review.SS_REVIEW_TITLE,
        description: review.SS_REVIEW_DESCRIPTION,
        rating: review.SS_RATING,
        userName: userName,
        userId: userId
      });

      return {
        id: review._id?.toString() || '',
        userId: userId || 'unknown',
        userName: userName,
        rating: review.SS_RATING || 0,
        title: review.SS_REVIEW_TITLE || '',
        comment: review.SS_REVIEW_DESCRIPTION || '',
        verified: review.SS_IS_VERIFIED_PURCHASE || false,
        helpful: review.SS_HELPFUL_COUNT || 0,
        unhelpful: review.SS_UNHELPFUL_COUNT || 0,
        createdAt: review.SS_CREATED_DATE || new Date().toISOString(),
        adminResponse: review.SS_ADMIN_RESPONSE ? {
          response: review.SS_ADMIN_RESPONSE.response,
          respondedAt: review.SS_ADMIN_RESPONSE.respondedAt
        } : undefined
      };
    });

    console.log('🚀 Transformed Reviews:', transformedReviews);

    const responseData = {
      reviews: transformedReviews,
      pagination: {
        page,
        limit,
        total: allReviews.length,
        pages: Math.ceil(allReviews.length / limit)
      },
      summary: {
        average: Math.round(averageRating * 10) / 10,
        total: allReviews.length,
        distribution: distribution
      }
    };

    console.log('✅ Final API Response:', responseData);

    return NextResponse.json(ApiResponse.success(responseData));

  } catch (error) {
    console.error('❌ Review GET Error:', error);
    const response = handleApiError(error);
    return NextResponse.json(response, { status: 500 });
  }
}

// POST - Create a new review - ALLOW MULTIPLE REVIEWS
export async function POST(request) {
  try {
    await dbConnect();
    
    // Authenticate user
    const user = await JWTMiddleware.requireAuth(request);
    if (!user) {
      return NextResponse.json(
        ApiResponse.unauthorized(), 
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('📝 Review POST Body:', body);

    const { productId, rating, title, description } = body;

    // Enhanced validation
    if (!productId) {
      return NextResponse.json(
        ApiResponse.error('Product ID is required'), 
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        ApiResponse.error('Valid rating between 1 and 5 is required'), 
        { status: 400 }
      );
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        ApiResponse.error('Review title is required'), 
        { status: 400 }
      );
    }

    if (!description || description.trim().length === 0) {
      return NextResponse.json(
        ApiResponse.error('Review description is required'), 
        { status: 400 }
      );
    }

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        ApiResponse.error('Invalid product ID'), 
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await SS_Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        ApiResponse.error('Product not found'), 
        { status: 404 }
      );
    }

    // Get customer data for user name
    let customerName = 'Anonymous';
    try {
      const customer = await SS_Customer.findOne({ SS_USER_ID: user.id });
      if (customer) {
        customerName = `${customer.SS_FIRST_NAME || ''} ${customer.SS_LAST_NAME || ''}`.trim();
      }
      console.log('👤 Customer data:', { customerName, userId: user.id });
    } catch (error) {
      console.error('Error fetching customer data:', error);
    }

    // Create review - ALLOW MULTIPLE REVIEWS
    const reviewData = {
      SS_PRODUCT_ID: new mongoose.Types.ObjectId(productId),
      SS_USER_ID: new mongoose.Types.ObjectId(user.id),
      SS_RATING: parseInt(rating),
      SS_REVIEW_TITLE: title.trim(),
      SS_REVIEW_DESCRIPTION: description.trim(),
      SS_IS_VERIFIED_PURCHASE: false,
      SS_IS_APPROVED: true,
      SS_HELPFUL_COUNT: 0,
      SS_UNHELPFUL_COUNT: 0,
      SS_REPORT_COUNT: 0,
      SS_USER_VOTES: [],
      SS_CREATED_DATE: new Date(),
      SS_MODIFIED_DATE: new Date()
    };

    console.log('💾 Creating review with data:', reviewData);

    const review = new SS_Review(reviewData);
    await review.save();

    console.log('✅ Review created successfully:', review._id);

    // Update product rating statistics
    await updateProductRating(productId);

    return NextResponse.json(ApiResponse.success({
      message: 'Review submitted successfully',
      reviewId: review._id.toString()
    }));

  } catch (error) {
    console.error('❌ Review POST Error:', error);
    
    const response = handleApiError(error);
    return NextResponse.json(response, { status: 500 });
  }
}

// Helper function to update product rating
async function updateProductRating(productId) {
  try {
    const allReviews = await SS_Review.find({
      SS_PRODUCT_ID: productId,
      SS_IS_APPROVED: true
    }).select('SS_RATING');

    let averageRating = 0;
    let totalReviews = 0;

    if (allReviews.length > 0) {
      const totalRating = allReviews.reduce((sum, review) => sum + review.SS_RATING, 0);
      averageRating = Math.round((totalRating / allReviews.length) * 10) / 10;
      totalReviews = allReviews.length;
    }

    await SS_Product.findByIdAndUpdate(productId, {
      'SS_CUSTOMER_VISIBLE.SS_AVERAGE_RATING': averageRating,
      'SS_CUSTOMER_VISIBLE.SS_REVIEW_COUNT': totalReviews
    });

    console.log('✅ Product rating updated:', { productId, averageRating, totalReviews });
    
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
}