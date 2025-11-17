import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  SS_COUPON_CODE: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  SS_COUPON_TYPE: {
    type: String,
    enum: ['percentage', 'fixed', 'shipping'],
    required: true
  },
  SS_DISCOUNT_VALUE: {
    type: Number,
    required: true
  },
  SS_MIN_ORDER_AMOUNT: {
    type: Number,
    default: 0
  },
  SS_MAX_DISCOUNT_AMOUNT: Number,
  SS_VALID_FROM: {
    type: Date,
    required: true
  },
  SS_VALID_UNTIL: {
    type: Date,
    required: true
  },
  SS_USAGE_LIMIT: {
    type: Number,
    default: 1
  },
  SS_USED_COUNT: {
    type: Number,
    default: 0
  },
  SS_IS_ACTIVE: {
    type: Boolean,
    default: true
  },
  SS_APPLICABLE_CATEGORIES: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SS_Category'
  }],
  SS_APPLICABLE_PRODUCTS: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SS_Product'
  }],
  SS_USER_USAGE_LIMIT: {
    type: Number,
    default: 1
  }
}, {
  timestamps: {
    createdAt: 'SS_CREATED_DATE',
    updatedAt: 'SS_MODIFIED_DATE'
  }
});

export default mongoose.models.SS_Coupon || mongoose.model('SS_Coupon', couponSchema);