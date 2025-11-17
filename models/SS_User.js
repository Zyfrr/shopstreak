import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  SS_USER_EMAIL: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  SS_USER_PASSWORD: {
    type: String
  },
  SS_USER_SALT: String,
  SS_AUTH_PROVIDER: {
    type: String,
    enum: ['email', 'google'],
    default: 'email'
  },
  SS_GOOGLE_ID: String,
  SS_ONBOARDING_STATUS: {
    type: String,
    enum: ['pending', 'password_setup', 'profile_setup', 'completed'], // ADD 'profile_setup' HERE
    default: 'pending'
  },
  SS_EMAIL_VERIFIED: {
    type: Boolean,
    default: false
  },
  SS_USER_ROLE: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  SS_USER_STATUS: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  SS_LOGIN_ATTEMPTS: {
    type: Number,
    default: 0
  },
  SS_ACCOUNT_LOCKED: {
    type: Boolean,
    default: false
  },
  SS_ACCOUNT_LOCKED_UNTIL: Date,
  SS_REFRESH_TOKEN: String,
  SS_PREFERRED_PAYMENT_METHOD: String,
  SS_LANGUAGE_PREFERENCE: {
    type: String,
    default: 'en'
  },
  SS_COMMUNICATION_PREF: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true }
  }
}, {
  timestamps: {
    createdAt: 'SS_CREATED_DATE',
    updatedAt: 'SS_MODIFIED_DATE'
  }
});

// Static methods for user management
userSchema.statics.findByEmail = async function(email) {
  return this.findOne({ SS_USER_EMAIL: email.toLowerCase() });
};

userSchema.statics.findByGoogleId = async function(googleId) {
  return this.findOne({ SS_GOOGLE_ID: googleId });
};

userSchema.statics.incrementLoginAttempts = async function(email) {
  const user = await this.findOne({ SS_USER_EMAIL: email });
  if (!user) return;

  const newAttempts = (user.SS_LOGIN_ATTEMPTS || 0) + 1;
  const shouldLock = newAttempts >= 5;
  
  await this.updateOne(
    { _id: user._id },
    {
      SS_LOGIN_ATTEMPTS: newAttempts,
      SS_ACCOUNT_LOCKED: shouldLock,
      SS_ACCOUNT_LOCKED_UNTIL: shouldLock ? new Date(Date.now() + 30 * 60 * 1000) : null
    }
  );
};

userSchema.statics.resetLoginAttempts = async function(email) {
  await this.updateOne(
    { SS_USER_EMAIL: email },
    {
      SS_LOGIN_ATTEMPTS: 0,
      SS_ACCOUNT_LOCKED: false,
      SS_ACCOUNT_LOCKED_UNTIL: null
    }
  );
};

userSchema.statics.isAccountLocked = function(user) {
  if (!user.SS_ACCOUNT_LOCKED) return false;
  
  if (user.SS_ACCOUNT_LOCKED_UNTIL && new Date(user.SS_ACCOUNT_LOCKED_UNTIL) > new Date()) {
    return true;
  }
  
  // Auto-unlock if lock time has passed
  this.updateOne(
    { _id: user._id },
    {
      SS_ACCOUNT_LOCKED: false,
      SS_ACCOUNT_LOCKED_UNTIL: null
    }
  );
  
  return false;
};

export default mongoose.models.SS_User || mongoose.model('SS_User', userSchema);