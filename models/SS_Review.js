// models/SS_Review.js - UPDATED (Remove unique constraint)
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  SS_PRODUCT_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SS_Product',
    required: true
  },
  SS_USER_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SS_User',
    required: true
  },
  SS_ORDER_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SS_Order'
  },
  SS_RATING: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  SS_REVIEW_TITLE: {
    type: String,
    required: true,
    trim: true
  },
  SS_REVIEW_DESCRIPTION: {
    type: String,
    required: true,
    trim: true
  },
  SS_IS_VERIFIED_PURCHASE: {
    type: Boolean,
    default: false
  },
  SS_HELPFUL_COUNT: {
    type: Number,
    default: 0
  },
  SS_UNHELPFUL_COUNT: {
    type: Number,
    default: 0
  },
  SS_REPORT_COUNT: {
    type: Number,
    default: 0
  },
  SS_IS_APPROVED: {
    type: Boolean,
    default: true
  },
  SS_ADMIN_RESPONSE: {
    response: String,
    respondedAt: Date
  },
  SS_USER_VOTES: [{
    USER_ID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SS_User',
      required: true
    },
    VOTE_TYPE: {
      type: String,
      enum: ['helpful', 'unhelpful'],
      required: true
    },
    VOTED_AT: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: {
    createdAt: 'SS_CREATED_DATE',
    updatedAt: 'SS_MODIFIED_DATE'
  }
});

// REMOVED: Unique index that prevented multiple reviews
// reviewSchema.index({ SS_PRODUCT_ID: 1, SS_USER_ID: 1 }, { unique: true });

// Keep other indexes
reviewSchema.index({ SS_PRODUCT_ID: 1, SS_IS_APPROVED: 1 });
reviewSchema.index({ 'SS_USER_VOTES.USER_ID': 1 });

export default mongoose.models.SS_Review || mongoose.model('SS_Review', reviewSchema);