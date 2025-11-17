import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  SS_SUPPLIER_NAME: {
    type: String,
    required: true,
    trim: true
  },
  SS_CONTACT_PERSON: String,
  SS_EMAIL: String,
  SS_PHONE: String,
  SS_ADDRESS: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  SS_PRODUCT_CATEGORIES: [String],
  SS_PAYMENT_TERMS: String,
  SS_LEAD_TIME: {
    type: Number,
    default: 7
  },
  SS_IS_ACTIVE: {
    type: Boolean,
    default: true
  },
  SS_SUPPLIER_RATING: {
    type: Number,
    default: 0
  },
  SS_TOTAL_ORDERS: {
    type: Number,
    default: 0
  },
  SS_LAST_ORDER_DATE: Date
}, {
  timestamps: {
    createdAt: 'SS_CREATED_DATE',
    updatedAt: 'SS_MODIFIED_DATE'
  }
});

export default mongoose.models.SS_Supplier || mongoose.model('SS_Supplier', supplierSchema);