// models/SS_Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  // Admin controlled fields
  SS_ADMIN_VISIBLE: {
    SS_PRODUCT_NAME: {
      type: String,
      required: true,
      trim: true
    },
    SS_PRODUCT_DESCRIPTION: {
      type: String,
      required: true
    },
    SS_CATEGORY: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SS_Category',
      required: true
    },
    SS_SUBCATEGORY: String,
    SS_BRAND: String,
    SS_SUPPLIER_ID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SS_Supplier'
    },
    SS_COST_PRICE: {
      type: Number,
      required: true,
      min: 0
    },
    SS_SELLING_PRICE: {
      type: Number,
      required: true,
      min: 0
    },
    SS_DISCOUNT_PERCENTAGE: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    SS_DISCOUNT_AMOUNT: {
      type: Number,
      default: 0,
      min: 0
    },
    SS_STOCK_QUANTITY: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    SS_MIN_STOCK_ALERT: {
      type: Number,
      default: 10,
      min: 0
    },
    SS_SUPPLIER_SKU: String,
    SS_PRODUCT_IMAGES: [{
      url: String,
      alt: String,
      isPrimary: Boolean,
      publicId: String
    }],
    SS_RETURN_POLICY: {
      type: String,
      enum: ['no_return', 'exchange_only', 'return_allowed'],
      default: 'no_return'
    },
    SS_SHIPPING_DETAILS: {
      weight: Number,
      dimensions: {
        length: Number,
        width: Number,
        height: Number
      },
      shipping_class: String
    },
    SS_TAX_RATE: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    SS_IS_ACTIVE: {
      type: Boolean,
      default: true
    },
    SS_IS_FEATURED: {
      type: Boolean,
      default: false
    },
    SS_TRENDING_SCORE: {
      type: Number,
      default: 0
    }
  },
  
  // Customer visible fields
  SS_CUSTOMER_VISIBLE: {
    SS_PRODUCT_TITLE: {
      type: String,
      required: true
    },
    SS_SHORT_DESCRIPTION: String,
    SS_HIGHLIGHTS: [String],
    SS_SPECIFICATIONS: mongoose.Schema.Types.Mixed,
    SS_DELIVERY_ESTIMATE: {
      minDays: { type: Number, default: 3, min: 1 },
      maxDays: { type: Number, default: 7, min: 1 }
    },
    SS_WARRANTY: String,
    SS_MAIN_IMAGE: String,
    SS_GALLERY_IMAGES: [String],
    SS_AVERAGE_RATING: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    SS_REVIEW_COUNT: {
      type: Number,
      default: 0,
      min: 0
    },
    SS_SOLD_COUNT: {
      type: Number,
      default: 0,
      min: 0
    },
    SS_VIEW_COUNT: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Sales and Analytics
  SS_SALES_DATA: {
    TOTAL_SOLD: {
      type: Number,
      default: 0
    },
    TOTAL_REVENUE: {
      type: Number,
      default: 0
    },
    MONTHLY_SALES: [{
      month: String,
      year: Number,
      sold: Number,
      revenue: Number
    }],
    LAST_SOLD_DATE: Date
  },
  
  // System fields
  SS_SEO_DATA: {
    metaTitle: String,
    metaDescription: String,
    slug: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  SS_TAGS: [String],
  SS_VARIANTS: [{
    variantName: String,
    options: [{
      name: String,
      value: String,
      priceAdjustment: Number,
      stock: Number,
      sku: String
    }]
  }]
}, {
  timestamps: {
    createdAt: 'SS_CREATED_DATE',
    updatedAt: 'SS_MODIFIED_DATE'
  }
});

// Generate slug before saving
productSchema.pre('save', function(next) {
  if (this.SS_ADMIN_VISIBLE.SS_PRODUCT_NAME && this.isModified('SS_ADMIN_VISIBLE.SS_PRODUCT_NAME')) {
    this.SS_SEO_DATA.slug = this.SS_ADMIN_VISIBLE.SS_PRODUCT_NAME
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

// Index for search and filtering
productSchema.index({
  'SS_ADMIN_VISIBLE.SS_PRODUCT_NAME': 'text',
  'SS_ADMIN_VISIBLE.SS_PRODUCT_DESCRIPTION': 'text',
  'SS_CUSTOMER_VISIBLE.SS_PRODUCT_TITLE': 'text',
  'SS_CUSTOMER_VISIBLE.SS_SHORT_DESCRIPTION': 'text'
});

// Virtual for discount price
productSchema.virtual('discountedPrice').get(function() {
  const price = this.SS_ADMIN_VISIBLE.SS_SELLING_PRICE;
  const discount = this.SS_ADMIN_VISIBLE.SS_DISCOUNT_PERCENTAGE;
  return price - (price * discount / 100);
});

export default mongoose.models.SS_Product || mongoose.model('SS_Product', productSchema);