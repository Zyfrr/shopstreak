import bcrypt from 'bcryptjs';

export class PasswordUtils {
  static async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(plainPassword, hashedPassword) {
    if (!plainPassword || !hashedPassword) {
      console.error('❌ Password comparison failed: missing arguments');
      return false;
    }

    if (typeof plainPassword !== 'string' || typeof hashedPassword !== 'string') {
      console.error('❌ Password comparison failed: invalid argument types');
      return false;
    }

    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('❌ Password comparison error:', error);
      return false;
    }
  }

  static generateSalt() {
    return bcrypt.genSaltSync(12);
  }

  static validatePasswordStrength(password) {
    const requirements = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[@$!%*?&]/.test(password)
    };

    const isValid = Object.values(requirements).every(Boolean);
    
    return {
      isValid,
      requirements,
      missingRequirements: Object.keys(requirements).filter(key => !requirements[key])
    };
  }
}

export class ApiResponse {
  static success(data = null, message = 'Operation completed successfully') {
    return {
      success: true,
      code: 'SUCCESS',
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  static error(message = 'An error occurred', code = 'ERROR', details = null) {
    return {
      success: false,
      code,
      message,
      details,
      timestamp: new Date().toISOString()
    };
  }

  static validationError(errors) {
    return {
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors,
      timestamp: new Date().toISOString()
    };
  }

  static unauthorized(message = 'Authentication required') {
    return {
      success: false,
      code: 'UNAUTHORIZED',
      message,
      timestamp: new Date().toISOString()
    };
  }

  static notFound(message = 'Resource not found') {
    return {
      success: false,
      code: 'NOT_FOUND',
      message,
      timestamp: new Date().toISOString()
    };
  }
}

export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err) => err.message);
    return ApiResponse.validationError(errors);
  }
  
  if (error.code === 11000) {
    return ApiResponse.error('Duplicate entry found');
  }
  
  if (error.name === 'CastError') {
    return ApiResponse.error('Invalid ID format');
  }
  
  return ApiResponse.error(error.message || 'Internal server error');
};