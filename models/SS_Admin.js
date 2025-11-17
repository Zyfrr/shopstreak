// models/SS_Admin.js
import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  SS_USER_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SS_User',
    required: true
  },
  SS_ADMIN_ROLE: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    required: true,
    default: 'admin'
  },
  SS_PERMISSIONS: [{
    module: String,
    permissions: [String]
  }],
  SS_ACCESS_EMAILS: [{
    type: String,
    required: true
  }],
  SS_LAST_LOGIN: Date,
  SS_LOGIN_HISTORY: [{
    timestamp: Date,
    ip: String,
    userAgent: String
  }],
  SS_ACTIVE_STATUS: {
    type: Boolean,
    default: true
  },
  SS_SECURITY_SETTINGS: {
    forceLogout: { type: Boolean, default: false },
    lastPasswordChange: Date
  }
}, {
  timestamps: {
    createdAt: 'SS_CREATED_DATE',
    updatedAt: 'SS_MODIFIED_DATE'
  }
});

// Index for quick lookups
adminSchema.index({ SS_USER_ID: 1 });
adminSchema.index({ SS_ACCESS_EMAILS: 1 });

export default mongoose.models.SS_Admin || mongoose.model('SS_Admin', adminSchema);