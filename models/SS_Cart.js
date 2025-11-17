import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  SS_USER_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SS_User',
    required: true
  },
  SS_ITEMS: [{
    SS_PRODUCT_ID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SS_Product',
      required: true
    },
    SS_QUANTITY: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    SS_VARIANT: mongoose.Schema.Types.Mixed,
    SS_ADDED_DATE: {
      type: Date,
      default: Date.now
    }
  }],
  SS_COUPON_CODE: String,
  SS_COUPON_DISCOUNT: {
    type: Number,
    default: 0
  },
  SS_TOTAL_AMOUNT: {
    type: Number,
    default: 0
  },
  SS_DISCOUNT_AMOUNT: {
    type: Number,
    default: 0
  },
  SS_SHIPPING_CHARGE: {
    type: Number,
    default: 0
  },
  SS_FINAL_AMOUNT: {
    type: Number,
    default: 0
  }
}, {
  timestamps: {
    createdAt: 'SS_CREATED_DATE',
    updatedAt: 'SS_MODIFIED_DATE'
  }
});

cartSchema.index({ SS_USER_ID: 1 }, { unique: true });

export default mongoose.models.SS_Cart || mongoose.model('SS_Cart', cartSchema);