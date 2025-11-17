import nodemailer from 'nodemailer';

const BRAND_NAME = process.env.BRAND_NAME || "ShopStreak";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "shopstreak18@gmail.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "shopstreak18@gmail.com";

export class EmailService {
  static createTransporter() {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn('⚠️ Email service not configured - using development mode');
      return null;
    }

    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });
  }

  static isConfigured() {
    return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
  }

  static async sendContactForm({ to, subject, html, replyTo }) {
    try {
      const transporter = this.createTransporter();
      
      if (!transporter) {
        console.log(`📧 Development mode - Contact form email:\nTo: ${to}\nSubject: ${subject}\nHTML: ${html}`);
        return { 
          success: true, 
          development: true,
          message: 'Contact form submitted in development mode'
        };
      }

      const mailOptions = {
        from: `${BRAND_NAME} <${process.env.GMAIL_USER}>`,
        to: to,
        subject: subject,
        html: html,
        replyTo: replyTo,
        headers: {
          "X-Priority": "1",
          "X-MSMail-Priority": "High",
        },
      };

      const result = await transporter.sendMail(mailOptions);
      console.log(`✅ Contact form email sent to ${to}: ${result.messageId}`);

      return { 
        success: true, 
        messageId: result.messageId, 
        provider: "gmail",
        development: false
      };
    } catch (error) {
      console.error("❌ Contact form email error:", error.message);
      return { 
        success: false, 
        error: error.message,
        development: true
      };
    }
  }

  // ... keep your existing OTP methods (verificationOTPTemplate, passwordResetTemplate, etc.)
  static async sendOTP(email, otp, type = "email_verification", isResend = false) {
    try {
      const transporter = this.createTransporter();
      
      if (!transporter) {
        console.log(`📧 Development mode - OTP for ${email}: ${otp}`);
        return { 
          success: true, 
          development: true, 
          otp,
          message: 'OTP generated in development mode'
        };
      }

      let subject = "";
      let html = "";

      if (type === "email_verification") {
        if (isResend) {
          subject = `Your New Verification Code - ${BRAND_NAME}`;
          html = this.verificationOTPTemplate(otp, BRAND_NAME, true);
        } else {
          subject = `Verify Your Email Address - ${BRAND_NAME}`;
          html = this.verificationOTPTemplate(otp, BRAND_NAME);
        }
      } else if (type === "password_reset") {
        subject = `Password Reset Code - ${BRAND_NAME}`;
        html = this.passwordResetTemplate(otp, BRAND_NAME);
      }

      const mailOptions = {
        from: `${BRAND_NAME} <${process.env.GMAIL_USER}>`,
        to: email,
        subject,
        html,
        headers: {
          "X-Priority": "1",
          "X-MSMail-Priority": "High",
        },
      };

      const result = await transporter.sendMail(mailOptions);
      console.log(`✅ OTP email sent to ${email}: ${result.messageId}`);

      return { 
        success: true, 
        messageId: result.messageId, 
        provider: "gmail",
        development: false
      };
    } catch (error) {
      console.error("❌ Email service error:", error.message);
      return { 
        success: false, 
        error: error.message, 
        otp,
        development: true
      };
    }
  }

  static verificationOTPTemplate(otp, brand, isResend = false) {
    const action = isResend ? "verify your email address" : "complete your registration";
    const title = isResend ? "New Verification Code" : "Verify Your Email Address";
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title} - ${brand}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 20px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          max-width: 500px;
          width: 100%;
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #0b3b8c, #1e40af);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 15px;
        }
        .logo-svg {
          width: 40px;
          height: 40px;
        }
        .logo-text {
          font-size: 28px;
          font-weight: bold;
        }
        .title {
          font-size: 20px;
          font-weight: 600;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
          color: #374151;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 20px;
          line-height: 1.6;
        }
        .otp-container {
          text-align: center;
          margin: 30px 0;
        }
        .otp-box {
          display: inline-block;
          background: linear-gradient(135deg, #0b3b8c, #1e40af);
          color: white;
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          padding: 20px 40px;
          border-radius: 12px;
          box-shadow: 0 8px 20px rgba(11, 59, 140, 0.3);
        }
        .warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 16px;
          margin: 20px 0;
          text-align: center;
        }
        .warning-icon {
          color: #f39c12;
          font-size: 18px;
          margin-bottom: 8px;
        }
        .instructions {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .support {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          margin-top: 25px;
          text-align: center;
          border: 1px solid #e9ecef;
        }
        .support-title {
          font-weight: 600;
          color: #495057;
          margin-bottom: 8px;
        }
        .support-contact {
          color: #0b3b8c;
          text-decoration: none;
          font-weight: 500;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          border-top: 1px solid #e9ecef;
          color: #6b7280;
          font-size: 12px;
        }
        .social-links {
          margin: 15px 0;
        }
        .social-links a {
          margin: 0 10px;
          color: #0b3b8c;
          text-decoration: none;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-container">
            <svg class="logo-svg" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M60 60 H140 V140 H60 Z" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M80 100 Q100 120 120 100" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div class="logo-text">${brand}</div>
          </div>
          <div class="title">${title}</div>
        </div>
        
        <div class="content">
          <div class="greeting">
            <p>Hello,</p>
            <p>Use the following verification code to ${action} for your <strong>${brand}</strong> account:</p>
          </div>

          <div class="otp-container">
            <div class="otp-box">${otp}</div>
          </div>

          <div class="warning">
            <div class="warning-icon">⚠️</div>
            <strong>Important Security Notice:</strong>
            <p>This code will expire in 10 minutes. Do not share this code with anyone.</p>
          </div>

          <div class="instructions">
            <p>If you didn't request this code, please ignore this email or contact our support team immediately.</p>
          </div>

          <div class="support">
            <div class="support-title">Need Help?</div>
            <p>Contact our support team: <a href="mailto:${SUPPORT_EMAIL}" class="support-contact">${SUPPORT_EMAIL}</a></p>
          </div>
        </div>

        <div class="footer">
          <div class="social-links">
            <a href="#">Website</a> • 
            <a href="#">Support</a> • 
            <a href="#">Privacy Policy</a>
          </div>
          <p>&copy; ${new Date().getFullYear()} ${brand}. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  static passwordResetTemplate(otp, brand) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Password Reset - ${brand}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 20px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          max-width: 500px;
          width: 100%;
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #dc2626, #ef4444);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 15px;
        }
        .logo-svg {
          width: 40px;
          height: 40px;
        }
        .logo-text {
          font-size: 28px;
          font-weight: bold;
        }
        .title {
          font-size: 20px;
          font-weight: 600;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
          color: #374151;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 20px;
          line-height: 1.6;
        }
        .otp-container {
          text-align: center;
          margin: 30px 0;
        }
        .otp-box {
          display: inline-block;
          background: linear-gradient(135deg, #dc2626, #ef4444);
          color: white;
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          padding: 20px 40px;
          border-radius: 12px;
          box-shadow: 0 8px 20px rgba(220, 38, 38, 0.3);
        }
        .warning {
          background: #fed7d7;
          border: 1px solid #feb2b2;
          border-radius: 8px;
          padding: 16px;
          margin: 20px 0;
          text-align: center;
          color: #742a2a;
        }
        .instructions {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .support {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          margin-top: 25px;
          text-align: center;
          border: 1px solid #e9ecef;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          border-top: 1px solid #e9ecef;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-container">
            <svg class="logo-svg" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M60 60 H140 V140 H60 Z" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M80 100 Q100 120 120 100" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div class="logo-text">${brand}</div>
          </div>
          <div class="title">Password Reset Request</div>
        </div>
        
        <div class="content">
          <div class="greeting">
            <p>Hello,</p>
            <p>You have requested to reset your password for your <strong>${brand}</strong> account.</p>
          </div>

          <div class="otp-container">
            <div class="otp-box">${otp}</div>
          </div>

          <div class="warning">
            <strong>Security Alert:</strong>
            <p>This reset code will expire in 10 minutes. If you didn't request this reset, please secure your account immediately.</p>
          </div>

          <div class="instructions">
            <p>Enter this code in the password reset page to create a new password for your account.</p>
          </div>

          <div class="support">
            <p>If you need assistance, contact our support team at <strong>${SUPPORT_EMAIL}</strong></p>
          </div>
        </div>

        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${brand}. All rights reserved.</p>
          <p>This is an automated security message.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }
}