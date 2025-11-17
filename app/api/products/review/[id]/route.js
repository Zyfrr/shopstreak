// app/api/products/review/[id]/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_Review from '@/models/SS_Review';
import SS_Product from '@/models/SS_Product';
import { ApiResponse, handleApiError } from '@/lib/utils';
import { JWTMiddleware } from '@/middleware/jwtMiddleware';

// GET - Get single review
export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    const review = await SS_Review.findById(id)
      .populate('SS_USER_ID', 'SS_NAME SS_EMAIL')
      .lean();

    if (!review) {
      return NextResponse.json(
        ApiResponse.error('Review not found'), 
        { status: 404 }
      );
    }

    const transformedReview = {
      id: review._id.toString(),
      userId: review.SS_USER_ID?._id?.toString() || 'unknown',
      userName: review.SS_USER_ID?.SS_NAME || 'Anonymous',
      rating: review.SS_RATING,
      title: review.SS_REVIEW_TITLE || '',
      comment: review.SS_REVIEW_DESCRIPTION || '',
      verified: review.SS_IS_VERIFIED_PURCHASE || false,
      helpful: review.SS_HELPFUL_COUNT || 0,
      unhelpful: review.SS_UNHELPFUL_COUNT || 0,
      createdAt: review.SS_CREATED_DATE,
      adminResponse: review.SS_ADMIN_RESPONSE
    };

    return NextResponse.json(ApiResponse.success({
      review: transformedReview
    }));

  } catch (error) {
    console.error('Review GET Error:', error);
    const response = handleApiError(error);
    return NextResponse.json(response, { status: 500 });
  }
}

// PUT - Update review
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    
    const user = await JWTMiddleware.requireAuth(request);
    if (!user) {
      return NextResponse.json(
        ApiResponse.unauthorized(), 
        { status: 401 }
      );
    }

    const { id } = await params;
    const { rating, title, description } = await request.json();

    const review = await SS_Review.findById(id);
    if (!review) {
      return NextResponse.json(
        ApiResponse.error('Review not found'), 
        { status: 404 }
      );
    }

    // Check ownership
    if (review.SS_USER_ID.toString() !== user.id) {
      return NextResponse.json(
        ApiResponse.unauthorized(), 
        { status: 403 }
      );
    }

    // Validate and update
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          ApiResponse.error('Rating must be between 1 and 5'), 
          { status: 400 }
        );
      }
      review.SS_RATING = rating;
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return NextResponse.json(
          ApiResponse.error('Review title is required'), 
          { status: 400 }
        );
      }
      review.SS_REVIEW_TITLE = title.trim();
    }

    if (description !== undefined) {
      if (!description.trim()) {
        return NextResponse.json(
          ApiResponse.error('Review description is required'), 
          { status: 400 }
        );
      }
      review.SS_REVIEW_DESCRIPTION = description.trim();
    }

    await review.save();

    // Update product stats
    await updateProductRating(review.SS_PRODUCT_ID);

    return NextResponse.json(ApiResponse.success({
      message: 'Review updated successfully'
    }));

  } catch (error) {
    console.error('Review PUT Error:', error);
    const response = handleApiError(error);
    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE - Delete review
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    const user = await JWTMiddleware.requireAuth(request);
    if (!user) {
      return NextResponse.json(
        ApiResponse.unauthorized(), 
        { status: 401 }
      );
    }

    const { id } = await params;
    const review = await SS_Review.findById(id);

    if (!review) {
      return NextResponse.json(
        ApiResponse.error('Review not found'), 
        { status: 404 }
      );
    }

    // Check ownership
    if (review.SS_USER_ID.toString() !== user.id) {
      return NextResponse.json(
        ApiResponse.unauthorized(), 
        { status: 403 }
      );
    }

    const productId = review.SS_PRODUCT_ID;
    await SS_Review.findByIdAndDelete(id);

    // Update product stats
    await updateProductRating(productId);

    return NextResponse.json(ApiResponse.success({
      message: 'Review deleted successfully'
    }));

  } catch (error) {
    console.error('Review DELETE Error:', error);
    const response = handleApiError(error);
    return NextResponse.json(response, { status: 500 });
  }
}

// Helper function
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
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
}