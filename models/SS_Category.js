// models/SS_Category.js
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  SS_CATEGORY_NAME: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  SS_CATEGORY_DESCRIPTION: String,
  SS_PARENT_CATEGORY: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SS_Category'
  },
  SS_CATEGORY_IMAGE: String,
  SS_CATEGORY_ICON: String,
  SS_SEO_DATA: {
    metaTitle: String,
    metaDescription: String,
    slug: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  SS_IS_ACTIVE: {
    type: Boolean,
    default: true
  },
  SS_DISPLAY_ORDER: {
    type: Number,
    default: 0
  },
  SS_PRODUCT_COUNT: {
    type: Number,
    default: 0
  }
}, {
  timestamps: {
    createdAt: 'SS_CREATED_DATE',
    updatedAt: 'SS_MODIFIED_DATE'
  }
});

// Generate slug before saving
categorySchema.pre('save', function(next) {
  if (this.SS_CATEGORY_NAME && this.isModified('SS_CATEGORY_NAME')) {
    this.SS_SEO_DATA.slug = this.SS_CATEGORY_NAME
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

export default mongoose.models.SS_Category || mongoose.model('SS_Category', categorySchema);