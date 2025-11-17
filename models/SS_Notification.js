import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  SS_USER_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SS_User'
  },
  SS_NOTIFICATION_TYPE: {
    type: String,
    enum: ['order', 'promotion', 'system', 'shipping'],
    required: true
  },
  SS_TITLE: {
    type: String,
    required: true
  },
  SS_MESSAGE: {
    type: String,
    required: true
  },
  SS_DATA: mongoose.Schema.Types.Mixed,
  SS_IS_READ: {
    type: Boolean,
    default: false
  },
  SS_SENT_VIA: [{
    type: String,
    enum: ['push', 'email', 'sms']
  }],
  SS_SCHEDULED_AT: Date,
  SS_SENT_AT: Date
}, {
  timestamps: {
    createdAt: 'SS_CREATED_DATE',
    updatedAt: 'SS_MODIFIED_DATE'
  }
});

export default mongoose.models.SS_Notification || mongoose.model('SS_Notification', notificationSchema);