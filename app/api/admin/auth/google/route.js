// app/api/admin/auth/google/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_User from '@/models/SS_User';
import SS_Admin from '@/models/SS_Admin';
import { OAuth2Client } from 'google-auth-library';

const ALLOWED_ADMIN_EMAILS = [
  'shopstreak18@gmail.com',
  'irshadhullab32@gmail.com',
  'rajprithivi099@gmail.com',
  'team.zyfrr@gmail.com',
  'iam.sharanyv@gmail.com'
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${process.env.FRONTEND_URL}/admin/login?error=google_oauth_failed`);
    }

    if (code) {
      const oauthClient = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.FRONTEND_URL}/api/admin/auth/google`
      );

      const { tokens } = await oauthClient.getToken({
        code,
        redirect_uri: `${process.env.FRONTEND_URL}/api/admin/auth/google`
      });

      const ticket = await oauthClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      
      if (!payload || !payload.email) {
        return NextResponse.redirect(`${process.env.FRONTEND_URL}/admin/login?error=invalid_token`);
      }

      const { email, sub: googleId } = payload;

      // STRICT EMAIL CHECK
      if (!ALLOWED_ADMIN_EMAILS.includes(email)) {
        return NextResponse.redirect(`${process.env.FRONTEND_URL}/admin/login?error=access_denied`);
      }

      await dbConnect();

      let user = await SS_User.findOne({ 
        $or: [
          { SS_GOOGLE_ID: googleId },
          { SS_USER_EMAIL: email.toLowerCase() }
        ]
      });

      if (!user) {
        user = new SS_User({
          SS_USER_EMAIL: email.toLowerCase(),
          SS_GOOGLE_ID: googleId,
          SS_AUTH_PROVIDER: 'google',
          SS_EMAIL_VERIFIED: true,
          SS_USER_ROLE: 'admin',
          SS_USER_STATUS: 'active'
        });
        await user.save();
      }

      // Ensure admin record exists
      let admin = await SS_Admin.findOne({ SS_USER_ID: user._id });
      if (!admin) {
        admin = new SS_Admin({
          SS_USER_ID: user._id,
          SS_ACCESS_EMAILS: [email],
          SS_ADMIN_ROLE: 'admin'
        });
        await admin.save();
      }

      // Generate long-lived JWT tokens (2 years)
      const jwt = await import('jsonwebtoken');
      const userId = user._id.toString();
      
      const accessToken = jwt.sign(
        {
          userId: userId,
          email: user.SS_USER_EMAIL,
          role: 'admin',
          type: 'admin'
        },
        process.env.JWT_SECRET,
        { expiresIn: '2y' } // 2 years expiry
      );

      const refreshToken = jwt.sign(
        {
          userId: userId,
          type: 'refresh_admin'
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '2y' }
      );

      user.SS_REFRESH_TOKEN = refreshToken;
      await user.save();

      // Update admin login history
      admin.SS_LAST_LOGIN = new Date();
      admin.SS_LOGIN_HISTORY.push({
        timestamp: new Date(),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
      await admin.save();

      const redirectUrl = new URL(`${process.env.FRONTEND_URL}/admin`);
      redirectUrl.searchParams.set('admin_auth', 'success');
      redirectUrl.searchParams.set('access_token', accessToken);
      redirectUrl.searchParams.set('refresh_token', refreshToken);

      return NextResponse.redirect(redirectUrl);
    }

    // Initiate OAuth flow
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${process.env.FRONTEND_URL}/api/admin/auth/google`)}&response_type=code&scope=email%20profile&access_type=online&prompt=select_account`;
    
    return NextResponse.redirect(authUrl);

  } catch (error) {
    console.error('Admin Google OAuth error:', error);
    return NextResponse.redirect(`${process.env.FRONTEND_URL}/admin/login?error=server_error`);
  }
}