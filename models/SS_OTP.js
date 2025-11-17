import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  SS_USER_EMAIL: {
    type: String,
    required: true,
    lowercase: true,
    index: true // Add index for better performance
  },
  SS_OTP_CODE: {
    type: String,
    required: true
  },
  SS_OTP_TYPE: {
    type: String,
    enum: ['email_verification', 'password_reset'],
    required: true,
    index: true // Add index for better performance
  },
  SS_OTP_EXPIRY: {
    type: Date,
    required: true,
    index: true, // Add index for TTL
    expires: 600 // Auto delete after 600 seconds (10 minutes)
  },
  SS_OTP_IS_USED: {
    type: Boolean,
    default: false
  },
  SS_OTP_ATTEMPTS: {
    type: Number,
    default: 0
  }
}, {
  timestamps: {
    createdAt: 'SS_CREATED_DATE',
    updatedAt: 'SS_MODIFIED_DATE'
  }
});

// Create TTL index for automatic deletion after 10 minutes
otpSchema.index({ SS_OTP_EXPIRY: 1 }, { expireAfterSeconds: 600 });

// Static methods
otpSchema.statics.createOTP = async function(email, type) {
  const OTP_CONFIG = {
    LENGTH: 6,
    EXPIRY_MINUTES: 10,
    MAX_ATTEMPTS: 3,
    RESEND_WAIT_SECONDS: 30
  };

  // Clean up expired OTPs before creating new one
  await this.deleteMany({
    SS_USER_EMAIL: email.toLowerCase(),
    SS_OTP_EXPIRY: { $lt: new Date() }
  });

  // Rate limiting
  const recentOTP = await this.findOne({
    SS_USER_EMAIL: email.toLowerCase(),
    SS_OTP_TYPE: type,
    SS_CREATED_DATE: { $gt: new Date(Date.now() - OTP_CONFIG.RESEND_WAIT_SECONDS * 1000) }
  });

  if (recentOTP) {
    throw new Error(`Please wait ${OTP_CONFIG.RESEND_WAIT_SECONDS} seconds before requesting a new OTP`);
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);

  // Create new OTP document
  const otpRecord = new this({
    SS_USER_EMAIL: email.toLowerCase(),
    SS_OTP_CODE: otp,
    SS_OTP_TYPE: type,
    SS_OTP_EXPIRY: expiresAt,
    SS_OTP_IS_USED: false,
    SS_OTP_ATTEMPTS: 0
  });

  await otpRecord.save();

  return otp;
};

otpSchema.statics.verifyOTP = async function(email, otp, type) {
  const OTP_CONFIG = {
    MAX_ATTEMPTS: 3
  };

  // Clean up expired OTPs before verification
  await this.deleteMany({
    SS_USER_EMAIL: email.toLowerCase(),
    SS_OTP_EXPIRY: { $lt: new Date() }
  });

  const otpRecord = await this.findOne({
    SS_USER_EMAIL: email.toLowerCase(),
    SS_OTP_TYPE: type,
    SS_OTP_IS_USED: false
  });

  if (!otpRecord) {
    return { success: false, message: 'OTP not found or already used' };
  }

  // Check if OTP is expired (additional safety check)
  if (otpRecord.SS_OTP_EXPIRY < new Date()) {
    await this.deleteOne({ _id: otpRecord._id });
    return { success: false, message: 'OTP has expired' };
  }

  if (otpRecord.SS_OTP_ATTEMPTS >= OTP_CONFIG.MAX_ATTEMPTS) {
    await this.deleteOne({ _id: otpRecord._id });
    return { success: false, message: 'Too many failed attempts' };
  }

  if (otpRecord.SS_OTP_CODE !== otp) {
    await this.updateOne(
      { _id: otpRecord._id },
      { $inc: { SS_OTP_ATTEMPTS: 1 } }
    );
    
    const attemptsLeft = OTP_CONFIG.MAX_ATTEMPTS - (otpRecord.SS_OTP_ATTEMPTS + 1);
    const message = `Invalid OTP. ${attemptsLeft} attempts remaining.`;
    
    if (attemptsLeft === 0) {
      await this.deleteOne({ _id: otpRecord._id });
    }
    
    return { success: false, message };
  }

  // OTP is valid - mark as used and let TTL handle deletion
  await this.updateOne(
    { _id: otpRecord._id },
    { $set: { SS_OTP_IS_USED: true } }
  );
  
  return { success: true, message: 'OTP verified successfully' };
};

// Additional method to manually clean up expired OTPs
otpSchema.statics.cleanupExpiredOTPs = async function() {
  const result = await this.deleteMany({
    SS_OTP_EXPIRY: { $lt: new Date() }
  });
  console.log(`🧹 Cleaned up ${result.deletedCount} expired OTPs`);
  return result;
};

// Method to get OTP status
otpSchema.statics.getOTPStatus = async function(email, type) {
  const otpRecord = await this.findOne({
    SS_USER_EMAIL: email.toLowerCase(),
    SS_OTP_TYPE: type,
    SS_OTP_IS_USED: false,
    SS_OTP_EXPIRY: { $gt: new Date() }
  });

  if (!otpRecord) {
    return { exists: false };
  }

  const timeLeft = Math.max(0, otpRecord.SS_OTP_EXPIRY - new Date());
  const minutesLeft = Math.floor(timeLeft / (1000 * 60));
  const secondsLeft = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return {
    exists: true,
    attempts: otpRecord.SS_OTP_ATTEMPTS,
    expiresIn: `${minutesLeft}m ${secondsLeft}s`,
    createdAt: otpRecord.SS_CREATED_DATE,
    expiresAt: otpRecord.SS_OTP_EXPIRY
  };
};

export default mongoose.models.SS_OTP || mongoose.model('SS_OTP', otpSchema);