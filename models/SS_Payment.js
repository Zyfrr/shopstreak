import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  SS_ORDER_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SS_Order',
    required: true
  },
  SS_USER_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SS_User',
    required: true
  },
  SS_PAYMENT_METHOD: {
    type: String,
    enum: ['cod', 'upi', 'card', 'netbanking'],
    required: true
  },
  SS_PAYMENT_STATUS: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  SS_AMOUNT: {
    type: Number,
    required: true
  },
  SS_CURRENCY: {
    type: String,
    default: 'INR'
  },
  SS_PAYMENT_GATEWAY_RESPONSE: mongoose.Schema.Types.Mixed,
  SS_TRANSACTION_ID: String,
  SS_PAYMENT_DATE: Date,
  SS_REFUND_AMOUNT: Number,
  SS_REFUND_DATE: Date,
  SS_REFUND_REASON: String,
  SS_IS_DUMMY_PAYMENT: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: {
    createdAt: 'SS_CREATED_DATE',
    updatedAt: 'SS_MODIFIED_DATE'
  }
});

export default mongoose.models.SS_Payment || mongoose.model('SS_Payment', paymentSchema);