import jwt from 'jsonwebtoken';
import SS_User from '@/models/SS_User';

export class JWTMiddleware {
  static async verifyToken(token) {
    try {
      if (!token) {
        return { isValid: false, error: 'No token provided' };
      }

      const actualToken = token.startsWith('Bearer ') ? token.substring(7) : token;
      
      if (!actualToken) {
        return { isValid: false, error: 'Token is empty' };
      }

      if (!process.env.JWT_SECRET) {
        return { isValid: false, error: 'Server configuration error' };
      }

      const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
      
      // Verify user still exists and is active
      const user = await SS_User.findById(decoded.userId);
      if (!user) {
        return { isValid: false, error: 'User not found' };
      }

      if (user.SS_USER_STATUS !== 'active') {
        return { isValid: false, error: 'User account is not active' };
      }

      return {
        isValid: true,
        user: {
          id: user._id.toString(),
          email: user.SS_USER_EMAIL,
          role: user.SS_USER_ROLE
        }
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return { isValid: false, error: 'Token expired' };
      }
      if (error.name === 'JsonWebTokenError') {
        return { isValid: false, error: 'Invalid token' };
      }
      return { isValid: false, error: 'Token verification failed' };
    }
  }

  static async requireAuth(request) {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const result = await this.verifyToken(authHeader);
    if (!result.isValid) {
      throw new Error(result.error);
    }

    return result.user;
  }

  static async optionalAuth(request) {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return null;
    }

    const result = await this.verifyToken(authHeader);
    return result.isValid ? result.user : null;
  }
}