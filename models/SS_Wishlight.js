import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  SS_USER_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SS_User',
    required: true
  },
  SS_PRODUCTS: [{
    SS_PRODUCT_ID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SS_Product',
      required: true
    },
    SS_ADDED_DATE: {
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

wishlistSchema.index({ SS_USER_ID: 1 }, { unique: true });

export default mongoose.models.SS_Wishlist || mongoose.model('SS_Wishlist', wishlistSchema);