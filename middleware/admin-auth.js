// middleware/admin-auth.js
import jwt from 'jsonwebtoken';
import SS_Admin from '@/models/SS_Admin';
import SS_User from '@/models/SS_User';

const ALLOWED_ADMIN_EMAILS = [
  'shopstreak18@gmail.com',
  'irshadhullab32@gmail.com', 
  'rajprithivi099@gmail.com',
  'team.zyfrr@gmail.com',
  'iam.sharanyv@gmail.com'
];

export const verifyAdmin = async (req) => {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No token provided');
    }

    const token = authHeader.split(' ')[1];
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is active
    const user = await SS_User.findById(decoded.userId);
    if (!user || user.SS_USER_STATUS !== 'active') {
      throw new Error('User not found or inactive');
    }

    // Check if email is in allowed admin emails
    if (!ALLOWED_ADMIN_EMAILS.includes(user.SS_USER_EMAIL)) {
      throw new Error('Access denied. Admin privileges required.');
    }

    // Check if admin record exists
    const admin = await SS_Admin.findOne({ 
      SS_USER_ID: user._id,
      SS_ACTIVE_STATUS: true 
    });

    if (!admin) {
      throw new Error('Admin account not found');
    }

    return {
      userId: user._id,
      email: user.SS_USER_EMAIL,
      role: admin.SS_ADMIN_ROLE,
      permissions: admin.SS_PERMISSIONS || []
    };
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
};