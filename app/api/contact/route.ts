import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create email content
    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Submission - ShopStreak</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #0b3b8c, #1e40af); color: white; padding: 30px; text-align: center; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 30px; color: #374151; }
          .field { margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb; }
          .label { font-weight: 600; color: #0b3b8c; margin-bottom: 5px; }
          .value { color: #6b7280; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e9ecef; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">ShopStreak</div>
            <div>New Contact Form Submission</div>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Name</div>
              <div class="value">${name}</div>
            </div>
            <div class="field">
              <div class="label">Email</div>
              <div class="value">${email}</div>
            </div>
            <div class="field">
              <div class="label">Phone</div>
              <div class="value">${phone || 'Not provided'}</div>
            </div>
            <div class="field">
              <div class="label">Subject</div>
              <div class="value">${subject}</div>
            </div>
            <div class="field">
              <div class="label">Message</div>
              <div class="value" style="white-space: pre-wrap;">${message}</div>
            </div>
          </div>
          <div class="footer">
            <p>This message was sent from the ShopStreak contact form</p>
            <p>&copy; ${new Date().getFullYear()} ShopStreak. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using your EmailService
    const emailResult = await EmailService.sendContactForm({
      to: 'shopstreak18@gmail.com',
      subject: `Contact Form: ${subject}`,
      html: emailContent,
      replyTo: email,
    });

    if (!emailResult.success) {
      console.error('Email sending failed:', emailResult.error);
      // Still return success to user even if email fails (for better UX)
    }

    return NextResponse.json({
      success: true,
      message: 'Contact form submitted successfully',
      emailSent: emailResult.success
    });

  } catch (error) {
    console.error('Contact form API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}