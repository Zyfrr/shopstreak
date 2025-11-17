// app/api/auth/google/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_User from '@/models/SS_User';
import SS_Customer from '@/models/SS_Customer';
import { OAuth2Client } from 'google-auth-library';
import { ApiResponse } from '@/lib/utils';

// Handle POST requests (Google One-Tap Sign-In)
export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        ApiResponse.error('Google token is required'),
        { status: 400 }
      );
    }

    console.log('🔐 Google One-Tap login attempt received');

    // Verify Google token
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    
    if (!payload || !payload.email) {
      return NextResponse.json(
        ApiResponse.error('Invalid Google token'),
        { status: 400 }
      );
    }

    const { email, sub: googleId, given_name, family_name, picture } = payload;

    console.log('🔐 Processing Google login for:', email);

    // Check if user exists with this Google ID or email
    let user = await SS_User.findOne({ 
      $or: [
        { SS_GOOGLE_ID: googleId },
        { SS_USER_EMAIL: email.toLowerCase() }
      ]
    });
    
    let onboardingStatus = 'completed';

    if (!user) {
      // Create new user with Google
      user = new SS_User({
        SS_USER_EMAIL: email.toLowerCase(),
        SS_GOOGLE_ID: googleId,
        SS_AUTH_PROVIDER: 'google',
        SS_EMAIL_VERIFIED: true,
        SS_ONBOARDING_STATUS: 'profile_setup',
        SS_USER_STATUS: 'active'
      });
      await user.save();
      onboardingStatus = 'profile_setup';
      console.log('✅ New Google user created:', user._id);
    } else {
      // Link Google account to existing user if not already linked
      if (!user.SS_GOOGLE_ID) {
        user.SS_GOOGLE_ID = googleId;
        user.SS_AUTH_PROVIDER = 'google';
        user.SS_EMAIL_VERIFIED = true;
        await user.save();
        console.log('✅ Google account linked to existing user');
      }

      // Check if user has completed profile
      const customerProfile = await SS_Customer.findOne({ SS_USER_ID: user._id });
      onboardingStatus = customerProfile ? 'completed' : user.SS_ONBOARDING_STATUS;
      
      // Update user onboarding status if needed
      if (onboardingStatus !== user.SS_ONBOARDING_STATUS) {
        user.SS_ONBOARDING_STATUS = onboardingStatus;
        await user.save();
      }
    }

    // Generate JWT tokens
    const jwt = await import('jsonwebtoken');
    const userId = user._id.toString();
    
    const accessToken = jwt.sign(
      {
        userId: userId,
        email: user.SS_USER_EMAIL,
        role: user.SS_USER_ROLE,
        onboardingStatus: onboardingStatus
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      {
        userId: userId,
        type: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Store refresh token
    user.SS_REFRESH_TOKEN = refreshToken;
    await user.save();

    // Get customer profile if exists
    const customerProfile = await SS_Customer.findOne({ SS_USER_ID: user._id });

    console.log('✅ Google login successful for:', email);

    const responseData = {
      user: {
        id: userId,
        email: user.SS_USER_EMAIL,
        role: user.SS_USER_ROLE,
        authProvider: user.SS_AUTH_PROVIDER,
        emailVerified: user.SS_EMAIL_VERIFIED,
        onboardingStatus: onboardingStatus
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 24 * 60 * 60
      }
    };

    // Add customer profile if exists
    if (customerProfile) {
      responseData.customerProfile = {
        firstName: customerProfile.SS_FIRST_NAME,
        lastName: customerProfile.SS_LAST_NAME,
        mobileNumber: customerProfile.SS_MOBILE_NUMBER,
        dateOfBirth: customerProfile.SS_DATE_OF_BIRTH,
        gender: customerProfile.SS_GENDER,
        addresses: customerProfile.SS_ADDRESSES
      };
    }

    return NextResponse.json(
      ApiResponse.success(responseData, 'Google login successful'),
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Google login error:', error);
    
    if (error.message.includes('Token used too late')) {
      return NextResponse.json(
        ApiResponse.error('Google token has expired. Please try again.'),
        { status: 400 }
      );
    }

    return NextResponse.json(
      ApiResponse.error('Google authentication failed. Please try again.'),
      { status: 500 }
    );
  }
}

// Handle GET requests (OAuth redirect flow)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    console.log('🔄 Google OAuth callback received:', { code: !!code, error });

    // If there's an error from Google
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(`${process.env.FRONTEND_URL}/auth/login?error=google_oauth_failed&message=${error}`);
    }

    // If we have a code, process it
    if (code) {
      console.log('🔄 Processing authorization code...');
      
      // Create OAuth client
      const oauthClient = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.FRONTEND_URL}/api/auth/google`
      );

      try {
        // Exchange code for tokens
        console.log('🔄 Exchanging code for tokens...');
        const { tokens } = await oauthClient.getToken({
          code,
          redirect_uri: `${process.env.FRONTEND_URL}/api/auth/google`
        });

        console.log('✅ Tokens received successfully');

        // Get user info from Google
        const ticket = await oauthClient.verifyIdToken({
          idToken: tokens.id_token,
          audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        
        if (!payload || !payload.email) {
          console.error('Invalid token payload');
          return NextResponse.redirect(`${process.env.FRONTEND_URL}/auth/login?error=invalid_token`);
        }

        const { email, sub: googleId } = payload;
        console.log('👤 User info from Google:', { email, googleId });

        await dbConnect();

        // Find or create user
        let user = await SS_User.findOne({ 
          $or: [
            { SS_GOOGLE_ID: googleId },
            { SS_USER_EMAIL: email.toLowerCase() }
          ]
        });
        
        let onboardingStatus = 'completed';

        if (!user) {
          user = new SS_User({
            SS_USER_EMAIL: email.toLowerCase(),
            SS_GOOGLE_ID: googleId,
            SS_AUTH_PROVIDER: 'google',
            SS_EMAIL_VERIFIED: true,
            SS_ONBOARDING_STATUS: 'profile_setup',
            SS_USER_STATUS: 'active'
          });
          await user.save();
          onboardingStatus = 'profile_setup';
          console.log('✅ New user created via OAuth');
        } else {
          if (!user.SS_GOOGLE_ID) {
            user.SS_GOOGLE_ID = googleId;
            user.SS_AUTH_PROVIDER = 'google';
            user.SS_EMAIL_VERIFIED = true;
            await user.save();
            console.log('✅ Google account linked to existing user');
          }

          const customerProfile = await SS_Customer.findOne({ SS_USER_ID: user._id });
          onboardingStatus = customerProfile ? 'completed' : user.SS_ONBOARDING_STATUS;
        }

        // Generate JWT tokens
        const jwt = await import('jsonwebtoken');
        const userId = user._id.toString();
        
        const accessToken = jwt.sign(
          {
            userId: userId,
            email: user.SS_USER_EMAIL,
            role: user.SS_USER_ROLE,
            onboardingStatus: onboardingStatus
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        const refreshToken = jwt.sign(
          {
            userId: userId,
            type: 'refresh'
          },
          process.env.JWT_REFRESH_SECRET,
          { expiresIn: '7d' }
        );

        // Store refresh token
        user.SS_REFRESH_TOKEN = refreshToken;
        await user.save();

        console.log('✅ Google OAuth successful, redirecting to login with tokens');

        // Create redirect URL with tokens
        const redirectUrl = new URL(`${process.env.FRONTEND_URL}/auth/login`);
        
        redirectUrl.searchParams.set('google_success', 'true');
        redirectUrl.searchParams.set('access_token', accessToken);
        redirectUrl.searchParams.set('refresh_token', refreshToken);
        redirectUrl.searchParams.set('user_id', userId);
        redirectUrl.searchParams.set('onboarding_status', onboardingStatus);

        return NextResponse.redirect(redirectUrl);

      } catch (oauthError) {
        console.error('❌ OAuth token exchange error:', oauthError);
        return NextResponse.redirect(`${process.env.FRONTEND_URL}/auth/login?error=token_exchange_failed`);
      }
    }

    // If no code and no error, initiate OAuth flow
    console.log('🔄 Initiating Google OAuth flow...');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${process.env.FRONTEND_URL}/api/auth/google`)}&response_type=code&scope=email%20profile&access_type=online&prompt=select_account`;
    
    console.log('🔗 Redirecting to Google OAuth:', authUrl);
    return NextResponse.redirect(authUrl);

  } catch (error) {
    console.error('❌ Google OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.FRONTEND_URL}/auth/login?error=server_error`);
  }
}