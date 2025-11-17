// models/SS_Customer.js
import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  SS_ADDRESS_TYPE: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'home'
  },
  SS_FULL_NAME: {
    type: String,
    required: true,
    trim: true
  },
  SS_MOBILE_NUMBER: {
    type: String,
    required: true,
    trim: true
  },
  SS_STREET_ADDRESS: {
    type: String,
    required: true,
    trim: true
  },
  SS_CITY: {
    type: String,
    required: true,
    trim: true
  },
  SS_STATE: {
    type: String,
    required: true,
    trim: true
  },
  SS_POSTAL_CODE: {
    type: String,
    required: true,
    trim: true
  },
  SS_COUNTRY: {
    type: String,
    default: 'India',
    trim: true
  },
  SS_IS_DEFAULT: {
    type: Boolean,
    default: false
  },
  SS_IS_CURRENT: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const customerSchema = new mongoose.Schema({
  SS_USER_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SS_User',
    required: true,
    unique: true
  },
  SS_FIRST_NAME: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  SS_LAST_NAME: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  SS_MOBILE_NUMBER: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[6-9]\d{9}$/.test(v);
      },
      message: 'Please enter a valid Indian mobile number'
    }
  },
  SS_DATE_OF_BIRTH: Date,
  SS_GENDER: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    default: 'prefer_not_to_say'
  },
  SS_ADDRESSES: [addressSchema],
  SS_PROFILE_COMPLETED_DATE: Date,
  SS_LAST_PROFILE_UPDATE: Date
}, {
  timestamps: {
    createdAt: 'SS_CREATED_DATE',
    updatedAt: 'SS_MODIFIED_DATE'
  }
});

// Index for mobile number uniqueness
customerSchema.index({ SS_MOBILE_NUMBER: 1 }, { unique: true });

// Static methods
customerSchema.statics.findByUserId = async function(userId) {
  return this.findOne({ SS_USER_ID: userId });
};

customerSchema.statics.findByEmail = async function(email) {
  const user = await mongoose.model('SS_User').findOne({ SS_USER_EMAIL: email.toLowerCase() });
  if (!user) return null;
  return this.findOne({ SS_USER_ID: user._id });
};

// Instance method to set current address
customerSchema.methods.setCurrentAddress = function(addressId) {
  this.SS_ADDRESSES.forEach(addr => {
    addr.SS_IS_CURRENT = addr._id.toString() === addressId.toString();
  });
  return this.save();
};

// Instance method to set default address
customerSchema.methods.setDefaultAddress = function(addressId) {
  this.SS_ADDRESSES.forEach(addr => {
    addr.SS_IS_DEFAULT = addr._id.toString() === addressId.toString();
  });
  return this.save();
};

// Instance method to add address
customerSchema.methods.addAddress = function(addressData) {
  const isFirstAddress = this.SS_ADDRESSES.length === 0;
  const newAddress = {
    ...addressData,
    SS_IS_DEFAULT: isFirstAddress ? true : addressData.SS_IS_DEFAULT,
    SS_IS_CURRENT: isFirstAddress ? true : false
  };
  
  if (newAddress.SS_IS_DEFAULT) {
    this.SS_ADDRESSES.forEach(addr => {
      addr.SS_IS_DEFAULT = false;
    });
  }

  if (newAddress.SS_IS_CURRENT) {
    this.SS_ADDRESSES.forEach(addr => {
      addr.SS_IS_CURRENT = false;
    });
  }
  
  this.SS_ADDRESSES.push(newAddress);
  return this.save();
};

export default mongoose.models.SS_Customer || mongoose.model('SS_Customer', customerSchema);