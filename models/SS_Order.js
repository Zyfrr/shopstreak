import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  SS_ORDER_NUMBER: {
    type: String,
    unique: true,
    required: true
  },
  SS_CUSTOMER_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SS_User',
    required: true
  },
  SS_ORDER_STATUS: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  SS_PAYMENT_STATUS: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  SS_PAYMENT_METHOD: {
    type: String,
    enum: ['cod', 'upi', 'card', 'netbanking'],
    required: true
  },
  SS_SHIPPING_ADDRESS: {
    SS_FULL_NAME: String,
    SS_MOBILE: String,
    SS_ADDRESS_LINE1: String,
    SS_ADDRESS_LINE2: String,
    SS_CITY: String,
    SS_STATE: String,
    SS_PINCODE: String,
    SS_COUNTRY: {
      type: String,
      default: 'India'
    },
    SS_ADDRESS_TYPE: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home'
    }
  },
  SS_BILLING_ADDRESS: {
    SS_FULL_NAME: String,
    SS_MOBILE: String,
    SS_ADDRESS_LINE1: String,
    SS_ADDRESS_LINE2: String,
    SS_CITY: String,
    SS_STATE: String,
    SS_PINCODE: String,
    SS_COUNTRY: {
      type: String,
      default: 'India'
    }
  },
  SS_ORDER_ITEMS: [{
    SS_PRODUCT_ID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SS_Product',
      required: true
    },
    SS_PRODUCT_NAME: String,
    SS_PRODUCT_IMAGE: String,
    SS_QUANTITY: {
      type: Number,
      required: true,
      min: 1
    },
    SS_UNIT_PRICE: {
      type: Number,
      required: true
    },
    SS_DISCOUNT_AMOUNT: {
      type: Number,
      default: 0
    },
    SS_TOTAL_PRICE: {
      type: Number,
      required: true
    },
    SS_VARIANT: mongoose.Schema.Types.Mixed
  }],
  SS_ORDER_SUMMARY: {
    SS_SUBTOTAL: {
      type: Number,
      required: true
    },
    SS_SHIPPING_CHARGE: {
      type: Number,
      default: 0
    },
    SS_TAX_AMOUNT: {
      type: Number,
      default: 0
    },
    SS_DISCOUNT_AMOUNT: {
      type: Number,
      default: 0
    },
    SS_TOTAL_AMOUNT: {
      type: Number,
      required: true
    },
    SS_COD_CHARGE: {
      type: Number,
      default: 0
    }
  },
  SS_SHIPPING_DETAILS: {
    SS_TRACKING_NUMBER: String,
    SS_COURIER_NAME: String,
    SS_SHIPPED_DATE: Date,
    SS_EXPECTED_DELIVERY: Date,
    SS_DELIVERED_DATE: Date
  },
  SS_CUSTOMER_NOTES: String,
  SS_ADMIN_NOTES: String,
  SS_CANCELLATION_REASON: String,
  SS_REFUND_AMOUNT: Number,
  SS_SUPPLIER_ORDER_ID: String,
  SS_IS_GUEST_ORDER: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: {
    createdAt: 'SS_CREATED_DATE',
    updatedAt: 'SS_MODIFIED_DATE'
  }
});

// Generate order number before save
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.models.SS_Order.countDocuments();
    this.SS_ORDER_NUMBER = `SS${Date.now()}${count + 1}`;
  }
  next();
});

export default mongoose.models.SS_Order || mongoose.model('SS_Order', orderSchema);