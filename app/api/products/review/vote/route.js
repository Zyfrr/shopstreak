// app/api/products/review/vote/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import SS_Review from '@/models/SS_Review';
import { ApiResponse, handleApiError } from '@/lib/utils';
import { JWTMiddleware } from '@/middleware/jwtMiddleware';

// POST - Vote on review
export async function POST(request) {
  try {
    await dbConnect();
    
    const user = await JWTMiddleware.requireAuth(request);
    if (!user) {
      return NextResponse.json(
        ApiResponse.unauthorized(), 
        { status: 401 }
      );
    }

    const { reviewId, voteType } = await request.json();

    if (!reviewId || !voteType) {
      return NextResponse.json(
        ApiResponse.error('Review ID and vote type are required'), 
        { status: 400 }
      );
    }

    if (!['helpful', 'unhelpful'].includes(voteType)) {
      return NextResponse.json(
        ApiResponse.error('Invalid vote type'), 
        { status: 400 }
      );
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return NextResponse.json(
        ApiResponse.error('Invalid review ID'), 
        { status: 400 }
      );
    }

    const review = await SS_Review.findById(reviewId);
    if (!review) {
      return NextResponse.json(
        ApiResponse.error('Review not found'), 
        { status: 404 }
      );
    }

    // Check if user is voting on their own review
    if (review.SS_USER_ID.toString() === user.id) {
      return NextResponse.json(
        ApiResponse.error('You cannot vote on your own review'), 
        { status: 400 }
      );
    }

    // Initialize arrays if they don't exist
    if (!review.SS_USER_VOTES) {
      review.SS_USER_VOTES = [];
    }

    // Find existing vote
    const existingVoteIndex = review.SS_USER_VOTES.findIndex(
      vote => vote.USER_ID && vote.USER_ID.toString() === user.id
    );

    let message = '';
    let newUserVote = null;
    
    if (existingVoteIndex !== -1) {
      const existingVote = review.SS_USER_VOTES[existingVoteIndex];
      
      if (existingVote.VOTE_TYPE === voteType) {
        // Remove vote if same type clicked again
        review.SS_USER_VOTES.splice(existingVoteIndex, 1);
        
        if (voteType === 'helpful') {
          review.SS_HELPFUL_COUNT = Math.max(0, review.SS_HELPFUL_COUNT - 1);
          message = 'Helpful vote removed';
        } else {
          review.SS_UNHELPFUL_COUNT = Math.max(0, review.SS_UNHELPFUL_COUNT - 1);
          message = 'Unhelpful vote removed';
        }
        newUserVote = null;
      } else {
        // Change vote type
        review.SS_USER_VOTES[existingVoteIndex].VOTE_TYPE = voteType;
        review.SS_USER_VOTES[existingVoteIndex].VOTED_AT = new Date();
        
        if (voteType === 'helpful') {
          review.SS_HELPFUL_COUNT += 1;
          review.SS_UNHELPFUL_COUNT = Math.max(0, review.SS_UNHELPFUL_COUNT - 1);
          message = 'Vote changed to helpful';
        } else {
          review.SS_UNHELPFUL_COUNT += 1;
          review.SS_HELPFUL_COUNT = Math.max(0, review.SS_HELPFUL_COUNT - 1);
          message = 'Vote changed to unhelpful';
        }
        newUserVote = voteType;
      }
    } else {
      // New vote - ensure proper ObjectId
      review.SS_USER_VOTES.push({
        USER_ID: new mongoose.Types.ObjectId(user.id),
        VOTE_TYPE: voteType,
        VOTED_AT: new Date()
      });
      
      if (voteType === 'helpful') {
        review.SS_HELPFUL_COUNT += 1;
        message = 'Review marked as helpful';
      } else {
        review.SS_UNHELPFUL_COUNT += 1;
        message = 'Review marked as unhelpful';
      }
      newUserVote = voteType;
    }

    await review.save();

    console.log('✅ Vote recorded:', { reviewId, userId: user.id, voteType, message });

    return NextResponse.json(ApiResponse.success({
      message,
      helpfulCount: review.SS_HELPFUL_COUNT,
      unhelpfulCount: review.SS_UNHELPFUL_COUNT,
      userVote: newUserVote
    }));

  } catch (error) {
    console.error('❌ Review Vote POST Error:', error);
    const response = handleApiError(error);
    return NextResponse.json(response, { status: 500 });
  }
}

// GET - Get user's vote status
export async function GET(request) {
  try {
    await dbConnect();
    
    const user = await JWTMiddleware.requireAuth(request);
    if (!user) {
      return NextResponse.json(
        ApiResponse.unauthorized(), 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json(
        ApiResponse.error('Review ID is required'), 
        { status: 400 }
      );
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return NextResponse.json(
        ApiResponse.error('Invalid review ID'), 
        { status: 400 }
      );
    }

    const review = await SS_Review.findById(reviewId);
    if (!review) {
      return NextResponse.json(
        ApiResponse.error('Review not found'), 
        { status: 404 }
      );
    }

    // Initialize if doesn't exist
    if (!review.SS_USER_VOTES) {
      review.SS_USER_VOTES = [];
      await review.save();
    }

    const userVote = review.SS_USER_VOTES.find(
      vote => vote.USER_ID && vote.USER_ID.toString() === user.id
    );

    return NextResponse.json(ApiResponse.success({
      userVote: userVote ? userVote.VOTE_TYPE : null,
      helpfulCount: review.SS_HELPFUL_COUNT || 0,
      unhelpfulCount: review.SS_UNHELPFUL_COUNT || 0
    }));

  } catch (error) {
    console.error('❌ Review Vote GET Error:', error);
    const response = handleApiError(error);
    return NextResponse.json(response, { status: 500 });
  }
}